const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Inject isScrolled state
content = content.replace(/const \[showNotifications, setShowNotifications\] = useState\(false\);/, 
  "const [showNotifications, setShowNotifications] = useState(false);\n  const [isScrolled, setIsScrolled] = useState(false);\n  useEffect(() => {\n    const handleScroll = () => setIsScrolled(window.scrollY > 50);\n    window.addEventListener('scroll', handleScroll, { passive: true });\n    return () => window.removeEventListener('scroll', handleScroll);\n  }, []);");

// Update navbar style
content = content.replace(/<nav className="navbar">/, 
  '<nav className="navbar" style={{ background: isScrolled ? "rgba(9, 9, 11, 0.98)" : "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)", borderBottom: isScrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent" }}>');

fs.writeFileSync('frontend/src/App.jsx', content);
