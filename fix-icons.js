const sharp = require('sharp');

async function processIcons() {
    const input = 'frontend/public/logo.png';
    const bgColor = '#FFFFFF';

    // 192x192: 144x144 logo + 24px padding = 192
    await sharp(input)
        .resize(144, 144, { fit: 'contain', background: bgColor })
        .extend({
            top: 24, bottom: 24, left: 24, right: 24,
            background: bgColor
        })
        .toFile('frontend/public/pwa-192x192.png');

    // 512x512: 384x384 logo + 64px padding = 512
    await sharp(input)
        .resize(384, 384, { fit: 'contain', background: bgColor })
        .extend({
            top: 64, bottom: 64, left: 64, right: 64,
            background: bgColor
        })
        .toFile('frontend/public/pwa-512x512.png');

    // Maskable 512x512
    await sharp(input)
        .resize(384, 384, { fit: 'contain', background: bgColor })
        .extend({
            top: 64, bottom: 64, left: 64, right: 64,
            background: bgColor
        })
        .toFile('frontend/public/maskable-icon-512x512.png');

    console.log('Icons processed successfully with padding.');
}

processIcons().catch(console.error);
