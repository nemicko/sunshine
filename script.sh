#!/bin/bash

# Copy package.json from /src to /lib
cp package.json lib/

# Remove devDependencies from the copied package.json
jq 'del(.devDependencies)' lib/package.json > lib/package.json.tmp
mv lib/package.json.tmp lib/package.json

# Check if an argument is provided for updating the version
if [ -n "$1" ]; then
    # Read the current version from package.json
    current_version=$(jq -r '.version' lib/package.json)

    # Split the version into major, minor, and patch components
    IFS='.' read -ra version_components <<< "$current_version"
    major=${version_components[0]}
    minor=${version_components[1]}
    patch=${version_components[2]}

    # Update the version based on the provided argument
    case "$1" in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
        *)
            echo "Invalid update argument. Valid arguments are: major, minor, patch."
            exit 1
            ;;
    esac

    # Update the version in package.json
    updated_version="$major.$minor.$patch"
    jq --arg version "$updated_version" '.version = $version' lib/package.json > lib/package.json.tmp
    mv lib/package.json.tmp lib/package.json

    echo "Package version updated to $updated_version."
fi
