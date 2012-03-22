#!/bin/bash

cd ~/lipstr.com/lipstr
source ../bin/activate
exec gunicorn_django -c ../gunicorn.conf.py

 
