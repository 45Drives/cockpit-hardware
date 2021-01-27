# cockpit-hardware
A cockpit module for 45Drives storage servers.

## Supported OS
- CentOS 8.X
- CentOS 7.X
- Ubuntu 20.04.1 LTS (Focal Fossa) (Requires Version >= 1.0.3)

## Features (Version 1.0.3)
### System Information
<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/master/documentation/system_overview.png">
<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/master/documentation/system_detail.png">
Lists information about your 45Drives Storinator product including:

* System Information (model, serial and chassis data)
* Motherboard (manufacturer, model and serial numbers)
* CPU (Model and temperature)
* PCI Devices (Speeds, slot numbers, bus addresses, installed cards, and models)
* Memory (Location, Memory Type, Size, Manufacturer, serial and temperature readings)
* Network Information (Connection Names, States, MAC & IP Addresses, and PCI information if detected)

### Interactive Motherboard Application
Shows the physical layout and placement of all PCI cards, Memory modules and SATA connections. 

<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/master/documentation/interactive_motherboard.png">

Currently supports the following motherboard models:
* X11DPL-i
* X11SPL-F
* H11SSL-i
* X11SSH-CTF
* X11SSM-F

## Installation
note, you will need to install the latest [45Drives-tools](https://github.com/45Drives/tools) package.
### RPM Package:
#### CentOS 7:
Download the latest .rpm from the [releases page](https://github.com/45Drives/cockpit-hardware/releases).
```
[root@server ~]# systemctl stop cockpit.socket
[root@server ~]# yum install /path/to/downloaded/RPM/package/
[root@server ~]# systemctl start --now cockpit.socket
```

You may need to set a firewall exception for cockpit in order to access the webpage.
```
[root@server ~]# firewall-cmd --permanent --zone=public --add-service=cockpit
[root@server ~]# firewall-cmd --reload
```

#### CentOS 8:
Download the latest .rpm from the [releases page](https://github.com/45Drives/cockpit-hardware/releases).
```
[root@server ~]# systemctl stop cockpit.socket
[root@server ~]# dnf install /path/to/downloaded/RPM/package/
[root@server ~]# systemctl start --now cockpit.socket
```
You may need to set a firewall exception for cockpit in order to access the webpage.
```
[root@server ~]# firewall-cmd --permanent --zone=public --add-service=cockpit
[root@server ~]# firewall-cmd --reload
```

### .deb Package:
#### Ubuntu:
Download the latest .deb package from the [releases page](https://github.com/45Drives/cockpit-hardware/releases).
```
[admin@server ~]# sudo systemctl stop cockpit.socket
[admin@server ~]# sudo apt install /path/to/downloaded/DEB/package/
[admin@server ~]# sudo systemctl start --now cockpit.socket
```

## Usage
Enter the ip address of your storage server into a web browser using port 9090.
Example:
```
http://192.168.13.37:9090
```
Then enter your login credentials (you must have admin rights to use cockpit-hardware)
<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/master/documentation/login.png">
