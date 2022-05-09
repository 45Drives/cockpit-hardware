# A script that you can use to sync the compiled app to a server running cockpit.
# you need to be able to ssh into it with a copied key prior to running.

TEST_SERVER_A="192.168.13.44"
TEST_SERVER_B="192.168.35.36"
COCKPIT_MODULE="45drives-motherboard"

echo "Running npm run build"
npm run build

 # Test Server A
echo "Stopping Cockpit on $TEST_SERVER_A..."
ssh root@$TEST_SERVER_A "systemctl stop cockpit.socket"

#echo "Copying contents of dist folder to proper fakeroot location"
#cp -a ./dist/* ./fakeroot/usr/share/cockpit/$COCKPIT_MODULE/

echo "Removing cockpit module ($COCKPIT_MODULE) from $TEST_SERVER_A..."
ssh root@$TEST_SERVER_A "rm -rf /usr/share/cockpit/$COCKPIT_MODULE"

echo "updating $COCKPIT_MODULE on $TEST_SERVER_A using rsync..."
rsync -a ./dist/ root@$TEST_SERVER_A:/usr/share/cockpit/$COCKPIT_MODULE/

echo "Restarting Cockpit on $TEST_SERVER_A..."
ssh root@$TEST_SERVER_A "systemctl start --now cockpit.socket"


# Test Server B
echo "Stopping Cockpit on $TEST_SERVER_B..."
ssh root@$TEST_SERVER_B "systemctl stop cockpit.socket"

#echo "Copying contents of dist folder to proper fakeroot location"
#cp -a ./dist/* ./fakeroot/usr/share/cockpit/$COCKPIT_MODULE/

echo "Removing cockpit module ($COCKPIT_MODULE) from $TEST_SERVER_B..."
ssh root@$TEST_SERVER_B "rm -rf /usr/share/cockpit/$COCKPIT_MODULE"

echo "updating $COCKPIT_MODULE on $TEST_SERVER_B using rsync..."
rsync -a ./dist/ root@$TEST_SERVER_B:/usr/share/cockpit/$COCKPIT_MODULE/

echo "Restarting Cockpit on $TEST_SERVER_B..."
ssh root@$TEST_SERVER_B "systemctl start --now cockpit.socket"