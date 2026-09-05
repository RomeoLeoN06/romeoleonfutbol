const pngToIco = require('png-to-ico');
const fs = require('fs');

pngToIco('public/romeoleonfutbol.png')
  .then(buf => {
    fs.writeFileSync('public/icon.ico', buf);
    console.log('Icon created successfully');
  })
  .catch(err => {
    console.error('Error creating icon:', err);
  });
