// SPDX-License-Identifier: GPL-2.0-or-later
/*
 * ipmb-bus.c - Part of 45d-fancontrol, Linux kernel module for exposing
 *             IPMB bus as i2c adapter.
 *
 * (C) 2026 by Joshua Boudreau <jboudreau@45drives.com>
 */

#define pr_fmt(fmt) KBUILD_MODNAME ": " fmt
#define dev_fmt(fmt) KBUILD_MODNAME ": " fmt

#include <linux/module.h>
#include <linux/err.h>
#include <linux/mutex.h>
#include <linux/completion.h>
#include <linux/delay.h>
#include <linux/i2c.h>

#include <linux/ipmi.h>
#include <linux/ipmi_msgdefs.h>

#include "get_error.h"
#include "ipmb-bus.h"

BLOCKING_NOTIFIER_HEAD(ipmb_bus_notifier_list);
EXPORT_SYMBOL_GPL(ipmb_bus_notifier_list);

struct ipmb_bus_data {
	struct list_head list;
	// struct mutex lock;
	struct completion read_complete;
	int interface;
	struct device *ipmi_dev;
	struct ipmi_user *ipmi_user;
	struct i2c_adapter adapter;

	long tx_msgid;

	unsigned char rx_msg_data[IPMI_MAX_MSG_LENGTH];
	unsigned long rx_msg_len;
	unsigned char rx_result;
	int rx_recv_type;
};

struct ipmb_bus_driver_data {
	struct ipmi_user_hndl user_hndl;
	struct i2c_algorithm i2c_algo;
	struct i2c_adapter_quirks i2c_quirks;
	struct ipmi_smi_watcher smi_watcher;
	/**
	 * @brief list of struct ipmb_bus_data
	 * 
	 */
	struct list_head data_list;
};

static void ipmi_recv_hndl(struct ipmi_recv_msg *msg, void *user_msg_data);
static void ipmb_bus_user_shutdown(void *handler_data);

static u32 ipmb_bus_i2c_func(struct i2c_adapter *adapter);
static int ipmb_bus_i2c_xfer(struct i2c_adapter *adapter, struct i2c_msg msgs[],
			     int num);
static int ipmb_bus_i2c_smbus_xfer(struct i2c_adapter *adapter, u16 addr,
				   unsigned short flags, char read_write,
				   u8 command, int size,
				   union i2c_smbus_data *data);

static void ipmb_bus_new_smi(int if_num, struct device *dev);
static void ipmb_bus_smi_gone(int if_num);

static struct ipmb_bus_driver_data driver_data = {
	.user_hndl = {
		.ipmi_recv_hndl = &ipmi_recv_hndl,
		.shutdown = &ipmb_bus_user_shutdown,
	},
	.i2c_algo = {
		.functionality = ipmb_bus_i2c_func,
		.smbus_xfer = ipmb_bus_i2c_smbus_xfer,
		.master_xfer = ipmb_bus_i2c_xfer,
	},
	.i2c_quirks = {
		.flags = I2C_AQ_NO_ZERO_LEN_READ,
		.max_num_msgs = 2,
		.max_read_len = 64,
		// .max_write_len = ???
	},
	.smi_watcher = {
		.new_smi = ipmb_bus_new_smi,
		.smi_gone = ipmb_bus_smi_gone,
		.owner = THIS_MODULE
	},
	.data_list = LIST_HEAD_INIT(driver_data.data_list),
};

int ipmb_bus_for_each_adapter(int (*fn)(struct i2c_adapter *adap, void *data),
			      void *data)
{
	struct ipmb_bus_data *p;
	int ret = 0;

	list_for_each_entry(p, &driver_data.data_list, list) {
		ret = fn(&p->adapter, data);
		if (ret)
			break;
	}
	return ret;
}
EXPORT_SYMBOL_GPL(ipmb_bus_for_each_adapter);

