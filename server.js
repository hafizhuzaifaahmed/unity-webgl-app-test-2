import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// CRITICAL: Set correct MIME types and prevent compression for Unity WebGL files
app.use((req, res, next) => {
  if (req.url.endsWith('.wasm')) {
    res.setHeader('Content-Type', 'application/wasm');
    res.setHeader('Cache-Control', 'no-transform');
  } else if (req.url.endsWith('.data')) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-transform');
  } else if (req.url.endsWith('.framework.js') || req.url.endsWith('.loader.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});

// Serve static files from root directory (includes Build and TemplateData folders)
app.use(express.static(__dirname, { 
  maxAge: '1y',
  setHeaders: (res, filepath) => {
    // Additional headers for Unity WebGL files
    if (filepath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
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

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📦 Serving Unity WebGL build from ${__dirname}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
