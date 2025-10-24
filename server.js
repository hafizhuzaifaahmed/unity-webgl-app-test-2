import express from "express";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Enable gzip/brotli compression for all responses
// This can reduce Unity WebGL file sizes by 60-80%
app.use(compression({
  filter: (req, res) => {
    // Compress all text-based files
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression ratio and CPU usage
  threshold: 1024 // Only compress files larger than 1KB
}));

// CRITICAL: Set correct MIME types and headers for Unity WebGL files
app.use((req, res, next) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  if (req.url.endsWith('.wasm')) {
    res.setHeader('Content-Type', 'application/wasm');
    // No browser caching - serve fresh from server each time
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.url.endsWith('.data')) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.url.endsWith('.framework.js') || req.url.endsWith('.loader.js')) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  } else if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  } else if (req.url.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }
  next();
});

// Serve static files from root directory - no browser caching
app.use(express.static(__dirname, { 
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filepath) => {
    // Additional headers for Unity WebGL files
    if (filepath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    } else if (filepath.endsWith('.data')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }
}));

// Explicitly serve Build folder
app.use('/Build', express.static(path.join(__dirname, 'Build')));

// Explicitly serve TemplateData folder
app.use('/TemplateData', express.static(path.join(__dirname, 'TemplateData')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📦 Serving Unity WebGL build from ${__dirname}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`⚡ Compression enabled: gzip/brotli`);
  console.log(`💾 Cache headers: immutable, max-age=1y`);
});
