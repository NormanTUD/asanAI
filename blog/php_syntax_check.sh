#!/bin/bash

set -e

# Recursively check for syntax errors
find . -type f -name "*.php" -exec php -l {} \; | grep -v "No syntax errors detected"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ PHP Syntax errors found!"
    exit 1
fi

find . -name "*.php" -print0 | xargs -0 -n1 php -l
