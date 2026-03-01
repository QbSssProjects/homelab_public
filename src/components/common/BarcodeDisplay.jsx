import React, { useMemo } from 'react';
import { generateBarcodeSVG } from '../../utils/barcodeGenerator';

/**
 * Safe component for displaying barcodes using dangerouslySetInnerHTML
 * Generates CODE128 barcode from provided data
 * @param {string} data - Data to encode
 * @param {Object} style - CSS styles
 */
const BarcodeDisplay = ({ data, style }) => {
    const svgContent = useMemo(() => generateBarcodeSVG(data), [data]);

    if (!svgContent) return null;

    return (
        <div
            style={style}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="flex-shrink-0"
        />
    );
};

export default BarcodeDisplay;