#!/bin/bash
set -e

echo "🔍 Checking WASM file..."
if head -c 4 Build/deployment_1_1.wasm | grep -q "version"; then
    echo "⚠️  Detected LFS pointer file, downloading actual binaries..."
    
    curl -L -o Build/deployment_1_1.wasm https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.wasm
    curl -L -o Build/deployment_1_1.data https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.data
    
    echo "✅ LFS files downloaded"
    ls -lh Build/deployment_1_1.wasm Build/deployment_1_1.data
    echo "🔍 WASM magic bytes:"
    head -c 4 Build/deployment_1_1.wasm | od -A x -t x1z -v
else
    echo "✅ WASM file is already valid"
fi

# Start the server
exec npm start
