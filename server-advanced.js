import express from "express";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Trust Railway proxy for correct client IP
app.set('trust proxy', true);

// Enable gzip/brotli compression with optimized settings
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression ratio and CPU
  threshold: 1024,
  memLevel: 8 // Higher memory for better compression
}));

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// CRITICAL: Set correct MIME types and caching headers
app.use((req, res, next) => {
  // Enable CORS for better compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  if (req.url.endsWith('.wasm')) {
    res.setHeader('Content-Type', 'application/wasm');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  } else if (req.url.endsWith('.data')) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  } else if (req.url.endsWith('.framework.js') || req.url.endsWith('.loader.js')) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.url.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  } else if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.url.endsWith('.png') || req.url.endsWith('.jpg') || req.url.endsWith('.ico')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  next();
});

// Serve static files with optimized settings
app.use(express.static(__dirname, { 
  maxAge: '1y',
  immutable: true,
  etag: true,
  lastModified: true,
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    } else if (filepath.endsWith('.data')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }
}));

// Explicitly serve Build folder
app.use('/Build', express.static(path.join(__dirname, 'Build'), {
  maxAge: '1y',
  immutable: true
}));

// Explicitly serve TemplateData folder
app.use('/TemplateData', express.static(path.join(__dirname, 'TemplateData'), {
  maxAge: '1y',
  immutable: true
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('File not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal server error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📦 Serving Unity WebGL build from ${__dirname}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`⚡ Compression enabled: gzip/brotli`);
  console.log(`💾 Cache headers: immutable, max-age=1y`);
  console.log(`🏥 Health check: /health`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
});
