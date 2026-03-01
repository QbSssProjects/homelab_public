import JsBarcode from 'jsbarcode';

/**
 * Generates a CODE128 barcode as SVG string
 * Sanitizes input by removing Polish diacritics and special characters
 * @param {string} data - Data to encode in barcode
 * @returns {string} SVG markup or empty string on error
 */
export const generateBarcodeSVG = (data) => {
    if (!data) return '';

    // 1. Sanitize data: remove Polish diacritics and special characters
    let sanitizedData = data
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .toUpperCase();

    // 2. Truncate to max 25 characters for readability
    const finalData = sanitizedData.substring(0, 25);

    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    try {
        JsBarcode(svgElement, finalData, {
            format: "CODE128",
            displayValue: false,
            width: 1.2,
            height: 35,
            margin: 0
        });
    } catch (error) {
        console.error("Barcode generation error:", data, "Sanitized:", finalData, error);
        return '';
    }

    return svgElement.outerHTML;
};