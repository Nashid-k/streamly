const fs = require('fs');
const file = 'src/App.jsx';
let jsx = fs.readFileSync(file, 'utf8');

jsx = jsx.replace(
  /<div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid rgba\(255,255,255,0\.05\)', cursor: 'pointer' }} onMouseEnter={\(e\) => e.currentTarget.style.background = 'rgba\(255,255,255,0\.05\)'} onMouseLeave={\(e\) => e.currentTarget.style.background = 'transparent'}>/g,
  `<div onClick={() => setShowNotifications(false)} style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>`
);

jsx = jsx.replace(
  /<div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }} onMouseEnter={\(e\) => e.currentTarget.style.background = 'rgba\(255,255,255,0\.05\)'} onMouseLeave={\(e\) => e.currentTarget.style.background = 'transparent'}>/g,
  `<div onClick={() => setShowNotifications(false)} style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>`
);

fs.writeFileSync(file, jsx);
console.log('App.jsx notif patched');
