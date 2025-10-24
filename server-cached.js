import express from "express";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// In-memory cache for Unity build files
// This keeps files in RAM for instant serving (no disk I/O)
const fileCache = new Map();
let cacheInitialized = false;

// Preload Unity build files into memory on server start
async function initializeCache() {
  if (cacheInitialized) return;
  
  console.log('🔄 Loading Unity build files into memory cache...');
  const filesToCache = [
    'Build/deployment_1_1.wasm',
    'Build/deployment_1_1.data',
    'Build/deployment_1_1_framework.js',
    'Build/deployment_1_1_loader.js'
  ];

  for (const file of filesToCache) {
    const filePath = path.join(__dirname, file);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        fileCache.set(file, content);
        const sizeMB = (content.length / 1024 / 1024).toFixed(2);
        console.log(`  ✅ Cached ${file} (${sizeMB} MB)`);
      }
    } catch (err) {
      console.error(`  ❌ Failed to cache ${file}:`, err.message);
    }
  }
  
  cacheInitialized = true;
  const totalSize = Array.from(fileCache.values()).reduce((sum, buf) => sum + buf.length, 0);
  console.log(`💾 Cache initialized: ${(totalSize / 1024 / 1024).toFixed(2)} MB in memory`);
}

// Trust Railway proxy
app.set('trust proxy', true);

// Enable compression for responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// Serve cached files from memory
app.use((req, res, next) => {
  const requestedFile = req.url.substring(1); // Remove leading slash
  
  if (fileCache.has(requestedFile)) {
    const content = fileCache.get(requestedFile);
    
    // Set appropriate headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    if (requestedFile.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    } else if (requestedFile.endsWith('.data')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    } else if (requestedFile.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    
    // No browser caching - server cache handles it
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Served-From', 'memory-cache');
    
    console.log(`⚡ Serving ${requestedFile} from memory cache (${(content.length / 1024 / 1024).toFixed(2)} MB)`);
    return res.send(content);
  }
  
  next();
});

// Set headers for all other requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  if (req.url.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  } else if (req.url.endsWith('.css') || req.url.endsWith('.png') || req.url.endsWith('.ico')) {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours for assets
  }
  
  next();
});

// Serve static files (for files not in cache)
app.use(express.static(__dirname, { 
  maxAge: 0,
  etag: false,
  lastModified: false
}));

app.use('/Build', express.static(path.join(__dirname, 'Build')));
app.use('/TemplateData', express.static(path.join(__dirname, 'TemplateData')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cacheStatus: cacheInitialized ? 'initialized' : 'not-initialized',
    cachedFiles: Array.from(fileCache.keys()),
    cacheSize: `${(Array.from(fileCache.values()).reduce((sum, buf) => sum + buf.length, 0) / 1024 / 1024).toFixed(2)} MB`,
    timestamp: new Date().toISOString()
  });
});

// Cache status endpoint
app.get('/cache-status', (req, res) => {
  const cacheInfo = Array.from(fileCache.entries()).map(([file, content]) => ({
    file,
    size: `${(content.length / 1024 / 1024).toFixed(2)} MB`,
    sizeBytes: content.length
  }));
  
  res.json({
    initialized: cacheInitialized,
    files: cacheInfo,
    totalSize: `${(Array.from(fileCache.values()).reduce((sum, buf) => sum + buf.length, 0) / 1024 / 1024).toFixed(2)} MB`
  });
});

// Initialize cache before starting server
initializeCache().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📦 Serving Unity WebGL build from ${__dirname}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log(`⚡ In-memory cache: ${cacheInitialized ? 'ENABLED' : 'DISABLED'}`);
    console.log(`💾 Cached files: ${fileCache.size}`);
    console.log(`🏥 Health check: /health`);
    console.log(`📊 Cache status: /cache-status`);
  });
});
