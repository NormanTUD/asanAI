#!/bin/bash

set -e

NON_AWAITED_ASYNC=$(for i in $(grep "^async\s*function " *.js *.php | sed -e "s#.*async\s*function\s*##" | sed -e "s#\s*(.*##"); do
	egrep "\s$i\s*\(" *.js *.php;
done | grep -v async | grep -v await | sort | grep -v "+=" | grep -v ":\s*//\s*")

if [[ ! -z $NON_AWAITED_ASYNC ]]; then
	echo "Command for finding non awaited JS functions:"

	echo "$NON_AWAITED_ASYNC"
fi

DOUBLE_DEFINED_FUNCS=$(ack "^\s*(async)?\s*function\s*" *.js | sed -e "s#.*\s*function\s*##" | sed -e "s#\s*(.*##" | sort | uniq -c | sort -nr | tac | egrep -v "^\s*[0-9]+\s*$" | egrep -v "^\s*1\s+.*$")

if [[ ! -z $DOUBLE_DEFINED_FUNCS ]]; then
	echo "find double defined functions"
	echo $DOUBLE_DEFINED_FUNCS
fi

UNCALLED_FUNCS=$(for func_name in $(ack "^\s*(async)?\s*function\s*" *.js | sed -e "s#.*\s*function\s*##" | sed -e "s#\s*(.*##" | sort | grep -v _option); do
	NUMLINES=$(egrep "$func_name" *.js *.php | wc -l);
	if [[ "$NUMLINES" == "1" ]]; then 
		echo "1: $func_name"
	fi
done)

echo $UNCALLED_FUNCS

if [[ ! -z $UNCALLED_FUNCS ]]; then
	echo "find functions that are defined, yet never called:"
	echo "$UNCALLED_FUNCS"
fi

#echo "Find untested functions, listed by number of occurences"
#for i in $(ack "function [a-zA-Z_0-9]+" *.js | grep -v tests.js | sed -e "s#.*function\s*##" | sed -e "s#\s*(.*##" | sort); do
#	grep $i tests.js 2>&1 >/dev/null || NUM_OCC=$(ack "(?:(?:^\s*)|=|\"|\()\s*(?:await)?\s*$i\s*\(" *.js | grep -v function | wc -l);
#	echo "$NUM_OCC: $i is untested currently"; 
#done | sort -nr | tac
