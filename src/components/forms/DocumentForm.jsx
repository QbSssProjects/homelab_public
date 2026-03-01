import React, { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Form for uploading manual documents
 * @param {Function} onSave - Save handler with file upload
 */
const DocumentForm = ({ onSave }) => {
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !file) {
            toast.error("Wymagana nazwa i plik do przesłania.");
            return;
        }

        setUploading(true);
        try {
            await onSave({ name, file });
            setName('');
            setFile(null);
            document.getElementById('manual-file-input').value = '';
        } catch (error) {
            console.error('Błąd zapisu dokumentu:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-4 border rounded-lg mb-4">
            <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                <span className="bg-purple-600 text-white px-2 py-1 text-sm rounded mr-2">R</span>
                Dodaj Własny Dokument (Przesyłanie Pliku)
            </h4>
            <p className="text-sm text-gray-600 mb-3">
                Plik zostanie przesłany do API serwera, zapisany w katalogu `/documents` i dodany do ewidencji z prefixem R.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
                <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nazwa dokumentu (np. Faktura VAT 123/2025)"
                    className="px-3 py-2 border rounded text-sm w-full"
                />
                <input
                    required
                    type="file"
                    id="manual-file-input"
                    onChange={e => setFile(e.target.files[0])}
                    className="px-3 py-1 border rounded text-sm w-full pt-2 bg-white"
                />
                <button
                    type="submit"
                    disabled={uploading}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm disabled:bg-purple-400 disabled:cursor-not-allowed self-end"
                >
                    {uploading ? 'Przesyłanie...' : 'Zapisz R'}
                </button>
            </form>
            {file && !uploading && (
                <p className="mt-2 text-sm text-gray-600">Wybrany plik: **{file.name}**</p>
            )}
        </div>
    );
};

export default DocumentForm;