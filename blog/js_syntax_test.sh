#!/bin/bash
# Checks if the JS syntax is valid
for file in $(find . -name "*.js"); do
    node -c "$file" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "❌ Syntax error in: $file"
        exit 1
    fi
done
echo "✅ All files passed syntax check."
