#!/bin/bash

kill -HUP `cat ~/home.troebr.net/home/gunicorn.pid`
~/home.troebr.net/start.sh
 
