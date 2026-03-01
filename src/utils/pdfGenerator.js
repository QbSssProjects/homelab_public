import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import { getNameById } from './helpers';
import "jspdf-autotable";

/**
 * Generates a PDF document for a component with barcode
 * @param {Object} component - Component data
 * @param {Array} categories - List of categories
 * @param {Array} parameters - List of parameters
 */
export const generateComponentPdf = (component, categories, parameters) => {
    const doc = new jsPDF();

    const lineHeight = 6;
    const maxWidth = 180;
    const pageHeight = doc.internal.pageSize.height || 297;
    const bottomMargin = 20;
    let currentY = 20;

    function checkPageBreak(linesCount = 1) {
        const requiredSpace = linesCount * lineHeight;
        if (currentY + requiredSpace > pageHeight - bottomMargin) {
            doc.addPage();
            currentY = 20;
        }
    }

    // Set font for Polish characters
    doc.setFont("DejaVuSans", "normal");
    doc.setLanguage("pl");

    // Header
    doc.setFontSize(16);
    const headerLines = doc.splitTextToSize(`Dokumentacja dla: ${component.name}`, maxWidth);
    checkPageBreak(headerLines.length);
    doc.text(headerLines, 14, currentY);
    currentY += headerLines.length * lineHeight;

    // Basic info
    doc.setFontSize(14);
    const idLines = doc.splitTextToSize(`Numer wewnętrzny: ${component.internalId || "Brak"}`, maxWidth);
    checkPageBreak(idLines.length);
    doc.text(idLines, 14, currentY);
    currentY += idLines.length * lineHeight;

    doc.setFontSize(13);
    const catLines = doc.splitTextToSize(`Kategoria: ${getNameById(component.categoryId, categories)}`, maxWidth);
    checkPageBreak(catLines.length);
    doc.text(catLines, 14, currentY);
    currentY += catLines.length * lineHeight;

    const statusLines = doc.splitTextToSize(`Status: ${component.status || "—"}`, maxWidth);
    checkPageBreak(statusLines.length);
    doc.text(statusLines, 14, currentY);
    currentY += statusLines.length * lineHeight;

    const value = (component.value || 0).toLocaleString("pl-PL", {
        style: "currency",
        currency: "PLN",
    });
    const valueLines = doc.splitTextToSize(`Wartość: ${value}`, maxWidth);
    checkPageBreak(valueLines.length);
    doc.text(valueLines, 14, currentY);
    currentY += valueLines.length * (lineHeight + 1);

    // Parameters
    if (component.paramsData && Object.keys(component.paramsData).length > 0) {
        doc.setFontSize(14);
        const paramHeader = doc.splitTextToSize("Parametry:", maxWidth);
        checkPageBreak(paramHeader.length);
        doc.text(paramHeader, 14, currentY);
        currentY += paramHeader.length * lineHeight;

        doc.setFontSize(10);
        Object.entries(component.paramsData).forEach(([paramId, value]) => {
            const paramName = getNameById(paramId, parameters);
            const paramText = `${paramName}: ${value}`;
            const paramLines = doc.splitTextToSize(paramText, maxWidth);
            checkPageBreak(paramLines.length);
            doc.text(paramLines, 14, currentY);
            currentY += paramLines.length * lineHeight;
        });
        currentY += lineHeight;
    }

    // Barcode
    const barcodeValue = component.internalId || component.id;
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeValue, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: true,
    });
    const imgData = canvas.toDataURL("image/png");

    const barcodeHeight = 30;
    checkPageBreak(barcodeHeight / lineHeight);
    doc.addImage(imgData, "PNG", 14, currentY, 120, barcodeHeight);
    currentY += barcodeHeight + 10;

    // Save file
    const filename = `${(component.internalId || component.name).replace(/\//g, "-")}_doc.pdf`;
    doc.save(filename);
};

/**
 * Helper function to calculate optimal font size for text to fit in column
 * @param {jsPDF} doc - jsPDF instance
 * @param {string} text - Text to measure
 * @param {number} maxWidth - Maximum width available
 * @param {number} startFontSize - Starting font size
 * @param {number} minFontSize - Minimum font size
 * @returns {number} Optimal font size
 */
const getOptimalFontSize = (doc, text, maxWidth, startFontSize = 8, minFontSize = 5) => {
    let fontSize = startFontSize;
    doc.setFontSize(fontSize);

    while (fontSize > minFontSize) {
        const textWidth = doc.getTextWidth(String(text));
        if (textWidth <= maxWidth) {
            return fontSize;
        }
        fontSize -= 0.5;
        doc.setFontSize(fontSize);
    }

    return minFontSize;
};

/**
 * Helper function to truncate text with ellipsis if too long
 * @param {jsPDF} doc - jsPDF instance
 * @param {string} text - Text to truncate
 * @param {number} maxWidth - Maximum width
 * @returns {string} Truncated text
 */
const truncateText = (doc, text, maxWidth) => {
    const textStr = String(text);
    let truncated = textStr;

    while (doc.getTextWidth(truncated) > maxWidth && truncated.length > 3) {
        truncated = truncated.slice(0, -1);
    }

    if (truncated.length < textStr.length) {
        truncated = truncated.slice(0, -3) + '...';
    }

    return truncated;
};

