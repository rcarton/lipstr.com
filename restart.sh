#!/bin/bash

kill -HUP `cat gunicorn.pid`
./start.sh
 
