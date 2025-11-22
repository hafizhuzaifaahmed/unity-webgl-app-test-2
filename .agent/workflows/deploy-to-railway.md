---
description: Deploy Unity WebGL build to Railway
---

# Deploy to Railway - Volume Upload Method

This workflow uses Railway Volume to store build files, uploaded via the `/admin` panel.

## Prerequisites

- Unity build files ready (deployment_1.7.*)
- Railway project: `crystalsytem-3dapp-test`
- URL: https://crystalsytem-3dapp-test.up.railway.app

## Deployment Steps

### 1. Upload Build Files to Railway Volume

Go to your Railway admin panel:

**URL**: https://crystalsytem-3dapp-test.up.railway.app/admin

Upload these files:
- `deployment_1.7.wasm.gz`
- `deployment_1.7.data.gz`
- `deployment_1.7.framework.js.gz`
- `deployment_1.7.loader.js`

The files will be stored in Railway Volume at `/data/unity-build-cache`

### 2. Trigger Deployment via Git Push

After uploading files, make any small change and push to GitHub to trigger Railway deployment:

// turbo
```powershell
# Make a small change (e.g., update a comment)
git commit --allow-empty -m "Trigger Railway deployment with new build files"
```

// turbo
```powershell
git push origin main
```

### 3. Railway Auto-Detects New Build Files

Railway will:
1. Detect the git push
2. Start a new deployment
3. Run `setup-build.sh` which finds files in volume
4. Copy files from volume to Build/ directory
5. Start the server
6. Serve the new build files

### 4. Verify Deployment

Visit your app:
- **Main app**: https://crystalsytem-3dapp-test.up.railway.app
- **Admin panel**: https://crystalsytem-3dapp-test.up.railway.app/admin

## How It Works

```
1. You upload files to /admin panel
   ↓
2. Files saved to Railway Volume (/data/unity-build-cache)
   ↓
3. You push to GitHub (triggers Railway deployment)
   ↓
4. setup-build.sh runs and copies files from volume
   ↓
5. Server starts and serves the new build files
```

## File Requirements

| File | Required | Description |
|------|----------|-------------|
| deployment_1.7.wasm.gz | ✅ Yes | WebAssembly binary (gzipped) |
| deployment_1.7.data.gz | ✅ Yes | Game data (gzipped) |
| deployment_1.7.framework.js.gz | ✅ Yes | Unity framework (gzipped) |
| deployment_1.7.loader.js | ✅ Yes | Unity loader script |

## Troubleshooting

### Files Not Loading

**Check volume files**:
1. Go to `/admin` panel
2. Verify all 4 files are listed
3. Check file sizes are correct

### Deployment Failed

**Check Railway logs**:
1. Go to Railway dashboard
2. View deployment logs
3. Look for "✅ Copying Build files from Railway Volume"

### Need to Update Build

**Upload new files**:
1. Go to `/admin` panel
2. Upload new deployment_1.7 files (will overwrite)
3. Push to GitHub to trigger deployment

## Advantages of Volume Method

- ✅ No large files in Git repository
- ✅ Fast git operations
- ✅ Easy to update builds (just upload via /admin)
- ✅ Files persist across deployments
- ✅ No GitHub LFS needed
