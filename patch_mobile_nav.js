const fs = require('fs');

// Patch App.jsx
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Ensure Home is imported from lucide-react
app = app.replace(/import \{ Search, Bell, User, Menu, X, Bookmark, Clock \} from 'lucide-react';/, 
  "import { Search, Bell, User, Menu, X, Bookmark, Clock, Home } from 'lucide-react';");

const mobileNavHtml = `
      {/* Mobile Bottom Navigation Bar (Surpassing authentic platforms with persistent UX) */}
      <div className="mobile-bottom-nav">
        <Link to="/" className={\`bottom-nav-item \${location.pathname === '/' ? 'active' : ''}\`}>
          <Home size={22} />
          <span>Home</span>
        </Link>
        <Link to="/search" className={\`bottom-nav-item \${location.pathname === '/search' ? 'active' : ''}\`}>
          <Search size={22} />
          <span>Search</span>
        </Link>
        <Link to="/history" className={\`bottom-nav-item \${location.pathname === '/history' ? 'active' : ''}\`}>
          <Clock size={22} />
          <span>History</span>
        </Link>
        <Link to="/mylist" className={\`bottom-nav-item \${location.pathname === '/mylist' ? 'active' : ''}\`}>
          <Bookmark size={22} />
          <span>My List</span>
        </Link>
      </div>
    </div>
  );
}`;

app = app.replace(/    <\/div>\n  \);\n\}/, mobileNavHtml);
fs.writeFileSync('frontend/src/App.jsx', app);

// Patch index.css
let css = fs.readFileSync('frontend/src/index.css', 'utf8');
const mobileCss = `
.mobile-bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .nav-left .nav-item, .search-container {
    display: none;
  }
  
  /* Surpass authentic platforms with a beautiful persistent bottom bar */
  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 75px;
    background: rgba(9, 9, 11, 0.98);
    border-top: 1px solid rgba(255,255,255,0.06);
    z-index: 999;
    justify-content: space-around;
    align-items: center;
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
  }
  
  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: #a1a1aa;
    text-decoration: none;
    font-size: 0.65rem;
    font-weight: 700;
    width: 60px;
    transition: all 0.2s ease;
  }
  
  .bottom-nav-item.active {
    color: #fff;
    transform: translateY(-2px);
  }
  
  .bottom-nav-item.active svg {
    color: #e50914; /* Authentic accent color */
    filter: drop-shadow(0 0 8px rgba(229, 9, 20, 0.5));
  }
  
  .hamburger-btn, .mobile-menu {
    display: none !important;
  }
  
  .main-content {
    padding-bottom: 80px;
  }
  
  .navbar {
    padding: 1rem;
  }
}`;

// Replace the old mobile menu CSS block
css = css.replace(/@media \(max-width: 768px\) \{[\s\S]*?\.user-avatar \+ div \{[\s\S]*?\}\n\}/, mobileCss);

fs.writeFileSync('frontend/src/index.css', css);
