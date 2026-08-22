const fs = require('fs');
const file = 'src/App.jsx';
let jsx = fs.readFileSync(file, 'utf8');

// Extract the search wrapper part
const searchWrapperRegex = /<div ref={searchRef} className="search-wrapper" style={{ position: 'relative' }}>([\s\S]*?)<\/AnimatePresence>\s*<\/div>/;
const match = jsx.match(searchWrapperRegex);
if (match) {
  const searchContent = match[0];
  
  // Replace the original with a desktop-only class
  jsx = jsx.replace(searchWrapperRegex, searchContent.replace('className="search-wrapper"', 'className="search-wrapper desktop-only"'));
  
  // Inject into nav-links for mobile
  const navLinksRegex = /<div className={`nav-links \${mobileMenuOpen \? 'nav-links-open' : ''}`}>/;
  jsx = jsx.replace(navLinksRegex, `<div className={\`nav-links \${mobileMenuOpen ? 'nav-links-open' : ''}\`}>\n            <div className="mobile-only" style={{ marginBottom: '1rem' }}>\n              ${searchContent.replace('className="search-wrapper"', 'className="search-wrapper mobile-search"')}\n            </div>`);
  
  fs.writeFileSync(file, jsx);
  console.log('App.jsx search patched');
} else {
  console.log('Regex failed to match search wrapper');
}
