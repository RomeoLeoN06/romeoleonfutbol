import fs from 'fs';
import { Jimp } from 'jimp';

async function run() {
    console.log('Loading image...');
    const image = await Jimp.read('src/assets/romeoleonfutbol.png');
    
    let html = fs.readFileSync('index.html', 'utf8');
    // Remove all existing favicons
    html = html.replace(/<link rel="icon" [^>]+>\n?/g, '');
    
    const sizes = [16, 32, 48, 64, 128, 256, 512];
    let links = '';
    
    for (let size of sizes) {
        console.log('Resizing to ' + size);
        const clone = image.clone().resize({ w: size, h: size });
        const buffer = await clone.getBuffer('image/png');
        const b64 = buffer.toString('base64');
        links += `<link rel="icon" type="image/png" sizes="${size}x${size}" href="data:image/png;base64,${b64}" />\n`;
    }
    
    // Insert back to head
    html = html.replace('</head>', links + '</head>');
    
    fs.writeFileSync('index.html', html);
    console.log('Favicons embedded perfectly!');
}

run();
