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

// Create volume directory
const VOLUME_DIR = "/data/unity-build-cache";
fs.mkdirSync(VOLUME_DIR, { recursive: true });

// Configure multer to save directly to volume
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VOLUME_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

app.use(compression());
app.use(express.json());

// Enable CORS for uploads
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Upload endpoint
app.post('/admin/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log(`✅ Uploaded: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
  res.json({ 
    success: true, 
    filename: req.file.originalname,
    size: req.file.size,
    path: req.file.path
  });
});

// List uploaded files
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

// Simple upload form
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
        button { background: #007bff; color: white; border: none; padding: 10px 20px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .progress { display: none; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>Upload Unity Build Files to Railway Volume</h1>
      <div class="upload-area">
        <input type="file" id="fileInput" multiple>
        <button onclick="uploadFiles()">Upload</button>
        <div class="progress" id="progress"></div>
      </div>
      <div class="file-list" id="fileList"></div>
      
      <script>
        async function uploadFiles() {
          const files = document.getElementById('fileInput').files;
          const progress = document.getElementById('progress');
          
          if (files.length === 0) {
            alert('Please select files first');
            return;
          }
          
          progress.style.display = 'block';
          progress.textContent = 'Uploading...';
          
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);
            
            progress.textContent = \`Uploading \${file.name} (\${i+1}/\${files.length})...\`;
            
            try {
              const response = await fetch('/admin/upload', {
                method: 'POST',
                body: formData
              });
              
              const result = await response.json();
              console.log('Uploaded:', result);
            } catch (error) {
              console.error('Upload failed:', error);
              alert('Upload failed: ' + error.message);
            }
          }
          
          progress.textContent = 'Upload complete!';
          loadFiles();
        }
        
        async function loadFiles() {
          const response = await fetch('/admin/files');
          const data = await response.json();
          
          const fileList = document.getElementById('fileList');
          fileList.innerHTML = '<h2>Uploaded Files</h2>';
          
          data.files.forEach(file => {
            fileList.innerHTML += \`
              <div class="file-item">
                <strong>\${file.filename}</strong> - \${file.sizeInMB} MB
              </div>
            \`;
          });
        }
        
        loadFiles();
      </script>
    </body>
    </html>
  `);
});

// Health check
app.get('/', (req, res) => {
  res.send('Upload server ready. Go to /admin to upload files.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Upload server running on port ${PORT}`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/admin`);
  console.log(`📁 Volume directory: ${VOLUME_DIR}`);
});
