// Importy
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Wymagane do komunikacji z Reactem

const app = express();
const PORT = 3001; // Użyj innego portu niż React (zazwyczaj 3000)

// Zezwól na CORS, aby React mógł się komunikować
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Ścieżka, gdzie będą zapisywane dokumenty.
// Użyj katalogu w serwerze, np. 'server/uploaded_documents'
const UPLOAD_DIR = path.join(__dirname, 'uploaded_documents');

// Upewnij się, że katalog istnieje
if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR);
}

// Konfiguracja Multer do obsługi plików
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Zapisz pliki w naszym dedykowanym katalogu
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Nazwa pliku: timestamp_oryginalnanazwa.pdf
        const timestamp = Date.now();
        cb(null, `${timestamp}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// -----------------------------------------------------------
// Endpoint API do przesyłania dokumentów
// Endpoint odpowiada 'UPLOAD_API_ENDPOINT' z App.js ('/api/upload-document')
// -----------------------------------------------------------
app.post('/api/upload-document', upload.single('file'), (req, res) => {
    // `upload.single('file')` przetwarza plik i zapisuje go na dysku

    if (!req.file) {
        return res.status(400).send('Brak pliku do przesłania.');
    }

    // Budujemy ścieżkę, która będzie zapisana w Firestore.
    // Możesz tutaj użyć pełnego URL, ścieżki sieciowej (SMB) lub URL dostępu przez serwer statyczny.
    // Dla testów, zwrócimy ścieżkę relatywną
    const relativeFilePath = `/documents/${req.file.filename}`;

    console.log(`Plik zapisany: ${req.file.path}`);

    // Odpowiedz do Reacta z informacją o powodzeniu i ścieżką
    res.json({
        message: 'Plik przesłany pomyślnie.',
        filePath: relativeFilePath, // Ta ścieżka pójdzie do Firestore jako 'link'
        documentName: req.body.documentName
    });
});

// Opcjonalnie: Udostępnienie katalogu uploaded_documents jako statyczny
app.use('/documents', express.static(UPLOAD_DIR));


app.listen(PORT, () => {
    console.log(`Serwer backend działa na http://localhost:${PORT}`);
});