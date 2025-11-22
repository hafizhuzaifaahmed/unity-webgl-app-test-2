#!/bin/bash
set -e

CACHE_DIR="/data/unity-build-cache"
BUILD_DIR="Build"
WASM_FILE="$BUILD_DIR/deployment_1.7.wasm.gz"
DATA_FILE="$BUILD_DIR/deployment_1.7.data.gz"
FRAMEWORK_FILE="$BUILD_DIR/deployment_1.7.framework.js.gz"
LOADER_FILE="$BUILD_DIR/deployment_1.7.loader.js"

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

# Function to verify gzipped file is valid
is_valid_gzip() {
    local file="$1"
    if [ ! -f "$file" ]; then
        return 1
    fi
    # Check if first 2 bytes are gzip magic number (0x1f 0x8b)
    local magic=$(head -c 2 "$file" 2>/dev/null | od -A n -t x1 | tr -d ' ' || echo "invalid")
    [ "$magic" = "1f8b" ]
}

# Check if Build files exist and are valid
if [ -f "$WASM_FILE" ] && [ -f "$DATA_FILE" ]; then
    if is_lfs_pointer "$WASM_FILE" || ! is_valid_gzip "$WASM_FILE"; then
        echo "⚠️  Build files are Git LFS pointers or invalid"
        echo "📥 Downloading actual binaries from GitHub LFS..."
        
        # Download from GitHub LFS
        curl -# -L -o "$WASM_FILE" https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1.7.wasm.gz &
        WASM_PID=$!
        curl -# -L -o "$DATA_FILE" https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1.7.data.gz &
        DATA_PID=$!
        curl -# -L -o "$FRAMEWORK_FILE" https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1.7.framework.js.gz &
        FRAMEWORK_PID=$!
        curl -# -L -o "$LOADER_FILE" https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1.7.loader.js &
        LOADER_PID=$!
        
        # Wait for all downloads
        wait $WASM_PID
        wait $DATA_PID
        wait $FRAMEWORK_PID
        wait $LOADER_PID
        
        echo "✅ LFS files downloaded"
        ls -lh $BUILD_DIR/deployment_1.7.*
        exit 0
    else
        echo "✅ Valid Build files found in repository"
        ls -lh $BUILD_DIR/deployment_1.7.*
        exit 0
    fi
fi

# If not in repo, try to copy from Railway Volume
if [ -d "$CACHE_DIR" ] && [ -f "$CACHE_DIR/deployment_1.7.wasm.gz" ]; then
    echo "✅ Copying Build files from Railway Volume..."
    cp $CACHE_DIR/deployment_1.7.* $BUILD_DIR/
    ls -lh $BUILD_DIR/
    exit 0
fi

echo "⚠️  Build files not found - will copy from volume at runtime"
echo "✅ Build phase complete"
exit 0
