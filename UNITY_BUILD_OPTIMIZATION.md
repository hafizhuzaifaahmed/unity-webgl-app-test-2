# Unity WebGL Build Optimization Guide

## 🎮 Unity Editor Settings for Smaller, Faster Builds

### 1. **Enable Compression (MOST IMPORTANT)**
**Location:** `Edit > Project Settings > Player > Publishing Settings`

```
Compression Format: Brotli (Best - 80-90% reduction)
                    or Gzip (Good - 60-70% reduction)
                    or Disabled (Current - No compression)
```

**Impact:** Can reduce your 172MB build to 20-40MB!

### 2. **Code Stripping**
**Location:** `Edit > Project Settings > Player > Other Settings`

```
Managed Stripping Level: High
Strip Engine Code: ✓ Enabled
```

**Impact:** Removes unused Unity engine code (10-30% reduction)

### 3. **Texture Compression**
**Location:** Select textures in Project window > Inspector

```
Compression: High Quality (or Normal Quality for more savings)
Max Size: 2048 or 1024 (instead of 4096)
Format: Automatic (Compressed)
```

**Impact:** Can reduce texture memory by 50-75%

### 4. **Audio Compression**
**Location:** Select audio files > Inspector

```
Load Type: Compressed In Memory
Compression Format: Vorbis
Quality: 70% (balance between size and quality)
```

**Impact:** Reduces audio file sizes by 60-80%

### 5. **Build Settings Optimization**
**Location:** `File > Build Settings > Player Settings`

```
Development Build: ✗ Disabled (for production)
Autoconnect Profiler: ✗ Disabled
Script Debugging: ✗ Disabled
Data Caching: ✓ Enabled (for faster repeat loads)
```

### 6. **Graphics Settings**
**Location:** `Edit > Project Settings > Graphics`

```
Shader Stripping:
- Lightmap Modes: Manual (select only what you use)
- Fog Modes: Manual (select only what you use)
- Instancing Variants: Strip Unused
```

**Impact:** Reduces shader compilation size

### 7. **Quality Settings**
**Location:** `Edit > Project Settings > Quality`

For WebGL, create a "WebGL" quality level:
```
Pixel Light Count: 1-2 (instead of 4)
Texture Quality: Medium (if acceptable)
Anisotropic Textures: Per Texture
Anti Aliasing: Disabled or 2x (not 8x)
Soft Particles: Disabled
Shadows: Disable or Hard Shadows Only
Shadow Resolution: Medium
```

### 8. **Asset Bundle Strategy (Advanced)**
For very large projects (>200MB):

```
Split assets into AssetBundles
Load on-demand instead of at startup
Use Addressables system
```

**Impact:** Initial load becomes 10-20MB, rest loads as needed

## 📊 Expected File Size Reductions

### Current Build (Estimated):
- deployment_1_1.wasm: ~50-80MB
- deployment_1_1.data: ~80-120MB
- **Total: ~150-200MB**

### After Unity Optimizations:
- deployment_1_1.wasm: ~5-15MB (with Brotli)
- deployment_1_1.data: ~15-30MB (with Brotli)
- **Total: ~20-45MB** (70-80% reduction!)

### After Unity + Server Optimizations:
- First load transfer: ~20-45MB (compressed)
- Cached load transfer: ~0MB (from browser cache)
- **Load time on Railway: 5-10 seconds (first visit)**
- **Load time on Railway: 1-3 seconds (cached)**

## 🔄 Rebuild Process

1. **Apply Unity settings above**
2. **Clean build folder:**
   ```
   Delete: Build folder contents
   ```
3. **Build for WebGL:**
   ```
   File > Build Settings > WebGL > Build
   ```
4. **Verify compression:**
   - Check Build folder
   - Files should be .br (Brotli) or .gz (Gzip) extensions
   - Or check file headers

5. **Update your repository:**
   ```bash
   git add Build/
   git commit -m "Optimized Unity WebGL build with Brotli compression"
   git push
   ```

## 🎯 Priority Optimizations (Do These First)

1. ✅ **Enable Brotli Compression** (80% size reduction)
2. ✅ **Enable Code Stripping** (20% size reduction)
3. ✅ **Compress Textures** (30-50% size reduction)
4. ✅ **Compress Audio** (60% size reduction)
5. ✅ **Disable Development Build** (10% size reduction)

## 🔍 Verify Your Build

After rebuilding, check file sizes:

```bash
# In your project directory
ls -lh Build/

# You should see:
# deployment_1_1.wasm.br (or .gz) - should be 5-20MB
# deployment_1_1.data.br (or .gz) - should be 15-40MB
```

If files are still large (>100MB), Unity compression may not be enabled.

## 💡 Pro Tips

1. **Test locally first:** Build and test on local server before deploying
2. **Monitor build size:** Track size changes with each optimization
3. **Balance quality vs size:** Find acceptable quality/size tradeoff
4. **Use Unity Profiler:** Identify largest assets to optimize
5. **Progressive loading:** Load heavy scenes/assets after initial load

## 🚨 Common Mistakes

❌ **Don't:** Keep Development Build enabled in production
❌ **Don't:** Use uncompressed textures (4096x4096 PNG)
❌ **Don't:** Include unused assets in build
❌ **Don't:** Use uncompressed audio files
❌ **Don't:** Skip code stripping

✅ **Do:** Enable Brotli compression
✅ **Do:** Strip unused code
✅ **Do:** Compress all textures and audio
✅ **Do:** Test build size before deploying
✅ **Do:** Use WebGL-specific quality settings

## 📈 Expected Performance Gains

| Optimization | Size Reduction | Load Time Improvement |
|-------------|----------------|----------------------|
| Brotli Compression | 80-90% | 5-10x faster |
| Code Stripping | 10-30% | 1.2-1.5x faster |
| Texture Compression | 30-50% | 1.5-2x faster |
| Audio Compression | 60-80% | 1.3-1.8x faster |
| **Combined** | **85-95%** | **8-15x faster** |

## 🎯 Target Metrics

**Goal for Railway deployment:**
- Build size: <50MB total
- First load: <10 seconds
- Cached load: <3 seconds
- Memory usage: <500MB

These targets should make Railway performance comparable to local server!
