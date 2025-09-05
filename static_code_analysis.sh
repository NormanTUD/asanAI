#!/bin/bash

function calltracer () {
	echo 'Last file/last line:'
	caller
}
# trap 'calltracer' ERR


if ! which npx 2>&1 >/dev/null; then
	echo "npx needs to be installed"
	exit 2
fi

if ! which egrep 2>&1 >/dev/null; then
	echo "grep needs to be installed"
	exit 2
fi

if ! which grep 2>&1 >/dev/null; then
	echo "grep needs to be installed"
	exit 2
fi

if ! which ack 2>&1 >/dev/null; then
	echo "ack-grep needs to be installed"
	exit 2
fi

ERROR=0

if ! tests/find_unawaited_functions; then
	ERROR=1
fi

DOUBLE_DEFINED_FUNCS=$(ack "^\s*(async)?\s*function\s*" *.js | sed -e "s#.*\s*function\s*##" | sed -e "s#\s*(.*##" | sort | uniq -c | sort -nr | tac | egrep -v "^\s*[0-9]+\s*$" | egrep -v "^\s*1\s+.*$")

if [[ ! -z $DOUBLE_DEFINED_FUNCS ]]; then
	echo "find double defined functions"
	echo $DOUBLE_DEFINED_FUNCS
	ERROR=2
fi

UNCALLED_FUNCS=$(for func_name in $(ack "^\s*(async)?\s*function\s*" *.js visualizations/*.js | sed -e "s#.*\s*function\s*##" | sed -e "s#\s*(.*##" | sort | grep -v _option); do
	NUMLINES=$(egrep "$func_name" *.js *.php visualizations/*.js | wc -l);
	if [[ "$NUMLINES" == "1" ]]; then 
		echo "1: $func_name"
	fi
done)

if [[ ! -z $UNCALLED_FUNCS ]]; then
	echo "find functions that are defined, yet never called:"
	echo "$UNCALLED_FUNCS"
	ERROR=3
fi

#echo "Find untested functions, listed by number of occurences"
#for i in $(ack "function [a-zA-Z_0-9]+" *.js | grep -v tests.js | sed -e "s#.*function\s*##" | sed -e "s#\s*(.*##" | sort); do
#	grep $i tests.js 2>&1 >/dev/null || NUM_OCC=$(ack "(?:(?:^\s*)|=|\"|\()\s*(?:await)?\s*$i\s*\(" *.js | grep -v function | wc -l);
#	echo "$NUM_OCC: $i is untested currently"; 
#done | sort -nr | tac

echo "Find unwrapped base functions:";

for i in $(curl -L https://js.tensorflow.org/api/latest | grep -v "train\." | grep "symbol-link" | sed -e 's#.*name="##' | sed -e 's#".*##' | grep -v "-" | sort | grep "\." | sort | uniq); do
	NUMOCC=$(ack "\b$i" *.js | grep -v base_wrappers | grep -v html | egrep -v "^\s*//" | wc -l);
	if [[ $NUMOCC -ne "0" ]]; then
		echo "$i: $NUMOCC";
	fi;
done

if [[ -e _ALL.js ]]; then
	rm _ALL.js
fi

for included_js in $(cat index.php | grep _js | sed -e 's#.*_js(.##' | grep "\.js" | sed -e 's#".*##' | grep -v libs | grep -v tf | grep -v prism); do 
	cat $included_js >> _ALL.js
done


if [[ -e _ALL.js ]]; then
	npx eslint _ALL.js | \
		grep -v "'tf' is not defined" | \
		grep -v Fireworks | \
		grep -v label_debugger_icon | \
		grep -v "'THREE' is not defined" | \
		grep -v "'l' is already defined" | \
		grep -v "'vertex' is already defined" | \
		grep -v "'d3' is not defined" | \
		grep -v "'language' is not defined" | \
		grep -v "'language' is not defined" | \
		grep -v "'Swal' is not defined" | \
		grep -v Plotly | \
		grep -v element_skill_text | \
		grep -v total_correct | \
		grep -v temml | \
		grep -v "'architecture' is not defined" | \
		grep -v "'architecture2' is not defined" | \
		grep -v "'result' is not defined" | \
		grep -v set_all | \
		grep -v chardinJs
	#rm _ALL.js
else
	echo "Could not concat all included js files";
	ERROR=4
fi

exit $ERROR
