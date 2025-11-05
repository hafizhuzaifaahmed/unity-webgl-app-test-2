#!/bin/bash
set -e

CACHE_DIR="/data/unity-build-cache"
BUILD_DIR="Build"
WASM_FILE="$BUILD_DIR/deployment_1_1.wasm"
DATA_FILE="$BUILD_DIR/deployment_1_1.data"

mkdir -p $BUILD_DIR

# Function to check if file is a Git LFS pointer
is_lfs_pointer() {
    local file="$1"
    if [ ! -f "$file" ]; then
        return 1
    fi
    # LFS pointer files are small and start with "version https://git-lfs.github.com"
    local size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
    if [ "$size" -lt 1000 ]; then
        if head -n 1 "$file" 2>/dev/null | grep -q "version https://git-lfs"; then
            return 0
        fi
    fi
    return 1
}

# Function to verify WASM file is valid binary
is_valid_wasm() {
    local file="$1"
    if [ ! -f "$file" ]; then
        return 1
    fi
    # Check if first 4 bytes are WASM magic number (0x00 0x61 0x73 0x6d)
    local magic=$(head -c 4 "$file" 2>/dev/null | od -A n -t x1 | tr -d ' ' || echo "invalid")
    [ "$magic" = "0061736d" ]
}

# Check if Build files exist and are valid
if [ -f "$WASM_FILE" ]; then
    if is_lfs_pointer "$WASM_FILE" || ! is_valid_wasm "$WASM_FILE"; then
        echo "⚠️  Build files are Git LFS pointers or invalid"
        echo "📥 Downloading actual binaries from GitHub LFS..."
        
        # Download from GitHub LFS (172MB total)
        curl -# -L -o "$WASM_FILE" https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.wasm &
        WASM_PID=$!
        curl -# -L -o "$DATA_FILE" https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.data &
        DATA_PID=$!
        
        # Wait for both downloads
        wait $WASM_PID
        wait $DATA_PID
        
        echo "✅ LFS files downloaded"
        ls -lh "$WASM_FILE" "$DATA_FILE"
        exit 0
    else
        echo "✅ Valid Build files found in repository"
        ls -lh $BUILD_DIR/
        exit 0
    fi
fi

# If not in repo, try to copy from Railway Volume
if [ -d "$CACHE_DIR" ] && [ -f "$CACHE_DIR/deployment_1_1.wasm" ]; then
    echo "✅ Copying Build files from Railway Volume..."
    cp $CACHE_DIR/* $BUILD_DIR/
    ls -lh $BUILD_DIR/
    exit 0
fi

echo "⚠️  Build files not found in repository or volume"
echo "Option 1: Push Build files to git (tracked via Git LFS)"
echo "Option 2: Upload to Railway volume:"
echo "  - Run: railway run bash"
echo "  - Then: mkdir -p /data/unity-build-cache && cp Build/* /data/unity-build-cache/"
exit 1
