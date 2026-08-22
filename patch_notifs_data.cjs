const fs = require('fs');
const file = 'src/App.jsx';
let jsx = fs.readFileSync(file, 'utf8');

// Add import
jsx = jsx.replace(
  /import \{ AnimatePresence, motion \} from 'framer-motion';/,
  `import { AnimatePresence, motion } from 'framer-motion';\nimport { useMyList, useContinueWatching } from './hooks/useUserData';`
);

// Add hooks in Layout component
jsx = jsx.replace(
  /const \[hasOpenedNotifications, setHasOpenedNotifications\] = useState\(false\);/,
  `const [hasOpenedNotifications, setHasOpenedNotifications] = useState(false);\n  const { myList } = useMyList();\n  const { continueWatching } = useContinueWatching();\n  const [notifications, setNotifications] = useState([]);\n\n  useEffect(() => {\n    const notifs = [];\n    if (continueWatching && continueWatching.length > 0) {\n      notifs.push({\n        id: 'cw',\n        title: \`Pick up where you left off on \${continueWatching[0].title}\`,\n        time: 'Just now',\n        link: \`/movie/\${continueWatching[0].source || 'nflix'}/\${continueWatching[0].id}\`\n      });\n    }\n    if (myList && myList.length > 0) {\n      notifs.push({\n        id: 'ml',\n        title: \`\${myList[myList.length - 1].title} is waiting in your watchlist\`,\n        time: 'Recently added',\n        link: \`/movie/\${myList[myList.length - 1].source || 'nflix'}/\${myList[myList.length - 1].id}\`\n      });\n    }\n    if (notifs.length === 0) {\n      notifs.push({\n        id: 'welcome',\n        title: 'Welcome to Streamly! Start exploring personalized content.',\n        time: 'Just now',\n        link: '/'\n      });\n    }\n    setNotifications(notifs);\n  }, [myList, continueWatching]);`
);

// Replace the hardcoded dropdown items
const dropdownRegex = /<div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.95rem', borderBottom: '1px solid rgba\(255,255,255,0.08\)', marginBottom: '4px', color: '#fff' }}>Notifications<\/div>([\s\S]*?)<\/motion.div>/;

const newDropdown = `<div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px', color: '#fff' }}>Notifications</div>
                  {notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => { setShowNotifications(false); navigate(n.link); }} 
                      style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} 
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} 
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: '0.9rem', color: '#e4e4e7' }}>{n.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{n.time}</div>
                    </div>
                  ))}
                </motion.div>`;

jsx = jsx.replace(dropdownRegex, newDropdown);

fs.writeFileSync(file, jsx);
console.log('App.jsx notifs data patched');