static inline const char *ipmb_bus_ipmi_error_string(int error)
{
	switch (error) {
	case IPMI_CC_NO_ERROR:
		return "IPMI_CC_NO_ERROR";
	case IPMI_NODE_BUSY_ERR:
		return "IPMI_NODE_BUSY_ERR";
	case IPMI_INVALID_COMMAND_ERR:
		return "IPMI_INVALID_COMMAND_ERR";
	case IPMI_TIMEOUT_ERR:
		return "IPMI_TIMEOUT_ERR";
	case IPMI_ERR_MSG_TRUNCATED:
		return "IPMI_ERR_MSG_TRUNCATED";
	case IPMI_REQ_LEN_INVALID_ERR:
		return "IPMI_REQ_LEN_INVALID_ERR";
	case IPMI_REQ_LEN_EXCEEDED_ERR:
		return "IPMI_REQ_LEN_EXCEEDED_ERR";
	case IPMI_DEVICE_IN_FW_UPDATE_ERR:
		return "IPMI_DEVICE_IN_FW_UPDATE_ERR";
	case IPMI_DEVICE_IN_INIT_ERR:
		return "IPMI_DEVICE_IN_INIT_ERR";
	case IPMI_NOT_IN_MY_STATE_ERR:
		return "IPMI_NOT_IN_MY_STATE_ERR";
	case IPMI_LOST_ARBITRATION_ERR:
		return "IPMI_LOST_ARBITRATION_ERR";
	case IPMI_BUS_ERR:
		return "IPMI_BUS_ERR";
	case IPMI_NAK_ON_WRITE_ERR:
		return "IPMI_NAK_ON_WRITE_ERR";
	case IPMI_ERR_UNSPECIFIED:
		return "IPMI_ERR_UNSPECIFIED";
	default:
		return "Unknown IPMI error";
	}
}

static inline int ipmb_bus_map_ipmi_error_to_errno(int ipmi_error)
{
	switch (ipmi_error) {
	case IPMI_CC_NO_ERROR:
		return 0;
	case IPMI_NODE_BUSY_ERR:
		return -EBUSY;
	case IPMI_INVALID_COMMAND_ERR:
		return -EINVAL;
	case IPMI_TIMEOUT_ERR:
		return -ETIMEDOUT;
	case IPMI_ERR_MSG_TRUNCATED:
		return -EOVERFLOW;
	case IPMI_REQ_LEN_INVALID_ERR:
		return -EINVAL;
	case IPMI_REQ_LEN_EXCEEDED_ERR:
		return -EMSGSIZE;
	case IPMI_DEVICE_IN_FW_UPDATE_ERR:
		return -EBUSY;
	case IPMI_DEVICE_IN_INIT_ERR:
		return -EBUSY;
	case IPMI_NOT_IN_MY_STATE_ERR:
		return -EIO;
	case IPMI_LOST_ARBITRATION_ERR:
		return -EAGAIN;
	case IPMI_BUS_ERR:
		return -EIO;
	case IPMI_NAK_ON_WRITE_ERR:
		return -EIO;
	case IPMI_ERR_UNSPECIFIED:
		return -EIO;
	default:
		return -EIO;
	}
}

static int ipmb_bus_i2c_transaction(struct ipmb_bus_data *data, u8 addr,
				    const u8 *tx_data, u8 tx_length, u8 *rx_buf,
				    u8 rx_count);

static struct ipmb_bus_data *ipmb_bus_get_data(int interface)
{
	struct ipmb_bus_data *p, *next;

	list_for_each_entry_safe(p, next, &driver_data.data_list, list)
		if (p->interface == interface)
			return p;

	return NULL;
}

static int ipmb_bus_i2c_xfer(struct i2c_adapter *adapter, struct i2c_msg msgs[],
			     int num)
{
	int result;
	struct ipmb_bus_data *data = i2c_get_adapdata(adapter);

	dev_info(&adapter->dev, "%s: processing %d messages\n", __func__, num);

	// mutex_lock(&data->lock);

	if (num == 1) {
		if (msgs->flags & I2C_M_RD) {
			// read
			result = ipmb_bus_i2c_transaction(data, msgs->addr,
							  NULL, 0, msgs->buf,
							  msgs->len);
		} else {
			// write
			result = ipmb_bus_i2c_transaction(data, msgs->addr,
							  msgs->buf, msgs->len,
							  NULL, 0);
		}
		if (result < 0)
			goto out;
		result = num;
	} else if (num == 2) {
		if ((msgs[0].addr == msgs[1].addr &&
		     !(msgs[0].flags & I2C_M_RD) &&
		     (msgs[1].flags & I2C_M_RD))) {
			// write then read
			result = ipmb_bus_i2c_transaction(
				data, msgs[0].addr, msgs[0].buf, msgs[0].len,
				msgs[1].buf, msgs[1].len);
			if (result < 0)
				goto out;
			result = num;
		} else {
			dev_err(&data->adapter.dev,
				"%s: unsupported multi-msg i2c transaction\n",
				__func__);
			result = -EOPNOTSUPP;
		}
	} else {
		dev_err(&data->adapter.dev,
			"%s: unsupported multi-msg i2c transaction\n",
			__func__);
		result = -EOPNOTSUPP;
	}

out:
	// mutex_unlock(&data->lock);
	return result;
}

