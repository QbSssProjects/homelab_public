import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { generateComponentPdf, generateInvoicePdf } from '../../utils/pdfGenerator';
import { getNameById } from '../../utils/helpers';
import DocumentForm from '../forms/DocumentForm';
import BarcodeDisplay from '../common/BarcodeDisplay';

/**
 * Documentation view for managing documents and generating PDFs/invoices
 * @param {Array} components - List of components
 * @param {Array} categories - List of categories
 * @param {Array} parameters - List of parameters
 * @param {Array} documents - List of documents
 * @param {Function} addDocument - Add document function
 * @param {Function} removeDocument - Remove document function
 * @param {Function} updateDocument - Update document function
 * @param {string} userId - Current user ID
 */
const DocumentationView = ({
                               components,
                               categories,
                               parameters,
                               documents,
                               addDocument,
                               removeDocument,
                               updateDocument,
                               userId
                           }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [newDocumentName, setNewDocumentName] = useState('');

    const [selectedComponentIds, setSelectedComponentIds] = useState([]);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({
        invoiceNumber: '',
        issueDate: new Date().toISOString().substring(0, 10),
        paymentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        vatPercent: 0,
        seller: 'QbSssProjects \nUl. Staszica 10 / 16\n82-500',
        buyer: 'Nabywca Sp. z o.o.\nUl. Klienta 2\n00-002 Miasto\nNIP: 0987654321',
        notes: 'Dziękujemy za zakupy!'
    });

    const UPLOAD_API_ENDPOINT = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/upload-document`;
    const BACKEND_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const [componentSearchTerm, setComponentSearchTerm] = useState('');

    const filteredComponents = useMemo(() => {
        const term = componentSearchTerm.toLowerCase();
        return components.filter(comp =>
            comp.name.toLowerCase().includes(term) ||
            (comp.internalId && comp.internalId.toLowerCase().includes(term)) ||
            (comp.id && comp.id.toLowerCase().includes(term)) ||
            getNameById(comp.categoryId, categories).toLowerCase().includes(term)
        );
    }, [components, componentSearchTerm, categories]);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                doc.name.toLowerCase().includes(searchLower) ||
                (doc.fileName && doc.fileName.toLowerCase().includes(searchLower)) ||
                (doc.internalId && doc.internalId.toLowerCase().includes(searchLower)) ||
                (doc.componentInternalId && doc.componentInternalId.toLowerCase().includes(searchLower));

            const matchesType = selectedType === 'all' ||
                (selectedType === 'Manual' && doc.type === 'Manual') ||
                (selectedType === 'Generated' && doc.type === 'Generated');

            return matchesSearch && matchesType;
        });
    }, [documents, searchTerm, selectedType]);

    const groupedDocuments = useMemo(() => {
        return filteredDocuments.reduce((acc, doc) => {
            acc[doc.type] = acc[doc.type] || [];
            acc[doc.type].push(doc);
            return acc;
        }, {});
    }, [filteredDocuments]);

    const handleEditStart = (doc) => {
        setEditingId(doc.id);
        setNewDocumentName(doc.name);
    };

    const handleSaveEdit = async (docId) => {
        if (!newDocumentName.trim()) {
            toast.error("Tytuł nie może być pusty.");
            return;
        }

        try {
            await updateDocument(docId, { name: newDocumentName });
            setEditingId(null);
            setNewDocumentName('');
            toast.success('Tytuł zaktualizowany.');
        } catch (e) {
            console.error('Błąd aktualizacji tytułu:', e);
            toast.error('Nie udało się zaktualizować tytułu.');
        }
    };

    const saveGeneratedDocument = async (componentName, internalId) => {
        const payload = {
            name: `Automatyczny PDF: ${componentName}`,
            link: `Pobrany przez użytkownika (${internalId})`,
            type: 'Generated',
            componentInternalId: internalId
        };
        await addDocument(payload, 'G');
    };

    const generatePdf = async (component) => {
        generateComponentPdf(component, categories, parameters);
        toast.success("✅ PDF został wygenerowany z polskimi znakami!");
    };

    const handleAddManualDocument = async (payload) => {
        const { name, file } = payload;
        const formData = new FormData();
        formData.append('documentName', name);
        formData.append('file', file);
        formData.append('userId', userId);

        try {
            const response = await fetch(UPLOAD_API_ENDPOINT, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Wysyłka nieudana. Status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.filePath) {
                throw new Error("Brak ścieżki do pliku.");
            }

            await addDocument({
                name,
                link: data.filePath,
                type: 'Manual',
                fileName: file.name,
            }, 'R');

            toast.success(`Przesłano dokument: ${file.name}`);
        } catch (e) {
            console.error('Błąd:', e);
            toast.error(`Błąd: ${e.message}`);
            throw e;
        }
    };

    const toggleComponentSelection = useCallback((componentId) => {
        setSelectedComponentIds(prev =>
            prev.includes(componentId)
                ? prev.filter(id => id !== componentId)
                : [...prev, componentId]
        );
    }, []);

    const openInvoiceModal = () => {
        if (selectedComponentIds.length === 0) {
            toast.warn('Wybierz komponenty, aby wygenerować fakturę.');
            return;
        }
        setIsInvoiceModalOpen(true);
    };

    const closeInvoiceModal = () => setIsInvoiceModalOpen(false);

    const handleInvoiceField = (field, value) => {
        setInvoiceForm(prev => ({ ...prev, [field]: value }));
    };

    const generateInvoiceData = useMemo(() => {
        return components
            .filter(comp => selectedComponentIds.includes(comp.id))
            .map(comp => ({
                name: comp.name,
                internalId: comp.internalId,
                unitPrice: comp.value || 0,
                quantity: 1,
                totalNet: comp.value || 0,
                totalGross: (comp.value || 0)
            }));
    }, [components, selectedComponentIds, invoiceForm.vatPercent]);

    const generateInvoice = () => {
        if (generateInvoiceData.length === 0) {
            toast.error("Brak danych do wygenerowania faktury.");
            return;
        }

        generateInvoicePdf(generateInvoiceData, invoiceForm);

        // ✅ Save complete invoice data including metadata
        addDocument({
            name: `Faktura VAT: ${invoiceForm.invoiceNumber || 'FV'} (${invoiceForm.issueDate})`,
            link: `Generowana faktura dla ${generateInvoiceData.length} komponentów.`,
            type: 'Generated',
            componentInternalId: generateInvoiceData.map(d => d.internalId).join(', '),

            // ✅ ADD THIS: Store original invoice form data
            invoiceMetadata: {
                invoiceNumber: invoiceForm.invoiceNumber,
                issueDate: invoiceForm.issueDate,
                paymentDue: invoiceForm.paymentDue,
                vatPercent: invoiceForm.vatPercent,
                seller: invoiceForm.seller,
                buyer: invoiceForm.buyer,
                notes: invoiceForm.notes
            }
        }, 'F');

        toast.success("✅ Faktura została wygenerowana i zapisana (F).");
        closeInvoiceModal();
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dokumentacja</h1>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Wyszukiwarka
                        </label>
                        <input
                            type="text"
                            placeholder="Szukaj po nazwie, ID, nazwie pliku..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Typ dokumentu
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Wszystkie dokumenty</option>
                            <option value="Manual">Dokumenty ręczne (R)</option>
                            <option value="Generated">Dokumenty generowane (G)</option>
                            <option value="Invoice">Faktury (F)</option>
                        </select>
                    </div>
                </div>
                <div className="text-sm text-gray-600">
                    Znaleziono dokumentów: {filteredDocuments.length}
                </div>
            </div>

            <DocumentForm onSave={handleAddManualDocument} />

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                    <span className="bg-green-600 text-white px-2 py-1 text-sm rounded mr-2">G/F</span>
                    Generator Dokumentacji i Faktur (Automatyczny)
                </h2>

                <p className="mb-4 text-sm text-gray-600">
                    Wybierz komponenty, aby wygenerować dokumentację PDF (jedna pozycja) lub fakturę (wiele pozycji).
                </p>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Szukaj komponentów po nazwie lub ID..."
                        value={componentSearchTerm}
                        onChange={e => setComponentSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-600 mt-2">Znaleziono komponentów: {filteredComponents.length}</p>
                </div>

                {filteredComponents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border rounded mb-4">
                        {filteredComponents.map(comp => (
                            <label
                                key={comp.id}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                                    selectedComponentIds.includes(comp.id)
                                        ? 'bg-indigo-100 border-indigo-300'
                                        : 'bg-gray-50 border border-gray-200'
                                }`}
                            >
                                <div>
                                    <div className="font-semibold">{comp.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {comp.internalId || comp.id} – {getNameById(comp.categoryId, categories)}
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedComponentIds.includes(comp.id)}
                                    onChange={() => toggleComponentSelection(comp.id)}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                                {selectedComponentIds.length === 1 && selectedComponentIds.includes(comp.id) && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            generatePdf(comp);
                                            saveGeneratedDocument(comp.name, comp.internalId);
                                        }}
                                        className="bg-blue-600 text-white py-1 px-3 rounded text-xs ml-3 hover:bg-blue-700"
                                    >
                                        Generuj PDF
                                    </button>
                                )}
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Brak komponentów spełniających kryteria wyszukiwania.</p>
                )}

                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                    <p className="text-sm text-gray-700">
                        Wybrano do faktury: <strong>{selectedComponentIds.length}</strong> komponentów.
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={openInvoiceModal}
                            disabled={selectedComponentIds.length === 0}
                            className={`py-2 px-4 rounded transition ${
                                selectedComponentIds.length > 0
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Generuj Fakturę (F)
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
                    Zarejestrowane Dokumenty
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-purple-700 mb-3 flex items-center">
                            <span className="bg-purple-200 text-purple-700 px-2 py-1 text-sm rounded mr-2">R</span>
                            Ręczne
                        </h3>
                        {groupedDocuments.Manual?.length > 0 ? (
                            <ul className="space-y-2">
                                {groupedDocuments.Manual.map(doc => {
                                    const downloadUrl = `${BACKEND_BASE_URL}${doc.link}`;
                                    const isEditing = editingId === doc.id;

                                    return (
                                        <li key={doc.id} className="bg-purple-50 p-2 rounded flex flex-col">
                                            <div className='flex justify-between items-start'>
                                                <div className='text-sm flex-1 mr-4'>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={newDocumentName}
                                                            onChange={(e) => setNewDocumentName(e.target.value)}
                                                            className="font-semibold px-2 py-1 border rounded w-full text-base"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveEdit(doc.id);
                                                                if (e.key === 'Escape') setEditingId(null);
                                                            }}
                                                        />
                                                    ) : (
                                                        <p className="font-semibold">{doc.name}</p>
                                                    )}
                                                    <p className="text-xs text-gray-600">
                                                        Nr: {doc.internalId} (Plik: {doc.fileName})
                                                    </p>
                                                </div>
                                                <div className='flex space-x-2'>
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleSaveEdit(doc.id)}
                                                                className="text-green-600 hover:text-green-800 text-sm font-semibold"
                                                                disabled={!newDocumentName.trim()}
                                                            >
                                                                Zapisz
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="text-gray-600 hover:text-gray-800 text-sm"
                                                            >
                                                                Anuluj
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                        <button
                                                            onClick={() => handleEditStart(doc)}
                                                            className="text-yellow-600 hover:text-yellow-800 text-sm"
                                                        >
                                                            Edytuj
                                                        </button>

                                                        <a href={downloadUrl}
                                                        download={doc.fileName || 'dokument'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline text-sm"
                                                        >
                                                        Pobierz
                                                        </a>
                                                        <button
                                                        onClick={() => removeDocument(doc.id)}
                                                     className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Usuń
                                                </button>
                                            </>
                                            )}
                                        </div>
                                </div>
                                    <div className='mt-2 flex justify-center w-full'>
                                        <BarcodeDisplay
                                            data={doc.name}
                                            style={{ maxWidth: '200px', height: '35px' }}
                                        />
                                    </div>
                                </li>
                                )
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm">Brak ręcznie dodanych dokumentów.</p>
                        )}
                    </div>

                    <div className="border p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
                            <span className="bg-green-200 text-green-700 px-2 py-1 text-sm rounded mr-2">G/F</span>
                            Generowane (PDF/Faktury)
                        </h3>
                        {(groupedDocuments.Generated?.length > 0 || groupedDocuments.Invoice?.length > 0) ? (
                            <ul className="space-y-2">
                                {
                                    [
                                        ...(groupedDocuments.Generated || []),
                                    ].map(doc => {
                                        const isEditing = editingId === doc.id;
                                        const isInvoice = doc.name.startsWith('Faktura VAT:');

                                        return (
                                            <li key={doc.id} className={`${isInvoice ? 'bg-indigo-50' : 'bg-green-50'} p-2 rounded flex flex-col`}>
                                                <div className='flex justify-between items-start'>
                                                    <div className='text-sm flex-1 mr-4'>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={newDocumentName}
                                                                onChange={(e) => setNewDocumentName(e.target.value)}
                                                                className="font-semibold px-2 py-1 border rounded w-full text-base"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveEdit(doc.id);
                                                                    if (e.key === 'Escape') setEditingId(null);
                                                                }}
                                                            />
                                                        ) : (
                                                            <p className="font-semibold">{doc.name}</p>
                                                        )}
                                                        <p className="text-xs text-gray-600">
                                                            Typ: {isInvoice ? 'Faktura (F)' : 'Dokumentacja (G)'}
                                                        </p>
                                                    </div>
                                                    <div className='flex space-x-2'>
                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleSaveEdit(doc.id)}
                                                                    className="text-green-600 hover:text-green-800 text-sm font-semibold"
                                                                    disabled={!newDocumentName.trim()}
                                                                >
                                                                    Zapisz
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingId(null)}
                                                                    className="text-gray-600 hover:text-gray-800 text-sm"
                                                                >
                                                                    Anuluj
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditStart(doc)}
                                                                    className="text-yellow-600 hover:text-yellow-800 text-sm"
                                                                >
                                                                    Edytuj
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        try {
                                                                            const isInvoice = doc.name.startsWith('Faktura VAT:');

                                                                            if (!isInvoice) {
                                                                                // Component PDF regeneration (unchanged)
                                                                                const component = components.find(
                                                                                    c => c.internalId === doc.componentInternalId
                                                                                );

                                                                                if (!component) {
                                                                                    toast.error("Nie znaleziono powiązanego komponentu.");
                                                                                    return;
                                                                                }

                                                                                generateComponentPdf(component, categories, parameters);
                                                                                toast.success("PDF został ponownie wygenerowany.");
                                                                            } else {
                                                                                // ✅ Invoice regeneration with STORED data
                                                                                const internalIds = doc.componentInternalId
                                                                                    .split(',')
                                                                                    .map(x => x.trim())
                                                                                    .filter(Boolean);

                                                                                const comps = components.filter(c =>
                                                                                    internalIds.includes(c.internalId)
                                                                                );

                                                                                if (comps.length === 0) {
                                                                                    toast.error("Nie znaleziono komponentów do faktury.");
                                                                                    return;
                                                                                }

                                                                                const invoiceItems = comps.map(c => ({
                                                                                    name: c.name,
                                                                                    internalId: c.internalId,
                                                                                    unitPrice: c.value || 0,
                                                                                    quantity: 1,
                                                                                    totalNet: c.value || 0,
                                                                                    totalGross: (c.value || 0) * (1 + (doc.invoiceMetadata?.vatPercent || 23) / 100)
                                                                                }));

                                                                                // ✅ Use stored metadata OR fallback to defaults
                                                                                const rebuiltInvoice = {
                                                                                    invoiceNumber: doc.invoiceMetadata?.invoiceNumber || doc.internalId || "FV",
                                                                                    issueDate: doc.invoiceMetadata?.issueDate || new Date().toISOString().substring(0, 10),
                                                                                    paymentDue: doc.invoiceMetadata?.paymentDue || new Date(Date.now() + 7 * 86400000)
                                                                                        .toISOString()
                                                                                        .substring(0, 10),
                                                                                    vatPercent: doc.invoiceMetadata?.vatPercent,
                                                                                    seller: doc.invoiceMetadata?.seller || "Twoja Firma Sp. z o.o.\nUl. Przykładowa 1\n00-001 Miasto\nNIP: 1234567890",
                                                                                    buyer: doc.invoiceMetadata?.buyer || "Nabywca Sp. z o.o.\nUl. Klienta 2\n00-002 Miasto\nNIP: 0987654321",
                                                                                    notes: doc.invoiceMetadata?.notes || "Ponownie wygenerowana faktura."
                                                                                };
                                                                                console.log(doc.invoiceMetadata.vatPercent);
                                                                                console.log(doc.invoiceMetadata.buyer);

                                                                                generateInvoicePdf(invoiceItems, rebuiltInvoice);
                                                                                toast.success("Faktura została ponownie wygenerowana z oryginalnymi danymi.");
                                                                            }
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                            toast.error("Błąd podczas generowania dokumentu.");
                                                                        }
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                                >
                                                                    Pobierz
                                                                </button>
                                                                <button
                                                                    onClick={() => removeDocument(doc.id)}
                                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                                >
                                                                    Usuń
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className='mt-2 flex justify-center w-full'>
                                                    <BarcodeDisplay
                                                        data={doc.internalId || doc.name}
                                                        style={{ maxWidth: '200px', height: '35px' }}
                                                    />
                                                </div>
                                            </li>
                                        )
                                    })
                                }
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm">Brak zarejestrowanych wygenerowanych dokumentów/faktur.</p>
                        )}
                    </div>
                </div>
            </div>

            {isInvoiceModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold text-gray-800">Konfiguracja Faktury</h3>
                            <button onClick={closeInvoiceModal} className="text-3xl text-gray-400 hover:text-gray-700 transition">
                                &times;
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Numer faktury</label>
                                <input
                                    value={invoiceForm.invoiceNumber}
                                    onChange={e => handleInvoiceField('invoiceNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="np. FV/01/2024"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Data wystawienia</label>
                                <input
                                    type="date"
                                    value={invoiceForm.issueDate}
                                    onChange={e => handleInvoiceField('issueDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Termin płatności</label>
                                <input
                                    type="date"
                                    value={invoiceForm.paymentDue}
                                    onChange={e => handleInvoiceField('paymentDue', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">VAT (%)</label>
                                <input
                                    type="number"
                                    value={invoiceForm.vatPercent}
                                    onChange={e => handleInvoiceField('vatPercent', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm text-gray-700 mb-1">Sprzedawca</label>
                            <textarea
                                value={invoiceForm.seller}
                                onChange={e => handleInvoiceField('seller', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                rows={3}
                                placeholder="Nazwa firmy, adres, NIP"
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm text-gray-700 mb-1">Nabywca</label>
                            <textarea
                                value={invoiceForm.buyer}
                                onChange={e => handleInvoiceField('buyer', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                rows={3}
                                placeholder="Nazwa klienta, adres, NIP"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm text-gray-700 mb-1">Notatki</label>
                            <input
                                value={invoiceForm.notes}
                                onChange={e => handleInvoiceField('notes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Dodatkowe informacje, forma płatności"
                            />
                        </div>

                        <div className="mt-6 p-3 bg-gray-50 border rounded">
                            <h4 className="font-semibold text-sm mb-1">Wybrane komponenty:</h4>
                            <p className="text-xs text-gray-600">{generateInvoiceData.map(d => d.name).join(', ')}</p>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                            <button
                                onClick={closeInvoiceModal}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={generateInvoice}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-400"
                                disabled={!invoiceForm.invoiceNumber || generateInvoiceData.length === 0}
                            >
                                Generuj i Zapisz (F)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentationView;