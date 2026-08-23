const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/HistoryPage.jsx', 'utf8');
content = content.replace(/<motion\.div\s*key=\{movie\.id\}\s*layout\s*initial=\{\{[\s\S]*?\}\s*animate=\{\{[\s\S]*?\}\s*exit=\{\{[\s\S]*?\}/, 
`<motion.div 
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (idx % 20) * 0.05, ease: "easeOut" }}`);
fs.writeFileSync('frontend/src/pages/HistoryPage.jsx', content);
