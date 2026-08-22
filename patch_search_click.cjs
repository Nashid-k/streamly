const fs = require('fs');
const file = 'src/App.jsx';
let jsx = fs.readFileSync(file, 'utf8');

jsx = jsx.replace(
  /onClick=\{\(\) => \{\s*navigate\(\`\/movie\/\$\{r\.source\}\/\$\{r\.id\}\`\);\s*setQuery\(''\);\s*setShowDropdown\(false\);\s*\}\}/g,
  `onClick={() => {
                             navigate(\`/movie/\${r.source}/\${r.id}\`);
                             setQuery('');
                             setShowDropdown(false);
                             setMobileMenuOpen(false);
                           }}`
);

jsx = jsx.replace(
  /onClick=\{\(\) => \{\s*navigate\(\`\/search\?q=\$\{encodeURIComponent\(query\)\}\`\);\s*setQuery\(''\);\s*setShowDropdown\(false\);\s*\}\}/g,
  `onClick={() => {
                           navigate(\`/search?q=\${encodeURIComponent(query)}\`);
                           setQuery('');
                           setShowDropdown(false);
                           setMobileMenuOpen(false);
                         }}`
);

// Also the "X" button in search input
jsx = jsx.replace(
  /onClick=\{\(\) => \{setQuery\(''\); setShowDropdown\(false\)\}\}/g,
  `onClick={() => {setQuery(''); setShowDropdown(false);}}`
);

fs.writeFileSync(file, jsx);
console.log('App.jsx search click fixed');