static int ipmb_bus_i2c_smbus_xfer(struct i2c_adapter *adapter, u16 addr,
				   unsigned short flags, char read_write,
				   u8 command, int size,
				   union i2c_smbus_data *data)
{
	int result;
	struct ipmb_bus_data *d = i2c_get_adapdata(adapter);
	u8 *buffer = NULL;

	dev_dbg(&adapter->dev, "%s: size: %d", __func__, size);

	switch (size) {
	case I2C_SMBUS_QUICK:
		if (read_write == I2C_SMBUS_READ)
			result = ipmb_bus_i2c_transaction(d, addr, NULL, 0,
							  NULL, 0);
		else
			result = ipmb_bus_i2c_transaction(d, addr, NULL, 0,
							  NULL, 0);
		break;
	case I2C_SMBUS_BYTE:
		if (read_write == I2C_SMBUS_READ)
			result = ipmb_bus_i2c_transaction(d, addr, NULL, 0,
							  &data->byte, 1);
		else
			result = ipmb_bus_i2c_transaction(d, addr, &data->byte,
							  1, NULL, 0);
		break;
	case I2C_SMBUS_BYTE_DATA:
		if (read_write == I2C_SMBUS_READ) {
			result = ipmb_bus_i2c_transaction(d, addr, &command,
							  sizeof(command),
							  &data->byte,
							  sizeof(data->byte));
		} else {
			buffer = kzalloc(sizeof(command) + sizeof(data->byte),
					 GFP_KERNEL);
			buffer[0] = command;
			buffer[1] = data->byte;
			result = ipmb_bus_i2c_transaction(
				d, addr, buffer,
				sizeof(command) + sizeof(data->byte), NULL, 0);
			kfree(buffer);
		}
		break;
	case I2C_SMBUS_WORD_DATA:
		if (read_write == I2C_SMBUS_READ) {
			result = ipmb_bus_i2c_transaction(d, addr, &command,
							  sizeof(command),
							  (u8 *)&data->word,
							  sizeof(data->word));
		} else {
			buffer = kzalloc(sizeof(command) + sizeof(data->word),
					 GFP_KERNEL);
			buffer[0] = command;
			buffer[1] = data->word & 0xff;
			buffer[2] = (data->word >> 8) & 0xff;
			result = ipmb_bus_i2c_transaction(
				d, addr, buffer,
				sizeof(command) + sizeof(data->word), NULL, 0);
			kfree(buffer);
		}
		break;
	case I2C_SMBUS_BLOCK_DATA:
		if (read_write == I2C_SMBUS_READ) {
			result = ipmb_bus_i2c_transaction(d, addr, &command,
							  sizeof(command),
							  data->block,
							  data->block[0]);
		} else {
			buffer = kzalloc(sizeof(command) + data->block[0] + 1,
					 GFP_KERNEL);
			buffer[0] = command;
			memcpy(&buffer[1], data->block, data->block[0] + 1);
			result = ipmb_bus_i2c_transaction(
				d, addr, buffer,
				sizeof(command) + data->block[0] + 1, NULL, 0);
			kfree(buffer);
		}
		break;
	default:
		dev_err(&d->adapter.dev,
			"%s: unsupported smbus transaction size:%d\n", __func__,
			size);
		result = -EOPNOTSUPP;
	}

	if (result < 0) {
		dev_err(&d->adapter.dev, "%s: error: %s\n", __func__,
			get_error(result));
		return result;
	}
	return 0;
}

static u32 ipmb_bus_i2c_func(struct i2c_adapter *adapter)
{
	return I2C_FUNC_I2C | I2C_FUNC_SMBUS_QUICK | I2C_FUNC_SMBUS_BYTE |
	       I2C_FUNC_SMBUS_BYTE_DATA | I2C_FUNC_SMBUS_WORD_DATA |
	       I2C_FUNC_SMBUS_BLOCK_DATA;
}