/**
 * Generates an invoice PDF with multiple components
 * Uses responsive column widths and auto-scaling text
 * @param {Array} invoiceData - Array of component invoice data
 * @param {Object} invoiceForm - Invoice configuration
 */
export const generateInvoicePdf = (invoiceData, invoiceForm) => {
    const doc = new jsPDF();
    let currentY = 20;
    const lineHeight = 5;
    const padding = 2;
    const tableWidth = 182;

    doc.setFont("DejaVuSans", "normal");
    doc.setLanguage("pl");

    // Title
    doc.setFontSize(22);
    doc.text(`FAKTURA NR: ${invoiceForm.invoiceNumber || 'FV/XXXX/YY'}`, 14, currentY);
    currentY += 12;

    doc.setFontSize(10);
    const columnX2 = doc.internal.pageSize.width / 2;

    // Seller and Buyer
    doc.text("Sprzedawca:", 14, currentY);
    const sellerLines = doc.splitTextToSize(invoiceForm.seller, 80);
    sellerLines.forEach((line, idx) => {
        doc.text(line, 14, currentY + lineHeight + (idx * lineHeight));
    });

    doc.text("Nabywca:", columnX2, currentY);
    const buyerLines = doc.splitTextToSize(invoiceForm.buyer, 80);
    buyerLines.forEach((line, idx) => {
        doc.text(line, columnX2, currentY + lineHeight + (idx * lineHeight));
    });

    currentY += Math.max(sellerLines.length, buyerLines.length) * lineHeight + 10;

    // Dates
    doc.text(`Data wystawienia: ${invoiceForm.issueDate}`, 14, currentY);
    currentY += lineHeight;
    doc.text(`Termin płatności: ${invoiceForm.paymentDue}`, 14, currentY);
    currentY += 2 * lineHeight;

    // ✅ RESPONSIVE TABLE WITH AUTO-SCALING TEXT
    doc.setFontSize(8);
    let rowY = currentY;

    // Column widths - adjusted for better responsiveness
    const colWidths = [10, 50, 20, 25, 15, 15, 25, 22];
    const headers = ['Lp.', 'Nazwa', 'ID Wew.', 'Cena Netto', 'Ilość',  'Wartość Netto', 'Wartość Brutto'];
    const headerHeight = 7;
    const rowHeight = 7;

    // Table header
    doc.setFillColor(52, 58, 64);
    doc.setTextColor(255, 255, 255);
    let colX = 14;

    headers.forEach((header, index) => {
        doc.rect(colX, rowY, colWidths[index], headerHeight, 'F');

        // Auto-scale header text
        const headerFontSize = getOptimalFontSize(doc, header, colWidths[index] - padding * 2, 8, 5);
        doc.setFontSize(headerFontSize);

        const truncatedHeader = truncateText(doc, header, colWidths[index] - padding * 2);
        doc.text(truncatedHeader, colX + padding, rowY + headerHeight - padding);

        colX += colWidths[index];
    });

    rowY += headerHeight;
    doc.setTextColor(0, 0, 0);

    // Table rows with responsive text
    invoiceData.forEach((item, index) => {
        colX = 14;

        // Zebra striping
        if (index % 2 !== 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(14, rowY, tableWidth, rowHeight, 'F');
        } else {
            doc.setFillColor(255, 255, 255);
            doc.rect(14, rowY, tableWidth, rowHeight, 'F');
        }

        const rowData = [
            index + 1,
            item.name,
            item.internalId,
            item.unitPrice.toFixed(2) + ' PLN',
            item.quantity,
            item.totalNet.toFixed(2) + ' PLN',
        ];

        rowData.forEach((data, colIndex) => {
            const align = [0, 1, 2].includes(colIndex) ? 'left' : 'right';
            const availableWidth = colWidths[colIndex] - padding * 2;

            // Draw cell border
            doc.rect(colX, rowY, colWidths[colIndex], rowHeight, 'D');

            // ✅ Auto-scale text to fit column
            const cellFontSize = getOptimalFontSize(doc, data, availableWidth, 8, 4);
            doc.setFontSize(cellFontSize);

            // Truncate if still too long
            const displayText = truncateText(doc, data, availableWidth);

            if (align === 'right') {
                doc.text(displayText, colX + colWidths[colIndex] - padding, rowY + rowHeight - padding, { align: 'right' });
            } else {
                doc.text(displayText, colX + padding, rowY + rowHeight - padding);
            }

            colX += colWidths[colIndex];
        });

        rowY += rowHeight;
    });

    currentY = rowY + 10;

    // Summary
    let totalNetValue = invoiceData.reduce((sum, item) => sum + item.totalNet, 0);


    doc.setFontSize(12);
    doc.text(`Suma Netto: ${totalNetValue.toFixed(2)} PLN`, 140, currentY);
    currentY += lineHeight;
    doc.setFontSize(14);
    currentY += 10;

    // Notes
    doc.setFontSize(10);
    const notesLines = doc.splitTextToSize(`Notatki: ${invoiceForm.notes}`, 180);
    notesLines.forEach((line, idx) => {
        doc.text(line, 14, currentY + (idx * lineHeight));
    });

    // Save
    const filename = `Faktura_${invoiceForm.invoiceNumber || 'FV'}_${invoiceForm.issueDate}.pdf`;
    doc.save(filename);
};