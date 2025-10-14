#!/bin/bash
set -e

echo "🔍 Checking WASM file..."
# Check if first 4 bytes are WASM magic number (0x00 0x61 0x73 0x6d)
MAGIC=$(head -c 4 Build/deployment_1_1.wasm 2>/dev/null | od -A n -t x1 | tr -d ' ' || echo "missing")
echo "Current magic bytes: $MAGIC"

if [ "$MAGIC" != "0061736d" ]; then
    echo "⚠️  Invalid WASM file (expected: 0061736d, got: $MAGIC)"
    echo "📥 Downloading actual binaries from GitHub LFS (172MB total)..."
    echo "⏱️  This may take 10-30 seconds..."
    
    # Download with progress and parallel requests
    curl -# -L -o Build/deployment_1_1.wasm https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.wasm &
    WASM_PID=$!
    curl -# -L -o Build/deployment_1_1.data https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.data &
    DATA_PID=$!
    
    # Wait for both downloads
    wait $WASM_PID
    wait $DATA_PID
    
    echo "✅ LFS files downloaded"
    ls -lh Build/deployment_1_1.wasm Build/deployment_1_1.data
    echo "🔍 Verifying WASM magic bytes:"
    head -c 4 Build/deployment_1_1.wasm | od -A x -t x1z -v
else
    echo "✅ WASM file is valid (magic: $MAGIC) - skipping download"
fi

echo "🚀 Starting server..."
exec npm start
