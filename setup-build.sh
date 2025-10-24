#!/bin/bash
# Smart caching script for Railway deployment
# Downloads files ONCE to persistent storage, then reuses them

set -e

CACHE_DIR="/data/unity-build-cache"
BUILD_DIR="Build"

echo "🔍 Checking for Unity build files..."

# Function to verify file is valid WASM
verify_wasm() {
    local file=$1
    if [ -f "$file" ]; then
        MAGIC=$(head -c 4 "$file" 2>/dev/null | od -A n -t x1 | tr -d ' ' || echo "missing")
        if [ "$MAGIC" = "0061736d" ]; then
            return 0
        fi
    fi
    return 1
}

# Check if files exist in current Build directory
if verify_wasm "$BUILD_DIR/deployment_1_1.wasm" && [ -f "$BUILD_DIR/deployment_1_1.data" ]; then
    echo "✅ Build files already exist and are valid"
    ls -lh $BUILD_DIR/
    exit 0
fi

# Check if Railway Volume exists and has cached files
if [ -d "$CACHE_DIR" ]; then
    echo "📦 Found Railway Volume cache directory"
    
    if verify_wasm "$CACHE_DIR/deployment_1_1.wasm" && [ -f "$CACHE_DIR/deployment_1_1.data" ]; then
        echo "✅ Using cached files from Railway Volume (no download needed!)"
        
        # Create Build directory if it doesn't exist
        mkdir -p $BUILD_DIR
        
        # Copy from cache to Build directory
        cp "$CACHE_DIR/"* "$BUILD_DIR/" 2>/dev/null || true
        
        echo "✅ Files copied from cache"
        ls -lh $BUILD_DIR/
        exit 0
    else
        echo "⚠️  Cache exists but files are invalid, will re-download"
    fi
else
    echo "📂 No Railway Volume found (first deployment or volume not mounted)"
    echo "   Files will be downloaded and cached for next deployment"
fi

# If we get here, we need to download files
echo "⬇️  Downloading Unity build files (this happens ONCE)..."

mkdir -p $BUILD_DIR

# Download with retry logic
echo "📥 Downloading WASM file..."
curl --retry 15 --retry-delay 5 --retry-all-errors --connect-timeout 180 --max-time 1200 -C - -# -L \
  -o "$BUILD_DIR/deployment_1_1.wasm" \
  https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.wasm \
  || curl --retry 10 --retry-delay 3 --retry-all-errors -# -L \
  -o "$BUILD_DIR/deployment_1_1.wasm" \
  https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.wasm

echo "📥 Downloading data file..."
curl --retry 15 --retry-delay 5 --retry-all-errors --connect-timeout 180 --max-time 1200 -C - -# -L \
  -o "$BUILD_DIR/deployment_1_1.data" \
  https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.data \
  || curl --retry 10 --retry-delay 3 --retry-all-errors -# -L \
  -o "$BUILD_DIR/deployment_1_1.data" \
  https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.data

# Verify download
if verify_wasm "$BUILD_DIR/deployment_1_1.wasm" && [ -f "$BUILD_DIR/deployment_1_1.data" ]; then
    echo "✅ Download successful and verified"
    
    # Save to cache if Railway Volume exists
    if [ -d "/data" ]; then
        echo "💾 Saving files to Railway Volume cache for next deployment..."
        mkdir -p "$CACHE_DIR"
        cp "$BUILD_DIR/"* "$CACHE_DIR/" 2>/dev/null || true
        echo "✅ Files cached - next deployment will be instant!"
    fi
    
    ls -lh $BUILD_DIR/
    exit 0
else
    echo "❌ Download failed or files are corrupted"
    exit 1
fi
