# cockpit-hardware
A cockpit module that displays hardware information for 45Drives storage server products.

## Supported OS
- Rocky Linux
- Ubuntu 20.04.1 LTS (Focal Fossa)

## Features (Version 2.1.1 & up)
### System
<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/master/documentation/45drives-system.png">  
Lists information about your 45Drives Storinator product including:

* System Information (model, serial and chassis data)
* Motherboard (manufacturer, model and serial numbers)
* CPU (Model and temperature)
* PCI Devices (Speeds, slot numbers, bus addresses, installed cards, and models)
* Memory (Location, Memory Type, Size, Manufacturer, serial and temperature readings)
* Network Information (Connection Names, States, MAC & IP Addresses, and PCI information if detected)
* IPMI address information

### Disks
Displays disks as they appear physically on your 45Drives Storage Server.
<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/master/documentation/45drives-disks.png">  

This can show you useful device information including:
* Device Path
* Capacity
* Smartctl information (health, temperature, power on time, etc).
* and more

If ZFS is installed, you can also see additional information.

### Motherboard Viewer
Shows the physical layout and placement of all PCI cards, Memory modules and SATA connections. 

<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/master/documentation/45drives-motherboard.png">

Currently supports the following motherboard models:
* ASRockRack EPC621D8A
* Supermicro H11SSL-i
* Supermicro H12SSL-i
* Supermicro X11DPL-i
* Supermicro X11SPH-nCTF
* Supermicro X11SPH-nCTPF
* Supermicro X11SPL-F
* Supermicro X11SPi-TF
* Supermicro X11SSH-CTF
* Supermicro X11SSM-F
* Supermicro X12DPi-N6
* Supermicro X12SPL-F

Note: All of the interactive information displayed in this module is also available in the 45Drives System module. If your board is not in the list of supported motherboards, the information can be obtained there.


# Installation

## Rocky Linux

### Add the official 45Drives Repo
https://repo.45drives.com/setup.html

### Enable the 45drives_testing repo (*optional*)
The **latest versions** of our packages are available in our **45drives_testing** repo.  
By default, the 45drives_testing packages are **not** enabled.  

You can enable them by editing ```/etc/yum.repos.d/45drives.repo``` with a text editor (nano, vim, etc ).  
Simply change ```enabled = 0``` to ```enabled = 1```. 
**or**
enable using this command: ```sed -i 's/enabled = 0/enabled = 1/g' /etc/yum.repos.d/45drives.repo```

### Install Package
With the 45drives Repo enabled, you can now install using dnf from your terminal.
```
dnf install cockpit-45drives-hardware
```

## Ubuntu 20

### Add the official 45Drives Repo
https://repo.45drives.com/setup.html


### Enable the 45drives_testing packages (*optional*)
The **latest versions** of our packages are available in our **45drives_testing** repo.  
By default, the 45drives_testing packages are **not** enabled.  

You can enable them by editing ```/etc/apt/sources.list.d/45drives.list``` with a text editor (nano, vim, etc ).
simply change ```Enabled: no``` to ```Enabled: yes```.
**or**
enable using this command: ```sed -i 's/Enabled: no/Enabled: yes/g' /etc/apt/sources.list.d/45drives.sources```

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
<img src="https://raw.githubusercontent.com/45Drives/cockpit-hardware/master/documentation/houston.png">
