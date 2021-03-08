#!/usr/bin/env bash

# fill this in with a name unique to the software package
PACKAGE_NAME=cockpit-45drives-hardware

# check that docker is installed
command -v docker > /dev/null 2>&1 || {
	echo "Please install docker.";
	exit 1;
}

# if docker image DNE, build it (keep container tag name unique to software package)
if [[ "$(docker images -q $PACKAGE_NAME-ubuntu-builder 2> /dev/null)" == "" ]]; then
	docker build -t $PACKAGE_NAME-ubuntu-builder - < docker/ubuntu # pass in path to docker file
	res=$?
	if [ $res -ne 0 ]; then
		echo "Building docker image failed."
		exit $res
	fi
fi

make clean

mkdir -p dist/ubuntu

# mirror current directory to working directory in container, and mirror dist/ubuntu to .. for deb output
docker run -u $(id -u):$(id -g) -w /home/deb/build -it -v$(pwd):/home/deb/build -v$(pwd)/dist/ubuntu:/home/deb --rm $PACKAGE_NAME-ubuntu-builder dpkg-buildpackage -us -uc -b
res=$?
if [ $res -ne 0 ]; then
	echo "Packaging failed."
	exit $res
fi

rmdir dist/ubuntu/build

echo "deb is in dist/ubuntu/"

exit 0
