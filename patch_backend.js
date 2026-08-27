const fs = require('fs');
const file = '/home/edure/Desktop/Streamly/backend/src/movies/adapters/netmirror.adapter.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/index = 0;/g, 'index = 5;');
fs.writeFileSync(file, code);