struct ipmb_request_payload {
	u8 ipmb_bus;
	// 8-bit addr
	u8 ipmb_addr;
	u8 rlen;
	u8 wdata[];
} __packed;

static int ipmb_bus_send_message(struct ipmb_bus_data *data,
				 struct ipmi_addr *address,
				 struct kernel_ipmi_msg *message)
{
	int result;
	result = ipmi_validate_addr(address, sizeof(struct ipmi_addr));
	if (result)
		goto out;

	data->tx_msgid++;

	dev_dbg(&data->adapter.dev, "%s: sending msgid %ld\n", __func__,
		 data->tx_msgid);

	reinit_completion(&data->read_complete);
	result = ipmi_request_settime(data->ipmi_user, address, data->tx_msgid,
				      message, data, 0, data->adapter.retries,
				      data->adapter.timeout);

out:
	return result;
}

/**
 * returns message length, or neg error code
 */
static int ipmb_bus_i2c_transaction(struct ipmb_bus_data *data, u8 addr,
				    const u8 *tx_data, u8 tx_length, u8 *rx_buf,
				    u8 rx_count)
{
	int result;
	struct ipmi_system_interface_addr address;
	struct kernel_ipmi_msg message;
	size_t data_length = sizeof(struct ipmb_request_payload) + tx_length;
	struct ipmb_request_payload *payload =
		(struct ipmb_request_payload *)kzalloc(data_length, GFP_KERNEL);
	if (!payload) {
		return -ENOMEM;
	}

	dev_dbg(&data->adapter.dev,
		 "%s: sending %d, receiving %d. payload size: %lu\n", __func__,
		 tx_length, rx_count, data_length);

	payload->ipmb_bus = 0;
	payload->ipmb_addr = addr << 1;
	payload->rlen = rx_count;

	if (tx_data) {
		memcpy(payload->wdata, tx_data, tx_length);
	}

	for (int i = 0; i < data_length; i++) {
		dev_dbg(&data->adapter.dev, "[%d]=%02x ", i, ((u8 *)payload)[i]);
	}

	address.addr_type = IPMI_SYSTEM_INTERFACE_ADDR_TYPE;
	address.channel = IPMI_BMC_CHANNEL;
	address.lun = 0;

	message.netfn = IPMI_NETFN_APP_REQUEST;
	message.cmd = 0x52;
	message.data_len = data_length;
	message.data = (u8 *)payload;

	result = ipmb_bus_send_message(data, (struct ipmi_addr *)&address,
				       &message);
	if (result)
		goto out;

	wait_for_completion(&data->read_complete);

	if (data->rx_result) {
		dev_err(&data->adapter.dev,
			"%s: IPMI error completion code: %02x: %s\n", __func__,
			data->rx_result,
			ipmb_bus_ipmi_error_string(data->rx_result));
		result = ipmb_bus_map_ipmi_error_to_errno(data->rx_result);
		goto out;
	}

	memcpy(rx_buf, data->rx_msg_data, data->rx_msg_len);
	result = data->rx_msg_len;

out:
	kfree(payload);
	return result;
}

static void ipmi_recv_hndl(struct ipmi_recv_msg *msg, void *user_msg_data)
{
	struct ipmb_bus_data *data = (struct ipmb_bus_data *)user_msg_data;

	if (msg->msgid != data->tx_msgid) {
		dev_err(&data->adapter.dev,
			"%s: msgid mismatch! received: %ld expected: %ld",
			__func__, msg->msgid, data->tx_msgid);
		goto out;
	}
	dev_dbg(&data->adapter.dev, "%s: received resp msgid %ld\n", __func__,
		 msg->msgid);

	data->rx_recv_type = msg->recv_type;
	if (msg->msg.data_len > 0)
		data->rx_result = msg->msg.data[0];
	else
		data->rx_result = IPMI_UNKNOWN_ERR_COMPLETION_CODE;

	if (msg->msg.data_len > 1) {
		data->rx_msg_len = msg->msg.data_len - 1;
		memcpy(data->rx_msg_data, msg->msg.data + 1, data->rx_msg_len);
	} else
		data->rx_msg_len = 0;

	ipmi_free_recv_msg(msg);
	complete(&data->read_complete);
	return;
out:
	ipmi_free_recv_msg(msg);
}

