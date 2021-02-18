#!/usr/bin/bash
mkdir 45drives-cockpit-hardware_1.2.0-2
git clone --branch 1.2.0 https://github.com/45Drives/cockpit-hardware.git
cp -R cockpit-hardware/src/fakeroot/* 45drives-cockpit-hardware_1.2.0-2
cp -r cockpit-hardware/deb/DEBIAN/1.2.0-2 45drives-cockpit-hardware_1.2.0-2/DEBIAN
rm -rf cockpit-hardware
dpkg-deb --build 45drives-cockpit-hardware_1.2.0-2