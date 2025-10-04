const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-maskable-192.png', maskable: true },
  { size: 512, name: 'icon-maskable-512.png', maskable: true }
];

async function generateIcons() {
  const sourceLogo = path.join(__dirname, '../public/images/Limn_Logo_Dark_Mode.png');
  const outputDir = path.join(__dirname, '../public/icons');

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('📁 Source logo:', sourceLogo);
  console.log('📁 Output directory:', outputDir);
  
  for (const config of sizes) {
    const outputPath = path.join(outputDir, config.name);
    
    try {
      if (config.maskable) {
        // Add padding for maskable icons (10% padding)
        const padding = Math.round(config.size * 0.1);
        await sharp(sourceLogo)
          .resize(config.size - (padding * 2), config.size - (padding * 2), {
            fit: 'contain',
            background: { r: 59, g: 130, b: 246, alpha: 0 }
          })
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: { r: 59, g: 130, b: 246, alpha: 1 }
          })
          .toFile(outputPath);
      } else {
        await sharp(sourceLogo)
          .resize(config.size, config.size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toFile(outputPath);
      }
      console.log(`✅ Generated ${config.name}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${config.name}:`, error.message);
    }
  }
  
  console.log('🎉 PWA icon generation complete!');
}

generateIcons().catch(console.error);