static void ipmb_bus_user_shutdown(void *handler_data)
{
	struct ipmb_bus_data *data = (struct ipmb_bus_data *)handler_data;
	dev_info(data->ipmi_dev, "shutdown\n");
}

static void ipmb_bus_new_smi(int if_num, struct device *dev)
{
	int ret;
	struct ipmb_bus_data *data;

	data = kzalloc(sizeof(*data), GFP_KERNEL);
	if (!data) {
		return;
	}

	INIT_LIST_HEAD(&data->list);
	// mutex_init(&data->lock);
	init_completion(&data->read_complete);

	data->interface = if_num;
	data->ipmi_dev = dev;

	ret = ipmi_create_user(if_num, &driver_data.user_hndl, data,
			       &data->ipmi_user);
	if (ret) {
		dev_err(dev, "%s: Failed to create IPMI user: %s\n", __func__,
			get_error(ret));
		goto err_free_data;
	}

	data->adapter.owner = THIS_MODULE;
	data->adapter.class = I2C_CLASS_HWMON;
	data->adapter.algo = &driver_data.i2c_algo;
	data->adapter.retries = 1;
	data->adapter.timeout = msecs_to_jiffies(500);
	data->adapter.dev.parent = dev;
	snprintf(data->adapter.name, sizeof(data->adapter.name),
		 "IPMB I2C bus on ipmi%d", if_num);

	ret = i2c_add_adapter(&data->adapter);
	if (ret) {
		dev_err(dev, "%s: Failed to add i2c adapter: %s\n", __func__,
			get_error(ret));
		goto err_ipmi_user;
	}
	dev_info(dev, "%s: Added i2c adapter: %s\n", __func__,
		 data->adapter.name);

	i2c_set_adapdata(&data->adapter, data);

	list_add_tail(&data->list, &driver_data.data_list);

	data->tx_msgid = 0;

	blocking_notifier_call_chain(&ipmb_bus_notifier_list,
				     IPMB_BUS_ADAPTER_ADDED, &data->adapter);

	return;

err_ipmi_user:
	ipmi_destroy_user(data->ipmi_user);
err_free_data:
	kfree(data);
}

static void ipmb_bus_cleanup(struct ipmb_bus_data *data)
{
	if (!data)
		return;

	dev_info(&data->adapter.dev, "%s: deleting data for %s\n", __func__,
		 data->adapter.name);

	blocking_notifier_call_chain(&ipmb_bus_notifier_list,
				     IPMB_BUS_ADAPTER_REMOVED, &data->adapter);

	i2c_del_adapter(&data->adapter);
	ipmi_destroy_user(data->ipmi_user);
	kfree(data);
}

static void ipmb_bus_delete(struct ipmb_bus_data *data)
{
	if (!data)
		return;

	ipmb_bus_cleanup(data);

	list_del(&data->list);
}

static void ipmb_bus_smi_gone(int if_num)
{
	pr_info("%s: IPMI SMI if %d gone\n", __func__, if_num);
	struct ipmb_bus_data *data = ipmb_bus_get_data(if_num);

	if (!data)
		return;

	ipmb_bus_delete(data);
}

static int __init ipmb_bus_init(void)
{
	int result = 0;
	pr_info("Loaded!\n");
	if ((result = ipmi_smi_watcher_register(&driver_data.smi_watcher)) !=
	    0) {
		pr_err("%s: Failed to register ipmi smi watcher: %s\n",
		       __func__, get_error(result));
	}
	return result;
}

static void __exit ipmb_bus_exit(void)
{
	int result;
	struct ipmb_bus_data *p, *next;

	list_for_each_entry_safe(p, next, &driver_data.data_list, list)
		ipmb_bus_cleanup(p);

	if ((result = ipmi_smi_watcher_unregister(&driver_data.smi_watcher)) !=
	    0) {
		pr_err("%s: Failed to unregister ipmi smi watcher: %s\n",
		       __func__, get_error(result));
	}
	pr_info("Unloaded!\n");
}

module_init(ipmb_bus_init);
module_exit(ipmb_bus_exit);

MODULE_AUTHOR("Joshua Boudreau <jboudreau@45drives.com>");
MODULE_DESCRIPTION("Expose IPMB I2C bus as I2C adapter");
MODULE_LICENSE("GPL v2");
