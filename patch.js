const fs = require('fs');
const file = '/home/edure/Desktop/Streamly/frontend/src/components/CustomVideoPlayer.jsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const newLogic = `  const [streamUrl, setStreamUrl] = useState(null);
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

// Replace lines 29 to 39 (0-indexed 29 is line 30, up to line 40)
lines.splice(29, 11, newLogic);

fs.writeFileSync(file, lines.join('\n'));
