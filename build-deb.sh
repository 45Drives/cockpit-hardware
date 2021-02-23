#!/bin/bash

dch -i -U
dpkg-buildpackage -b -uc -us
