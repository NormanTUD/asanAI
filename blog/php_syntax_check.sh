#!/bin/bash

# Recursively check for syntax errors
find . -type f -name "*.php" -exec php -l {} \; | grep -v "No syntax errors detected"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ PHP Syntax errors found!"
    exit 1
fi

exit 0
