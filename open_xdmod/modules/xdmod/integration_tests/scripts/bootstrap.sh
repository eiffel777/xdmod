#!/bin/bash
# Bootstrap script that either sets up a fresh XDMoD test instance or upgrades
# an existing one.  This code is only designed to work inside the XDMoD test
# docker instances. However, since it is designed to test a real install, the
# set of commands that are run would work on a real production system.

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REF_DIR=/root/assets/referencedata

set -e
set -o pipefail

if [ "$XDMOD_TEST_MODE" = "fresh_install" ];
then
    rpm -qa | grep ^xdmod | xargs rpm --erase 
    rm -rf /etc/xdmod
    rm -rf /var/lib/mysql
    rpm -ivh ~/rpmbuild/RPMS/*/*.rpm
    ~/bin/services start
    expect $BASEDIR/xdmod-setup.tcl | col -b
    for resource in $REF_DIR/*.log; do 
        xdmod-shredder -r `basename $resource .log` -f slurm -i $resource; 
    done 
    xdmod-ingestor
    xdmod-import-csv -t names -i $REF_DIR/names.csv
    xdmod-ingestor
    php /root/bin/createusers.php
fi

if [ "$XDMOD_TEST_MODE" = "upgrade" ];
then
    rpm -Uvh ~/rpmbuild/RPMS/*/*.rpm
    ~/bin/services start
    xdmod-upgrade --batch-mode | col -b
fi
