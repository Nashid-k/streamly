const fs = require('fs');
const file = 'src/index.css';
let css = fs.readFileSync(file, 'utf8');

// 1. Ken Burns Effect
css = css.replace(
  /\.hero-bg {[\s\S]*?}/,
  `.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  animation: kenBurns 20s ease-in-out infinite alternate;
}
@keyframes kenBurns {
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
}`
);

// 2. Refined Top 10 Numbers
css = css + `
/* Typography & Utilities */
.text-stroke-premium {
  color: transparent;
  -webkit-text-stroke: 2px rgba(255,255,255,0.3);
  text-shadow: 0 10px 30px rgba(0,0,0,0.8);
  background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.5) 100%);
  -webkit-background-clip: text;
  background-clip: text;
}
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`;

// 3. Mobile Navigation Drawer
css = css.replace(
  /\.nav-links {[\s\S]*?z-index: 99;\n  }/,
  `.nav-links {
    display: flex !important;
    position: fixed;
    top: 0;
    right: -100%;
    width: 280px;
    height: 100vh;
    flex-direction: column;
    background: rgba(9, 9, 11, 0.98);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    padding: 5rem 1.5rem 2rem;
    gap: 1rem;
    z-index: 98;
    transition: right 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    box-shadow: -10px 0 40px rgba(0,0,0,0.8);
  }`
);

css = css.replace(
  /\.hamburger-btn {[\s\S]*?}/,
  `.hamburger-btn {
    display: flex !important;
    z-index: 100;
    position: relative;
  }`
);

// 4. Immersive Search on Mobile
css = css.replace(
  /\.search-wrapper > div {[\s\S]*?right: -20px !important;\n  }/,
  `.search-wrapper > div {
    position: fixed !important;
    top: 70px !important;
    left: 0 !important;
    width: 100vw !important;
    height: calc(100vh - 70px) !important;
    max-height: none !important;
    border-radius: 0 !important;
    border: none !important;
    background: rgba(9, 9, 11, 0.98) !important;
    backdrop-filter: blur(24px) !important;
  }`
);

fs.writeFileSync(file, css);
console.log('CSS patched');
