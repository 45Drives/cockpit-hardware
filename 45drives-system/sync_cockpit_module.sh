# A script that you can use to sync the compiled app to a server running cockpit.
# you need to be able to ssh into it with a copied key prior to running.

TEST_SERVER="192.168.13.44"
COCKPIT_MODULE="45drives-system"

echo "Running npm run build"
npm run build

echo "Stopping Cockpit on $TEST_SERVER..."
ssh root@$TEST_SERVER "systemctl stop cockpit.socket"

#echo "Copying contents of dist folder to proper fakeroot location"
#cp -a ./dist/* ./fakeroot/usr/share/cockpit/$COCKPIT_MODULE/

echo "Removing cockpit module ($COCKPIT_MODULE) from $TEST_SERVER..."
ssh root@$TEST_SERVER "rm -rf /usr/share/cockpit/$COCKPIT_MODULE"

echo "updating $COCKPIT_MODULE on $TEST_SERVER using rsync..."
rsync -a ./dist/ root@$TEST_SERVER:/usr/share/cockpit/$COCKPIT_MODULE/

echo "Restarting Cockpit on $TEST_SERVER..."
ssh root@$TEST_SERVER "systemctl start --now cockpit.socket"
