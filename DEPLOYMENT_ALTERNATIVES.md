# Alternative Deployment Strategies for Large Unity WebGL Files

## 🚨 Current Problem
- Build fails downloading 172MB files from GitHub LFS
- Error: `curl: (56) Recv failure: Connection reset by peer`
- Downloads are unreliable during Railway build phase

## ✅ **Solution 1: Use Railway Volumes (RECOMMENDED)**

Store Unity build files in a persistent Railway volume instead of downloading during build.

### Setup Steps:

1. **Create a Railway Volume:**
   - Railway Dashboard → Your Service → Variables
   - Add Volume: `/app/Build` (mount path)
   - Volume will persist across deployments

2. **Upload files once to the volume:**
   ```bash
   # Use Railway CLI or SFTP to upload files to volume
   railway run bash
   # Then upload your Build folder files
   ```

3. **Update nixpacks.toml:**
   ```toml
   [phases.setup]
   nixPkgs = ["nodejs_18"]

   [phases.install]
   cmds = [
     "npm ci --omit=dev"
   ]

   [start]
   cmd = "npm start"
   ```

**Benefits:**
- ✅ No download during build (instant builds)
- ✅ No connection failures
- ✅ Files persist across deployments
- ✅ Can update files independently

---

## ✅ **Solution 2: Use External CDN/Storage**

Host large Unity files on a CDN and load them at runtime.

### Setup Steps:

1. **Upload to CDN:**
   - Use Cloudflare R2 (free tier: 10GB)
   - Or AWS S3 + CloudFront
   - Or Vercel Blob Storage

2. **Update index.html to load from CDN:**
   ```javascript
   var buildUrl = "https://your-cdn.com/unity-build";
   var config = {
     dataUrl: buildUrl + "/deployment_1_1.data",
     frameworkUrl: buildUrl + "/deployment_1_1_framework.js",
     codeUrl: buildUrl + "/deployment_1_1.wasm",
     // ...
   };
   ```

3. **Simplified nixpacks.toml:**
   ```toml
   [phases.install]
   cmds = ["npm ci --omit=dev"]
   
   [start]
   cmd = "npm start"
   ```

**Benefits:**
- ✅ Fastest global loading (CDN edge locations)
- ✅ No Railway build size limits
- ✅ Can use CDN compression
- ✅ Better for users worldwide

---

## ✅ **Solution 3: Optimize Unity Build First**

Reduce file sizes so downloads complete successfully.

### In Unity Editor:

1. **Enable Brotli Compression:**
   - `Edit > Project Settings > Player > Publishing Settings`
   - Set `Compression Format: Brotli`
   - This reduces 172MB to ~20-40MB

2. **Rebuild and commit:**
   ```bash
   # After Unity rebuild
   git add Build/
   git commit -m "Add Brotli compressed Unity build"
   git push
   ```

**Benefits:**
- ✅ Smaller files = more reliable downloads
- ✅ Faster loading for users
- ✅ Works with current setup
- ✅ No infrastructure changes needed

---

## ✅ **Solution 4: Split Build into Chunks**

Download files in smaller chunks using curl range requests.

### Create download script:

```bash
#!/bin/bash
# download-chunked.sh

URL="https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.data"
OUTPUT="Build/deployment_1_1.data"
CHUNK_SIZE=10485760  # 10MB chunks

# Get file size
SIZE=$(curl -sI "$URL" | grep -i Content-Length | awk '{print $2}' | tr -d '\r')

# Download in chunks
for ((i=0; i<SIZE; i+=CHUNK_SIZE)); do
  END=$((i+CHUNK_SIZE-1))
  if [ $END -ge $SIZE ]; then
    END=$((SIZE-1))
  fi
  
  echo "Downloading bytes $i-$END..."
  curl -r $i-$END "$URL" >> "$OUTPUT"
done
```

**Benefits:**
- ✅ More reliable for large files
- ✅ Can resume failed downloads
- ✅ Works with current setup

---

## ✅ **Solution 5: Use wget Instead of curl**

wget has better resume capabilities for large files.

### Update nixpacks.toml:

```toml
[phases.setup]
nixPkgs = ["nodejs_18", "wget"]

[phases.install]
cmds = [
  "wget --retry-connrefused --waitretry=5 --read-timeout=60 --timeout=300 --tries=10 --continue -O Build/deployment_1_1.wasm https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.wasm",
  "wget --retry-connrefused --waitretry=5 --read-timeout=60 --timeout=300 --tries=10 --continue -O Build/deployment_1_1.data https://media.githubusercontent.com/media/hafizhuzaifaahmed/unity-webgl-app-test-2/main/Build/deployment_1_1.data",
  "npm ci --omit=dev"
]
```

**Benefits:**
- ✅ Better retry logic than curl
- ✅ Automatic resume on failure
- ✅ Minimal changes needed

---

## 🎯 **My Recommendation**

**Priority Order:**

1. **First:** Optimize Unity build with Brotli compression (reduces to 20-40MB)
2. **Then:** Try current nixpacks.toml with improved retry logic
3. **If still failing:** Use Railway Volumes or CDN approach

**Why this order:**
- Unity optimization gives best long-term performance
- Smaller files = more reliable downloads
- Volumes/CDN are more complex but most reliable

---

## 🔧 **Quick Fix for Right Now**

Try the updated nixpacks.toml I just created with:
- 10 retries instead of 5
- Parallel downloads (faster)
- `--retry-all-errors` flag
- Longer timeouts (15 minutes per file)

If this still fails, the file size is simply too large for reliable GitHub LFS downloads during Railway builds. In that case, use Solution 1 (Volumes) or Solution 3 (Unity optimization).
