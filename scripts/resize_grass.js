import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS = path.join(__dirname, '../public/assets');

// Tileset spec: 160x128px (10 columns x 8 rows of 16x16 tiles = 80 tiles)
const TARGET_WIDTH = 160;
const TARGET_HEIGHT = 128;

async function resizeGrassTiles() {
    console.log('Resizing grass tilesets to 160×128px...\n');
    
    // Resize grass_01.png (currently 72×72)
    await sharp(path.join(ASSETS, 'grass_01.png'))
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
            fit: 'fill',
            kernel: 'nearest' // Use nearest-neighbor for pixel art
        })
        .png()
        .toFile(path.join(ASSETS, 'grass_01_resized.png'));
    console.log('✓ grass_01.png → grass_01_resized.png (160×128)');
    
    // Resize grass_02.png (currently 512×88)
    await sharp(path.join(ASSETS, 'grass_02.png'))
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
            fit: 'fill',
            kernel: 'nearest' // Use nearest-neighbor for pixel art
        })
        .png()
        .toFile(path.join(ASSETS, 'grass_02_resized.png'));
    console.log('✓ grass_02.png → grass_02_resized.png (160×128)');
    
    console.log('\nDone! Review the resized images, then:');
    console.log('  mv public/assets/grass_01_resized.png public/assets/grass_01.png');
    console.log('  mv public/assets/grass_02_resized.png public/assets/grass_02.png');
}

resizeGrassTiles().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
