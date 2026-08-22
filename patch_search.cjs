const fs = require('fs');
const file = 'src/App.jsx';
let jsx = fs.readFileSync(file, 'utf8');

// The issue asks to fix notification feature and hide search in mobile nav, use it properly.
// The notification feature issue: ServerWakeupNotification visible state is buggy due to requestAnimationFrame.
// Also, maybe the red dot on the bell doesn't go away. Let's fix that.

// 1. Fix red dot on bell
jsx = jsx.replace(
  /<div style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}><\/div>/,
  `{!hasOpenedNotifications && <div style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></div>}`
);
jsx = jsx.replace(
  /const \[showNotifications, setShowNotifications\] = useState\(false\);/,
  `const [showNotifications, setShowNotifications] = useState(false);\n  const [hasOpenedNotifications, setHasOpenedNotifications] = useState(false);`
);
jsx = jsx.replace(
  /onClick={\(\) => setShowNotifications\(!showNotifications\)}/,
  `onClick={() => { setShowNotifications(!showNotifications); setHasOpenedNotifications(true); }}`
);

// 2. Hide search in mobile nav and move it to hamburger menu
// First, we can just render the search wrapper twice, one for desktop (nav-right), one for mobile (nav-links).
// Actually, extracting to a component is hard with string replace.
// Let's use CSS to hide the desktop search-wrapper, and inject a mobile-only search input inside nav-links.
// Wait, if we just use CSS to position the existing search-wrapper into the hamburger menu on mobile?
// YES! We can just apply CSS to .search-wrapper on mobile.

fs.writeFileSync(file, jsx);
console.log('App.jsx patched');
