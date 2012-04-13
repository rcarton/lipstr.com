#!/bin/bash

# Test for private_settings
if [ ! -f lipstr/private_settings.py ];
then
    echo "Error: 'lipstr/private_settings.py' not found, aborting."
    exit 1
fi

cd ~/lipstr.com/lipstr
source ../bin/activate
exec gunicorn_django -c ../gunicorn.conf.py
