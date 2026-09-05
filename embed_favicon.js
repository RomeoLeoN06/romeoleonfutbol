import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

// We will inject the high quality PNG link
html = html.replace(/<link rel="icon" [^>]+>/g, '<link rel="icon" type="image/png" sizes="1024x1024" href="RomeoLeoNFutbol_icon.png" />');

fs.writeFileSync('index.html', html);
console.log('Favicon replaced with high-quality PNG!');
