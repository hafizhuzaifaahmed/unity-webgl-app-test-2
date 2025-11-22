---
description: Deploy Unity WebGL build to Railway
---

# Deploy to Railway - deployment_1.7

This workflow guides you through deploying your Unity WebGL build (deployment_1.7) to Railway.

## Prerequisites

- Unity build files in `Build/` folder:
  - `deployment_1.7.wasm.gz`
  - `deployment_1.7.data.gz`
  - `deployment_1.7.framework.js.gz`
  - `deployment_1.7.loader.js`
- `index.html` configured to load deployment_1.7 files
- Railway account at https://railway.app

## Deployment Steps

### 1. Verify Build Files

First, check that all deployment_1.7 files are present:

```powershell
cd "d:\Crystal System\initial prototype\unity-webgl-app-fresh"
ls Build\deployment_1.7.*
```

You should see 4 files listed.

### 2. Commit Build Files to Git

// turbo
```powershell
git add Build/deployment_1.7.*
git add index.html
git add setup-build.sh
git commit -m "Update to deployment_1.7 with gzip compression"
```

### 3. Push to GitHub

// turbo
```powershell
git push origin main
```

### 4. Deploy on Railway

1. Go to https://railway.app and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose repository: `hafizhuzaifaahmed/unity-webgl-app-test-2`
5. Railway will automatically:
   - Detect `nixpacks.toml` configuration
   - Run `setup-build.sh` during install phase
   - Install npm dependencies
   - Start server with `npm start`

### 5. Monitor Deployment

Watch the deployment logs for:
- ✅ "Valid Build files found in repository"
- ✅ "npm ci --omit=dev"
- ✅ "Server running on port 3002"

Deployment typically takes 2-3 minutes.

### 6. Access Your App

Once deployed, Railway provides a URL like:
- `https://your-project-name.railway.app`

Click the URL to test your Unity WebGL build.

## Alternative: Deploy via Railway Volume

If build files are too large for Git (>100MB), use Railway Volume instead:

### 1. Deploy Server First

```powershell
# Remove Build files from git (keep setup script)
git rm --cached Build/deployment_1.7.*
git commit -m "Deploy server without build files"
git push origin main
```

### 2. Add Railway Volume

1. In Railway dashboard, go to your service
2. Click **"Variables"** tab → **"Volumes"**
3. Add volume:
   - Name: `unity-build-cache`
   - Mount path: `/data/unity-build-cache`
4. Redeploy service

### 3. Upload Files via Admin Panel

1. Visit: `https://your-app.railway.app/admin`
2. Upload each file:
   - `deployment_1.7.wasm.gz`
   - `deployment_1.7.data.gz`
   - `deployment_1.7.framework.js.gz`
   - `deployment_1.7.loader.js`
3. Restart Railway service

## Troubleshooting

### "Build files not found" Error

**Solution**: Check that files are committed to Git:
```powershell
git ls-files Build/
```

### Railway Build Fails

**Solution**: Check Railway logs for errors. Common issues:
- Missing npm dependencies → Check `package.json`
- setup-build.sh permission denied → Verify `chmod +x` in `nixpacks.toml`

### Unity App Loads Slowly

**Solution**: Your deployment_1.7 files use gzip compression which is good. For even better performance:
1. Enable Brotli compression (`.br` files) in Unity build settings
2. Update server.js to serve `.br` files
3. Reduces file size by additional 20-30%

## File Size Reference

| File | Approximate Size |
|------|------------------|
| `deployment_1.7.wasm.gz` | ~12.7 MB |
| `deployment_1.7.data.gz` | ~35 MB |
| `deployment_1.7.framework.js.gz` | ~90 KB |
| `deployment_1.7.loader.js` | ~26 KB |
| **Total** | ~48 MB |

## Next Steps

After successful deployment:
- Test the Unity app thoroughly
- Check browser console for any errors
- Monitor Railway service metrics
- Consider setting up custom domain in Railway settings
