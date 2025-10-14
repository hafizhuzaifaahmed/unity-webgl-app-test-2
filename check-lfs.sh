#!/bin/bash
# Check if WASM file is actually a binary (not LFS pointer)
if head -c 4 Build/deployment_1_1.wasm | grep -q "version"; then
    echo "ERROR: WASM file is still a Git LFS pointer!"
    echo "Pulling LFS files..."
    git lfs install
    git lfs pull
    
    # Verify again
    if head -c 4 Build/deployment_1_1.wasm | grep -q "version"; then
        echo "ERROR: Git LFS pull failed!"
        exit 1
    fi
fi

echo "✅ WASM files verified"
