#!/usr/bin/env bash

PACKAGE_NAME=cockpit-45drives-hardware

# check if docker is installed
command -v docker > /dev/null 2>&1 || {
	echo "Please install docker.";
	exit 1;
}

# if docker image DNE, build it
if [[ "$(docker images -q $PACKAGE_NAME-el7-builder 2> /dev/null)" == "" ]]; then
	docker build -t $PACKAGE_NAME-el7-builder - < docker/centos7 # pass path to dockerfile
	res=$?
	if [ $res -ne 0 ]; then
		echo "Building docker image failed."
		exit $res
	fi
fi

mkdir -p dist/{el7,tmp}

# get the source name <package name>-<version> from spec fie
SOURCE_DIR=$PACKAGE_NAME-$(grep Version rpm/$PACKAGE_NAME.spec --color=never | awk '{print $2}')
DEST=dist/tmp/$SOURCE_DIR
mkdir -p $DEST

# Build source (uncomment following lines if building is needed, not needed for scripts like 45drives-tools)
# docker run -u $(id -u):$(id -g) -w /home/rpm/build -it -v$(pwd):/home/rpm/build --rm $PACKAGE_NAME-el7-builder make -j8
# res=$?
# if [ $res -ne 0 ]; then
# 	echo "Building failed."
# 	exit $res
# fi

# For scripts that do not need any building, just running make install from the host is fine:
make DESTDIR=$DEST PACKAGING=1 install
# directory tree from / of filesystem should now be in dist/tmp/<package name>-<version>/

# tarball the installed files
pushd $DEST/..
tar -czvf $SOURCE_DIR.tar.gz $SOURCE_DIR
popd

# build rpm from source tar and place it dist/el7 by mirroring dist/el7 to rpmbuild/RPMS
docker run -u $(id -u):$(id -g) -w /home/rpm/rpmbuild -it -v$(pwd)/dist/tmp:/home/rpm/rpmbuild/SOURCES -v$(pwd)/dist/el7:/home/rpm/rpmbuild/RPMS -v$(pwd)/rpm:/home/rpm/rpmbuild/SPECS --rm $PACKAGE_NAME-el7-builder rpmbuild -ba SPECS/$PACKAGE_NAME.spec
res=$?
if [ $res -ne 0 ]; then
	echo "Packaging failed."
	exit $res
fi

rm -rf dist/tmp

echo "rpm is in dist/el7/"

exit 0