TEST_SERVER="192.168.13.33"
TEST_SERVER_B="192.168.13.45"

echo "Stopping Cockpit"
ssh root@$TEST_SERVER "systemctl stop cockpit.socket"
#ssh root@$TEST_SERVER_B "systemctl stop cockpit.socket"

echo "Removing 45drives cockpit modules"
ssh root@$TEST_SERVER "rm -rf /usr/share/cockpit/45drives-*"
#ssh root@$TEST_SERVER_B "rm -rf /usr/share/cockpit/45drives-*"

#echo "Synching hardware folder"
#rsync -a ~/dev/cockpit-hardware/src/fakeroot/usr/share/cockpit/hardware/ root@$TEST_SERVER:/usr/share/cockpit/hardware/

echo "Synching 45drives-system folder"
rsync -a ~/dev/cockpit-hardware/src/fakeroot/usr/share/cockpit/45drives-system root@$TEST_SERVER:/usr/share/cockpit
#rsync -a ~/dev/cockpit-hardware/src/fakeroot/usr/share/cockpit/45drives-system root@$TEST_SERVER_B:/usr/share/cockpit

echo "Synching 45drives-disks folder"
rsync -a ~/dev/cockpit-hardware/src/fakeroot/usr/share/cockpit/45drives-disks root@$TEST_SERVER:/usr/share/cockpit
#rsync -a ~/dev/cockpit-hardware/src/fakeroot/usr/share/cockpit/45drives-disks root@$TEST_SERVER_B:/usr/share/cockpit

echo "Synching 45drives-motherboard folder"
rsync -a ~/dev/cockpit-hardware/src/fakeroot/usr/share/cockpit/45drives-motherboard root@$TEST_SERVER:/usr/share/cockpit
#rsync -a ~/dev/cockpit-hardware/src/fakeroot/usr/share/cockpit/45drives-motherboard root@$TEST_SERVER_B:/usr/share/cockpit

echo "Restarting Cockpit"
ssh root@$TEST_SERVER "systemctl start --now cockpit.socket"
#ssh root@$TEST_SERVER_B "systemctl start --now cockpit.socket"
