#!/usr/bin/env node
/**
 * Regenerate the header QR code to point at the new Instagram URL.
 *
 * The original was a heavily-styled code (rounded dots, rounded finders, centred
 * Instagram logo) encoding https://www.instagram.com/louis_rlee — which no longer
 * matches the new destination. We rebuild it with the same geometry and visual
 * style, at high error-correction so the logo overlay is tolerated.
 *
 * Geometry measured from the original image:
 *   canvas 478x439, QR block 392x392 at (43,29), module = 8px, version 8 (49 modules)
 */
const fs = require('fs');
const QRCode = require('qrcode');

const URL_TO_ENCODE = 'https://www.instagram.com/';
const VERSION = 8; // 49x49 modules  → 49*8 = 392px, exactly the original block size
const EC = 'H'; // logo covers ~4% of the symbol; H gives ~43 correctable codewords

const qr = QRCode.create(URL_TO_ENCODE, { version: VERSION, errorCorrectionLevel: EC });
const size = qr.modules.size;
const data = qr.modules.data;

if (size !== 49) throw new Error('expected 49 modules, got ' + size);

const matrix = [];
for (let r = 0; r < size; r++) {
  const row = [];
  for (let c = 0; c < size; c++) row.push(data[r * size + c] ? 1 : 0);
  matrix.push(row);
}

fs.mkdirSync('/home/user/tools', { recursive: true });
fs.writeFileSync('/home/user/tools/qr-matrix.json', JSON.stringify({ url: URL_TO_ENCODE, version: VERSION, ec: EC, size, matrix }));
console.log(`encoded "${URL_TO_ENCODE}" → version ${VERSION} (${size}x${size}), EC ${EC}`);
