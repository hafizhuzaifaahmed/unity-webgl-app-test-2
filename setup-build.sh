#!/bin/bash
set -e

CACHE_DIR="/data/unity-build-cache"
BUILD_DIR="Build"

mkdir -p $BUILD_DIR

if [ -d "$CACHE_DIR" ] && [ -f "$CACHE_DIR/deployment_1_1.wasm" ]; then
    echo "✅ Copying Build files from Railway Volume..."
    cp $CACHE_DIR/* $BUILD_DIR/
    ls -lh $BUILD_DIR/
    exit 0
fi

echo "⚠️  Volume not found or empty - upload files first"
echo "Run: railway run bash"
echo "Then: mkdir -p /data/unity-build-cache && cp Build/* /data/unity-build-cache/"
exit 1
