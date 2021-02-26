# cockpit-hardware
A cockpit module for 45Drives storage servers.

## Supported OS
- CentOS 7.X
- Ubuntu 20.04.1 LTS (Focal Fossa) (Requires Version >= 1.3.0)

## Features (Version 1.3.0)
### System
<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/dev/documentation/45drives-system.png">  
Lists information about your 45Drives Storinator product including:

* System Information (model, serial and chassis data)
* Motherboard (manufacturer, model and serial numbers)
* CPU (Model and temperature)
* PCI Devices (Speeds, slot numbers, bus addresses, installed cards, and models)
* Memory (Location, Memory Type, Size, Manufacturer, serial and temperature readings)
* Network Information (Connection Names, States, MAC & IP Addresses, and PCI information if detected)

### Disks
Displays disks as they appear physically on your 45Drives Storage Server.
<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/dev/documentation/45drives-disks.png">  

This can show you useful device information including:
* Device Path
* Capacity
* Smartctl information (health, temperature, power on time, etc).
* and more

If ZFS is installed, you can also see additional information.

### Motherboard Viewer
Shows the physical layout and placement of all PCI cards, Memory modules and SATA connections. 

<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/dev/documentation/45drives-motherboard.png">

Currently supports the following motherboard models:
* X11DPL-i
* X11SPL-F
* H11SSL-i
* X11SSH-CTF
* X11SSM-F


# Installation

## CentOS 7

### Add the 45drives-centos.repo
```
cd /etc/yum.repos.d
curl -LO http://images.45drives.com/repo/centos/45drives-centos.repo 
yum clean all
```

### 45drives-centos.repo
```
[45drives_stable]
baseurl = http://images.45drives.com/repo/centos/el$releasever/stable
enabled = 1
gpgcheck = 1
repo_gpgcheck = 1
gpgkey = http://images.45drives.com/repo/keys/rpmpubkey.asc
name = 45Drives Stable Packages
priority = 1

[45drives_testing]
baseurl = http://images.45drives.com/repo/centos/el$releasever/testing
enabled = 0
gpgcheck = 1
repo_gpgcheck = 1
gpgkey = http://images.45drives.com/repo/keys/rpmpubkey.asc
name = 45Drives Testing Packages
priority = 1

```

### Enable the 45drives_testing repo (*optional*)
The **latest versions** of our packages are available in our **45drives_testing** repo.  
By default, the 45drives_testing packages are **not** enabled.  

You can enable them by editing ```/etc/yum.repos.d/45drives-centos.repo``` with a text editor (nano, vim, etc ).  
Simply change ```enabled = 0``` to ```enabled = 1```.  

### Install Package
With the 45drives Repo enabled, you can now install using yum from your terminal.
```
yum install cockpit-45drives-hardware
```

## Ubuntu 20

### Add the 45drives.list
```
cd /etc/apt/sources.list.d
sudo curl -LO http://images.45drives.com/repo/debian/45drives.list
sudo apt update
```

### 45drives.list
```
deb http://images.45drives.com/repo/debian focal main
#deb http://images.45drives.com/repo/debian focal-testing main

```

### Enable the 45drives_testing packages (*optional*)
The **latest versions** of our packages are available in our **45drives_testing** repo.  
By default, the 45drives_testing packages are **not** enabled.  

You can enable them by editing ```/etc/apt/sources.list.d/45drives.list``` with a text editor (nano, vim, etc ).  
You can uncomment (delete the **#** character) the second line.

### Install Package
```
sudo apt install cockpit-45drives-hardware
```

## Usage
Enter the ip address of your storage server into a web browser using port 9090.
Example:
```
http://192.168.13.37:9090
```
Then enter your login credentials (you must have admin rights to use cockpit-hardware)
<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/dev/documentation/houston.png">
