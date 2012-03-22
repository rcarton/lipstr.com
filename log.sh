#!/bin/bash

tail -f $(cat gunicorn.conf.py | grep "errorlog =" | sed -rn "s/.*\"(.*)\".*/\1/p")
