#!/bin/sh

FILE="backup_lipstr_$(date +%Y%m%d).tar.gz"

USER=$2
PASSWORD=$3
HOST=$1

mkdir -p /tmp/lipstr
cd /tmp/lipstr
rm -rf dump 2>>/dev/null

mongodump -d lipstr
tar -czf $FILE dump

ftp -n $HOST <<END_SCRIPT
quote USER $USER
quote PASS $PASSWORD
cd lipstr
put $FILE
quit
END_SCRIPT



