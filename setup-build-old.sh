#!/bin/bash
# This script downloads Build files from Git LFS if they are pointer files
# Use this to ensure actual binaries are available during Railway deployment

set -e

echo "🔍 Checking Build files..."

# Check if WASM file is a Git LFS pointer or actual binary
if [ -f "Build/deployment_1_1.wasm" ]; then
    # Check first 4 bytes for WASM magic number (0x00 0x61 0x73 0x6d)
    MAGIC=$(head -c 4 Build/deployment_1_1.wasm 2>/dev/null | od -A n -t x1 | tr -d ' ' || echo "missing")
    
    if [ "$MAGIC" = "0061736d" ]; then
        echo "✅ Build files are actual binaries (not LFS pointers)"
        ls -lh Build/
        exit 0
    else
        echo "⚠️  Build files are Git LFS pointers, downloading actual files..."
        curl --retry 10 --retry-delay 3 --retry-all-errors --connect-timeout 120 --max-time 1200 -C - -# -L -o Build/deployment_1_1.wasm https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.wasm || curl --retry 10 --retry-delay 3 --retry-all-errors -# -L -o Build/deployment_1_1.wasm https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.wasm
        echo "WASM downloaded, downloading data file..."
        curl --retry 10 --retry-delay 3 --retry-all-errors --connect-timeout 120 --max-time 1200 -C - -# -L -o Build/deployment_1_1.data https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.data || curl --retry 10 --retry-delay 3 --retry-all-errors -# -L -o Build/deployment_1_1.data https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.data
        echo "✅ Build files downloaded successfully"
        ls -lh Build/
        exit 0
    fi
fi

echo "❌ Build files not found"
exit 1
