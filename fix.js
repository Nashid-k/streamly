const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/HistoryPage.jsx', 'utf8');
content = content.replace(/transition=\{\{ duration: 0.4, delay: \(idx % 20\) \* 0\.05, ease: "easeOut" \}\}>\n                  transition=\{\{ type: 'spring', stiffness: 300, damping: 25, delay: idx \* 0\.03 \}\}\n                  style=\{\{ position: 'relative' \}\}\n                >/, 
`transition={{ duration: 0.4, delay: (idx % 20) * 0.05, ease: "easeOut" }}
                  style={{ position: 'relative' }}
                >`);
fs.writeFileSync('frontend/src/pages/HistoryPage.jsx', content);
