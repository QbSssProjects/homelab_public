/*
* System dokumentacji dostępny jest jako api jedynie lokalnie. Serwer odpytuje lokalnie o dane
* Same dokumenty są wysawione jedynie przez GUI i pamięć serwera.
* Nie ma bezpośredniego dostępu do API dkomentów z zewnętrzej sieci
 */

// Importy

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const os = require('os');

const serveIndex = require('serve-index');

const app = express();
const PORT = 3001;

// CORS - Allow all local network access
app.use(cors({
    origin: true, // Allow all origins for development
    credentials: true
}));
app.use(express.json());

// Ścieżka, gdzie będą zapisywane dokumenty
const UPLOAD_DIR = path.join(__dirname, 'uploaded_documents');

// Upewnij się, że katalog istnieje
if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Konfiguracja Multer do obsługi plików
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        // Sanitize filename to avoid issues
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}_${safeName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// -----------------------------------------------------------
// Endpoint API do przesyłania dokumentów
// -----------------------------------------------------------
app.post('/api/upload-document', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Brak pliku do przesłania.' });
    }

    const relativeFilePath = `/documents/${req.file.filename}`;

    console.log(`✅ Plik zapisany: ${req.file.path}`);
    console.log(`📄 Nazwa: ${req.body.documentName || 'Brak nazwy'}`);

    res.json({
        message: 'Plik przesłany pomyślnie.',
        filePath: relativeFilePath,
        documentName: req.body.documentName,
        fileName: req.file.filename
    });
});

// opcjonalnie: przekierowanie bez slash do wersji ze slash
// Debug logging dla /documents — musi być przed static/serveIndex
app.use('/documents', (req, res, next) => {
    console.log('DEBUG /documents ->', req.method, req.originalUrl);
    next();
});

// Przekierowanie bez slash -> z slash (zarejestrowane przed static)
app.get('/documents', (req, res) => {
    res.redirect(301, '/documents/');
});

app.use('/documents',
    express.static(UPLOAD_DIR, {
        dotfiles: 'ignore',
        index: false,
        setHeaders: (res, filePath) => {
            res.set('Access-Control-Allow-Origin', '*');
        }
    }),
    serveIndex(UPLOAD_DIR, { icons: true, view: 'details' })
);

// Po zmianie zrestartuj node i sprawdź:
// curl -I http://localhost:3001/documents/
// curl http://localhost:3001/documents/


// ✅ ADD: List documents endpoint (optional, useful for debugging)
app.get('/api/documents', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Błąd odczytu katalogu' });
        }
        res.json({
            files: files,
            count: files.length,
            uploadDir: UPLOAD_DIR
        });
    });
});

// ✅ ADD: Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend działa poprawnie',
        timestamp: new Date().toISOString(),
        uploadDir: UPLOAD_DIR
    });
});

// ✅ ADD: Root endpoint
app.get('/', (req, res) => {
    const localIP = getLocalIP();
    res.send(`
        <html>
            <head><title>Homelab Backend</title></head>
            <body style="font-family: Arial; padding: 40px; background: #f5f5f5;">
                <h1>🚀 Homelab Backend API</h1>
                <p><strong>Status:</strong> <span style="color: green;">Działa poprawnie</span></p>
                <hr>
                <h3>Dostępne endpointy:</h3>
                <ul>
                    <li><a href="/api/health">/api/health</a> - Status serwera</li>
                    <li><a href="/api/documents">/api/documents</a> - Lista dokumentów</li>
                    <li><code>POST /api/upload-document</code> - Upload pliku</li>
                    <li><a href="/documents">/documents/</a> - Statyczne pliki</li>
                </ul>
                <hr>
                <p><strong>Local:</strong> http://localhost:${PORT}</p>
                <p><strong>Network:</strong> http://${localIP}:${PORT}</p>
                <p><strong>Upload Dir:</strong> ${UPLOAD_DIR}</p>
            </body>
        </html>
    `);
});

// Helper function to get local IP
function getLocalIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log('=================================================');
    console.log('🚀 Homelab Backend Server');
    console.log('=================================================');
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${localIP}:${PORT}`);
    console.log('=================================================');
    console.log(`📂 Upload directory: ${UPLOAD_DIR}`);
    console.log(`🌐 Documents URL: http://${localIP}:${PORT}/documents`);
    console.log(`💚 Health check: http://${localIP}:${PORT}/api/health`);
    console.log('=================================================');
});