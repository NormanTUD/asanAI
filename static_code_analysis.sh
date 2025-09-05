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


if ! tests/find_double_defined_functions; then
	ERROR=1
fi

if ! tests/find_uncalled_functions; then
	ERROR=1
fi

#echo "Find untested functions, listed by number of occurences"
#for i in $(ack "function [a-zA-Z_0-9]+" *.js | grep -v tests.js | sed -e "s#.*function\s*##" | sed -e "s#\s*(.*##" | sort); do
#	grep $i tests.js 2>&1 >/dev/null || NUM_OCC=$(ack "(?:(?:^\s*)|=|\"|\()\s*(?:await)?\s*$i\s*\(" *.js | grep -v function | wc -l);
#	echo "$NUM_OCC: $i is untested currently"; 
#done | sort -nr | tac

if ! tests/find_unwrapped_base_functions; then
	ERROR=1
fi

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
