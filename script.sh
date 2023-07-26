#!/bin/bash

# Copy package.json from /src to /lib
cp package.json lib/

# Remove devDependencies from the copied package.json
jq 'del(.devDependencies)' lib/package.json > lib/package.json.tmp
mv lib/package.json.tmp lib/package.json

# Check if an argument is provided for updating the version
if [ -n "$1" ]; then

    # Update the version in package.json
    updated_version="$1"
    jq --arg version "$updated_version" '.version = $version' lib/package.json > lib/package.json.tmp
    mv lib/package.json.tmp lib/package.json

    echo "Package version updated to $updated_version."
fi
