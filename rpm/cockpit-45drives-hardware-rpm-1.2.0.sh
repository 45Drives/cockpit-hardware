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


mkdir 45drives-temp
cd 45drives-temp
mkdir rpmbuild rpmbuild/RPMS rpmbuild/SOURCES rpmbuild/SPECS rpmbuild/SRPMS
git clone --branch master https://github.com/45Drives/cockpit-hardware.git
mkdir cockpit-45drives-hardware-1.2.1
cp -r cockpit-hardware/src/fakeroot/usr cockpit-45drives-hardware-1.2.1/usr
tar -zcvf cockpit-45drives-hardware-1.2.1.tar.gz cockpit-45drives-hardware-1.2.1/
rm -rf cockpit-45drives-hardware-1.2.1
mv cockpit-45drives-hardware-1.2.1.tar.gz rpmbuild/SOURCES/cockpit-45drives-hardware-1.2.1.tar.gz
mv cockpit-hardware/rpm/cockpit-45drives-hardware-1.2.1.spec rpmbuild/SPECS/cockpit-45drives-hardware-1.2.1.spec
rm -rf cockpit-hardware
rm -rf ~/rpmbuild
cd ..
cp -r 45drives-temp/rpmbuild ~/rpmbuild
rm -rf 45drives-temp
cd ~/rpmbuild
rpmbuild -ba SPECS/cockpit-45drives-hardware-1.2.1.spec
