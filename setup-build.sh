#!/bin/bash
# This script extracts Build files from a zip archive
# Use this to avoid downloading files during Railway deployment

set -e

echo "🔍 Checking for Build files..."

# Check if Build files already exist (from git repo)
if [ -f "Build/deployment_1_1.wasm" ] && [ -f "Build/deployment_1_1.data" ]; then
    echo "✅ Build files already exist in repository"
    ls -lh Build/
    exit 0
fi

# Check if build.zip exists in the repository
if [ -f "build.zip" ]; then
    echo "📦 Found build.zip, extracting..."
    unzip -o build.zip
    echo "✅ Build files extracted successfully"
    ls -lh Build/
    exit 0
fi

# If neither exists, files must be downloaded (fallback)
echo "⚠️  No Build files or build.zip found"
echo "Please either:"
echo "  1. Add build.zip to your repository, OR"
echo "  2. Commit Build files directly to git"
exit 1
