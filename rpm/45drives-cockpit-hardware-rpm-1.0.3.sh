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
git clone --branch 1.0.3 https://github.com/45Drives/cockpit-hardware.git
mkdir 45drives-cockpit-hardware-1.0.3
cp -r cockpit-hardware/src/fakeroot/usr 45drives-cockpit-hardware-1.0.3/usr
tar -zcvf 45drives-cockpit-hardware-1.0.3.tar.gz 45drives-cockpit-hardware-1.0.3/
rm -rf 45drives-cockpit-hardware-1.0.3
mv 45drives-cockpit-hardware-1.0.3.tar.gz rpmbuild/SOURCES/45drives-cockpit-hardware-1.0.3.tar.gz
mv cockpit-hardware/rpm/45drives-cockpit-hardware-1.0.3.spec rpmbuild/SPECS/45drives-cockpit-hardware-1.0.3.spec
rm -rf cockpit-hardware
rm -rf ~/rpmbuild
cd ..
cp -r 45drives-temp/rpmbuild ~/rpmbuild
rm -rf 45drives-temp
cd ~/rpmbuild
rpmbuild -ba SPECS/45drives-cockpit-hardware-1.0.3.spec
