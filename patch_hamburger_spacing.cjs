const fs = require('fs');
const file = 'src/App.jsx';
let jsx = fs.readFileSync(file, 'utf8');

// I will add marginLeft: '0.5rem' to the hamburger button
jsx = jsx.replace(
  /style={{ display: 'none', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}/,
  `style={{ display: 'none', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', marginLeft: '0.5rem' }}`
);

fs.writeFileSync(file, jsx);
console.log('App.jsx hamburger spacing fixed');
