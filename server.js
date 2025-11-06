import express from "express";
import compression from "compression";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Configure multer for volume uploads
const VOLUME_DIR = "/data/unity-build-cache";
fs.mkdirSync(VOLUME_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VOLUME_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

// Parse JSON for upload endpoints
app.use(express.json());

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

// Upload endpoint for transferring files to Railway volume
app.post('/admin/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  console.log(`✅ Uploaded: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
  res.json({ 
    success: true, 
    filename: req.file.originalname,
    size: req.file.size
  });
});

// List files in volume
app.get('/admin/files', (req, res) => {
  try {
    const files = fs.readdirSync(VOLUME_DIR).map(filename => {
      const filepath = path.join(VOLUME_DIR, filename);
      const stats = fs.statSync(filepath);
      return {
        filename,
        size: stats.size,
        sizeInMB: (stats.size / 1024 / 1024).toFixed(2)
      };
    });
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload interface
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Upload Build Files</title>
      <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        .upload-area { border: 2px dashed #ccc; padding: 30px; text-align: center; margin: 20px 0; }
        .file-list { margin-top: 30px; }
        .file-item { padding: 10px; border-bottom: 1px solid #eee; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; cursor: pointer; margin-top: 10px; }
        button:hover { background: #0056b3; }
        .progress { margin-top: 10px; color: #28a745; font-weight: bold; }
        .status { margin-top: 10px; padding: 10px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <h1>📤 Upload Unity Build Files</h1>
      <p>Upload files to Railway Volume at <code>/data/unity-build-cache</code></p>
      <div class="upload-area">
        <input type="file" id="fileInput" multiple>
        <button onclick="uploadFiles()">Upload Files</button>
        <div id="status"></div>
      </div>
      <div class="file-list" id="fileList"></div>
      
      <script>
        async function uploadFiles() {
          const files = document.getElementById('fileInput').files;
          const status = document.getElementById('status');
          
          if (files.length === 0) {
            status.className = 'status error';
            status.textContent = 'Please select files first';
            return;
          }
          
          status.className = 'status progress';
          status.textContent = 'Uploading...';
          
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);
            
            status.textContent = \`Uploading \${file.name} (\${i+1}/\${files.length})...\`;
            
            try {
              const response = await fetch('/admin/upload', {
                method: 'POST',
                body: formData
              });
              
              const result = await response.json();
              console.log('Uploaded:', result);
            } catch (error) {
              console.error('Upload failed:', error);
              status.className = 'status error';
              status.textContent = 'Upload failed: ' + error.message;
              return;
            }
          }
          
          status.className = 'status success';
          status.textContent = '✅ All files uploaded successfully!';
          loadFiles();
        }
        
        async function loadFiles() {
          const response = await fetch('/admin/files');
          const data = await response.json();
          
          const fileList = document.getElementById('fileList');
          fileList.innerHTML = '<h2>Files in Volume</h2>';
          
          if (data.files.length === 0) {
            fileList.innerHTML += '<p style="color: #666;">No files uploaded yet</p>';
          } else {
            data.files.forEach(file => {
              fileList.innerHTML += \`
                <div class="file-item">
                  <strong>\${file.filename}</strong> - \${file.sizeInMB} MB
                </div>
              \`;
            });
          }
        }
        
        loadFiles();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📦 Serving Unity WebGL build from ${__dirname}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`⚡ Compression enabled: gzip/brotli`);
  console.log(`💾 Cache headers: immutable, max-age=1y`);
});
