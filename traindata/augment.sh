#!/bin/bash

INPUT=$1

basename=$(echo $INPUT | sed -e 's/\.[a-zA-Z]*$//')

echo $INPUT
echo $basename

set -x

gmic $INPUT +sketchbw 1 reverse "blur[-1]" 3 "blend[-2,-1]" overlay -o "${basename}_sketchbw.png"
gmic $INPUT sponge , -o "${basename}_sponge.png"
gmic $INPUT +drawing , -o "${basename}_drawing.png"
gmic $INPUT cartoon 3,50,10,0.25,3,16 -o "${basename}_cartoon.png"
gmic $INPUT +hardsketchbw 200,70,0.1,10 median[-1] 2 +local reverse blur[-1] 3 blend[-2,-1] overlay done -o "${basename}_hardsketchbw .png"
gmic $INPUT +deform[0] 10 +deform[0] 20 -o "${basename}_deform.png"
