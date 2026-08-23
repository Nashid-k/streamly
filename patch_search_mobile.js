const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/SearchPage.jsx', 'utf8');

const searchInputHtml = `      {/* Mobile-only prominent search bar */}
      <div className="mobile-search-bar" style={{ display: 'none', marginBottom: '1.5rem', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
        <input 
          type="text" 
          placeholder="Search movies, series, actors..."
          defaultValue={query}
          onChange={(e) => {
            const newParams = new URLSearchParams(searchParams);
            if (e.target.value) newParams.set('q', e.target.value);
            else newParams.delete('q');
            window.history.replaceState({}, '', \`\${window.location.pathname}?\${newParams}\`);
            // Trigger a re-render or let react router handle it? 
            // Better to use useSearchParams setter!
          }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 48px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none' }}
        />
      </div>`;

// Wait, I should use setsearchParams from useSearchParams
content = content.replace(/const \[searchParams\] = useSearchParams\(\);/, 'const [searchParams, setSearchParams] = useSearchParams();');

const properInputHtml = `      {/* Mobile-only prominent search bar */}
      <div className="mobile-search-bar" style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
        <input 
          type="text" 
          placeholder="Search movies, series, actors..."
          value={query}
          onChange={(e) => {
            const newQ = e.target.value;
            if (newQ) setSearchParams({ q: newQ });
            else setSearchParams({});
          }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 48px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none' }}
        />
      </div>
      
      <div className="section-header">`;

content = content.replace(/<div className="section-header">/, properInputHtml);

// Change the "Type something" text
content = content.replace(/>Type something in the search bar above\.</, '>Search for a movie, series, or actor to get started.</');

fs.writeFileSync('frontend/src/pages/SearchPage.jsx', content);

// Add CSS to hide mobile-search-bar on desktop
let css = fs.readFileSync('frontend/src/index.css', 'utf8');
css += `\n
@media (min-width: 769px) {
  .mobile-search-bar {
    display: none !important;
  }
}
`;
fs.writeFileSync('frontend/src/index.css', css);
