const fs = require('fs');
const file = '/home/edure/Desktop/Streamly/frontend/src/components/CustomVideoPlayer.jsx';
let code = fs.readFileSync(file, 'utf8');

const regexToReplace = /const \[streamUrl, setStreamUrl\] = useState\(null\);\s*const \[loading, setLoading\] = useState\(index === 4\); \/\/ Only show loading state initially if Netmirror \(we will try backend\)\s*const \[error, setError\] = useState\(false\);\s*\/\/ If we select Netmirror \(index 4\), try the custom backend player first\.\s*useEffect\(\(\) => \{\s*let mounted = true;\s*if \(index === 4\) \{/m;

const newLogic = `const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(index === 4);
  const [error, setError] = useState(false);
  const [resolvedImdbId, setResolvedImdbId] = useState(movie.imdbId || movie.imdb_id || null);

  useEffect(() => {
    let mounted = true;
    
    // Auto-fetch IMDB ID for Netmirror if missing
    if (index === 4 && !resolvedImdbId) {
       const type = movie.isSeries ? 'shows' : 'movies';
       const tmdbId = getNumericId(movie.id);
       axios.get(\`https://api.kinocheck.de/\${type}?tmdb_id=\${tmdbId}\`)
         .then(res => {
            if (mounted && res.data && res.data.imdb_id) {
               setResolvedImdbId(res.data.imdb_id);
            }
         }).catch(err => console.error("Failed to fetch imdb fallback:", err));
    }

    if (index === 4) {`;

code = code.replace(regexToReplace, newLogic);
fs.writeFileSync(file, code);
