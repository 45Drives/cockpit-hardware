echo "Don't run this if you have a ~/rpmbuild folder that you don't want to lose!"
read -p "Are you sure you want to continue ? (yes/no) " con
case $con in
    yes)
        ;;
    *)
        echo "exiting..."
        exit 0
        ;;
esac

read -p "Which Version? (eg 1.2.1): " ver

mkdir 45drives-temp
cd 45drives-temp
mkdir rpmbuild rpmbuild/RPMS rpmbuild/SOURCES rpmbuild/SPECS rpmbuild/SRPMS
git clone --branch dev https://github.com/45Drives/cockpit-hardware.git
cd cockpit-hardware
git checkout tags/$ver
checkout=$?
cd ..
if [ $checkout != 0 ]; then
	echo "version does not exist. Try a different version."
	cd ..
	rm -rf 45drives-temp
	exit 1
fi
mkdir cockpit-45drives-hardware-$ver
cp -r cockpit-hardware/src/fakeroot/usr cockpit-45drives-hardware-$ver/usr
tar -zcvf cockpit-45drives-hardware-$ver.tar.gz cockpit-45drives-hardware-$ver/
rm -rf cockpit-45drives-hardware-$ver
mv cockpit-45drives-hardware-$ver.tar.gz rpmbuild/SOURCES/cockpit-45drives-hardware-$ver.tar.gz
mv cockpit-hardware/rpm/cockpit-45drives-hardware.spec rpmbuild/SPECS/cockpit-45drives-hardware-$ver.spec
rm -rf cockpit-hardware
rm -rf ~/rpmbuild
cd ..
cp -r 45drives-temp/rpmbuild ~/rpmbuild
rm -rf 45drives-temp
cd ~/rpmbuild
vim SPECS/cockpit-45drives-hardware-$ver.spec
rpmbuild -ba SPECS/cockpit-45drives-hardware-$ver.spec
