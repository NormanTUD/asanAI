#!/bin/bash

function get_parent_pid {
	parent_pid=$(ps -o ppid= $1 | sed -e 's/\s//g')
	parent_name=$(ps -p $parent_pid -o command | tr -d '\n' | sed -e 's/^COMMAND//' | sed -e "s/^/$parent_pid: /")
	echo $parent_name >&2
	echo $parent_pid
}

function process_callstack {
	pid=$$
	while [[ $pid -ne "1" ]]; do
		pid=$(get_parent_pid $pid)
	done
}

set -e

function calltracer () {
	echo 'Last file/last line:'
	caller

	process_callstack
}
trap 'calltracer' ERR

ERROR=0

NON_AWAITED_ASYNC=$(for i in $(grep "^async\s*function " *.js *.php | sed -e "s#.*async\s*function\s*##" | sed -e "s#\s*(.*##"); do
	egrep "\s$i\s*\(" *.js *.php;
done | grep -v async | grep -v await | sort | grep -v "+=" | grep -v ":\s*//\s*")

if [[ ! -z $NON_AWAITED_ASYNC ]]; then
	echo "Command for finding non awaited JS functions:"

	echo "$NON_AWAITED_ASYNC"
	ERROR=1
fi

DOUBLE_DEFINED_FUNCS=$(ack "^\s*(async)?\s*function\s*" *.js | sed -e "s#.*\s*function\s*##" | sed -e "s#\s*(.*##" | sort | uniq -c | sort -nr | tac | egrep -v "^\s*[0-9]+\s*$" | egrep -v "^\s*1\s+.*$")

if [[ ! -z $DOUBLE_DEFINED_FUNCS ]]; then
	echo "find double defined functions"
	echo $DOUBLE_DEFINED_FUNCS
	ERROR=1
fi

UNCALLED_FUNCS=$(for func_name in $(ack "^\s*(async)?\s*function\s*" *.js | sed -e "s#.*\s*function\s*##" | sed -e "s#\s*(.*##" | sort | grep -v _option); do
	NUMLINES=$(egrep "$func_name" *.js *.php | wc -l);
	if [[ "$NUMLINES" == "1" ]]; then 
		echo "1: $func_name"
	fi
done)

if [[ ! -z $UNCALLED_FUNCS ]]; then
	echo "find functions that are defined, yet never called:"
	echo "$UNCALLED_FUNCS"
	ERROR=1
fi

#echo "Find untested functions, listed by number of occurences"
#for i in $(ack "function [a-zA-Z_0-9]+" *.js | grep -v tests.js | sed -e "s#.*function\s*##" | sed -e "s#\s*(.*##" | sort); do
#	grep $i tests.js 2>&1 >/dev/null || NUM_OCC=$(ack "(?:(?:^\s*)|=|\"|\()\s*(?:await)?\s*$i\s*\(" *.js | grep -v function | wc -l);
#	echo "$NUM_OCC: $i is untested currently"; 
#done | sort -nr | tac

if [[ "$ERROR" == "1" ]]; then
	exit 4
else
	exit 0
fi
