#!/bin/bash

cd ~/home.troebr.net/home
source ../bin/activate
exec gunicorn_django -c ../gunicorn.conf.py

 