#!/usr/bin/env python3
"""
Fix unterminated quote warnings in Coq comments.

Coq doesn't support nested comments, and when a `(*` opens a comment that
contains a `"`, Coq thinks the `"` opens a string. If the matching closing
`"` is in a later line of the same comment (or absent), Coq emits warnings
about unterminated strings inside comments.

The fix: in multi-line comments, replace `"..."` with single-line
text inside the comment, removing or escaping the quotes.
"""
import os
import re

def fix_file(path):
    with open(path) as f:
        text = f.read()

    # Find all (* ... *) comments
    # We replace `"text"` inside multi-line comments with `text`
    # by using regex to match content inside (* ... *)

    new_lines = []
    in_comment = False
    in_string = False

    i = 0
    out = []
    while i < len(text):
        # Check for comment start
        if not in_comment and not in_string and text[i:i+2] == '(*':
            in_comment = True
            out.append('(*')
            i += 2
            continue
        # Check for comment end
        if in_comment and text[i:i+2] == '*)':
            in_comment = False
            out.append('*)')
            i += 2
            continue
        # Check for string within comment
        if in_comment and text[i] == '"':
            # Find matching close quote
            j = i + 1
            while j < len(text) and text[j] != '"':
                j += 1
            if j < len(text):
                # We have a complete string. Remove the quotes
                inner = text[i+1:j]
                out.append(inner)
                i = j + 1
            else:
                # Unterminated string. Find end of comment and remove
                # the dangling quote plus everything until `*)`
                end = text.find('*)', i)
                if end != -1:
                    inner = text[i+1:end]
                    out.append(inner)
                    i = end
                else:
                    out.append(text[i])
                    i += 1
            continue
        out.append(text[i])
        i += 1

    return ''.join(out)

for f in sorted(os.listdir('.')):
    if not f.endswith('.v'):
        continue
    fixed = fix_file(f)
    if fixed != open(f).read():
        with open(f, 'w') as fh:
            fh.write(fixed)
        print(f"Fixed: {f}")
