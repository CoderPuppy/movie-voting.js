#!/bin/sh
watchify            client.js -d -o public/index.js &
watchify pages/vote/client.js -d -o public/vote.js  &
stylus -w pages/**/*.styl public/**/*.styl &