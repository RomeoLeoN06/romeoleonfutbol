import fs from 'fs';
import pngToIco from 'png-to-ico';

pngToIco('src/assets/romeoleonfutbol.png')
  .then(buf => {
    fs.writeFileSync('src/assets/icon.ico', buf);
    console.log('Icon created successfully');
  })
  .catch(err => {
    console.error('Error creating icon:', err);
  });
