const fs = require('fs');
const file = 'src/App.jsx';
let jsx = fs.readFileSync(file, 'utf8');

// Regex to extract the hamburger button block
const hamburgerRegex = /\s*\{\/\* Hamburger button for mobile \*\/\}\s*<button\s*className="hamburger-btn"[\s\S]*?<\/button>/;

const match = jsx.match(hamburgerRegex);
if (match) {
  const hamburgerCode = match[0];
  
  // Remove it from nav-left
  jsx = jsx.replace(hamburgerRegex, '');
  
  // Insert it at the end of nav-right
  // nav-right ends before `</nav>`
  // Let's find `</nav>`
  jsx = jsx.replace(
    /\s*<\/div>\s*<\/nav>/,
    `${hamburgerCode}\n        </div>\n      </nav>`
  );
  
  fs.writeFileSync(file, jsx);
  console.log('App.jsx hamburger moved');
} else {
  console.log('Regex failed to match hamburger button');
}
