#!/bin/sh
# watchify            client.js -d -o public/index.js &
watchify -t brfs -d -o public/vote.js client.js pages/vote/client.js &
stylus -w pages/**/*.styl public/**/*.styl &