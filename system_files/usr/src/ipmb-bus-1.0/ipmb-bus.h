// SPDX-License-Identifier: GPL-2.0-or-later
/*
 * ipmb-bus.h - Part of 45d-fancontrol, Linux kernel module for exposing
 *             IPMB bus as i2c adapter.
 *
 * (C) 2026 by Joshua Boudreau <jboudreau@45drives.com>
 */

#ifndef _IPMB_BUS_H
#define _IPMB_BUS_H

#include <linux/notifier.h>

/* Events passed as the 'action' argument to notifier callbacks */
#define IPMB_BUS_ADAPTER_ADDED		1
#define IPMB_BUS_ADAPTER_REMOVED	2

/* Defined and exported by ipmb-bus module. Data pointer is struct i2c_adapter *. */
extern struct blocking_notifier_head ipmb_bus_notifier_list;

static inline int ipmb_bus_register_notifier(struct notifier_block *nb)
{
	return blocking_notifier_chain_register(&ipmb_bus_notifier_list, nb);
}

static inline int ipmb_bus_unregister_notifier(struct notifier_block *nb)
{
	return blocking_notifier_chain_unregister(&ipmb_bus_notifier_list, nb);
}

int ipmb_bus_for_each_adapter(int (*fn)(struct i2c_adapter *adap, void *data), void *data);

#endif /* _IPMB_BUS_H */
