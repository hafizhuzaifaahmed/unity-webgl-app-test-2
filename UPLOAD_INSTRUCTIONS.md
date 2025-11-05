# Upload Build Files to Railway Volume

## Step 1: Deploy Upload Server

```bash
# Commit changes
git add package.json server-upload.js setup-build.sh .dockerignore .gitignore
git commit -m "Add upload server for Railway volume"
git push
```

Wait for Railway to deploy (1-2 minutes).

## Step 2: Upload Files via Web Interface

1. Open your Railway app URL in browser
2. Add `/admin` to the URL: `https://your-app.up.railway.app/admin`
3. Click "Choose Files" and select all Build files:
   - `deployment_1_1.wasm` (49MB)
   - `deployment_1_1.data` (143MB)
   - `deployment_1_1_framework.js` (460KB)
   - `deployment_1_1_loader.js` (26KB)
4. Click "Upload" button
5. Wait for all files to upload (~2-5 minutes depending on connection)
6. Verify files are listed below

## Step 3: Switch Back to Normal Server

After successful upload, change the start script back:

**Edit package.json:**
```json
"start": "node server.js"
```

**Commit and deploy:**
```bash
git add package.json
git commit -m "Switch back to normal server after upload"
git push
```

## Step 4: Verify

After deployment, check your app loads correctly with Build files from the volume!

---

## Files in Railway Volume

After upload, files will be at:
- `/data/unity-build-cache/deployment_1_1.wasm`
- `/data/unity-build-cache/deployment_1_1.data`
- `/data/unity-build-cache/deployment_1_1_framework.js`
- `/data/unity-build-cache/deployment_1_1_loader.js`

The `setup-build.sh` script will copy these to `Build/` directory on each deployment.
