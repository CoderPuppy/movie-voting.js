#!/bin/sh
# watchify            client.js -d -o public/index.js &
watchify client.js pages/vote/client.js -d -t brfs -o public/vote.js  &
stylus -w pages/**/*.styl public/**/*.styl &