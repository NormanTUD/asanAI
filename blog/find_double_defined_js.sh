#!/bin/bash

err=0

# Loop through all .js files recursively
find . -type f -name "*.js" | while read -r file; do
    # Extract function names, sort them, and find duplicates
    duplicates=$(grep -E "^function [a-zA-Z0-9_]+" "$file" | sed -E 's/^function ([a-zA-Z0-9_]+).*/\1/' | sort | uniq -d)

    if [ -n "$duplicates" ]; then
        echo "------------------------------------------"
        echo "DUPLICATES FOUND IN: $file"
        echo "$duplicates"
	err=1
    fi
done

exit $err
