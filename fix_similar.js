const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/MovieDetails.jsx', 'utf8');

const scrollBlock = `  const [visibleCount, setVisibleCount] = useState(12);
  useEffect(() => {
    let inThrottle;
    const handleScroll = () => {
      if (!inThrottle) {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
          setVisibleCount(prev => Math.min(prev + 12, similar ? similar.length : 0));
        }
        inThrottle = true;
        setTimeout(() => inThrottle = false, 200);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [similar]);`;

// Remove the block
content = content.replace(scrollBlock, '');

// Insert it after `const similar = ...;`
content = content.replace(/const similar = Array\.isArray\(similarData\) \? similarData : \[\];/, 
  "const similar = Array.isArray(similarData) ? similarData : [];\n\n" + scrollBlock);

fs.writeFileSync('frontend/src/pages/MovieDetails.jsx', content);
