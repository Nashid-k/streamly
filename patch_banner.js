const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Home.jsx', 'utf8');

const bannerLogic = `  const { activeFeaturedMovie, totalFeatured } = useMemo(() => {
    let globalPool = [];
    let regionalPool = [];
    let recommendedPool = [];
    
    // 1. Gather Global Featured
    if (featuredMovies.length > 0) {
      featuredMovies.forEach(fm => {
        if (filter === 'series' && fm.isSeries) globalPool.push(fm);
        else if (filter === 'movies' && !fm.isSeries) globalPool.push(fm);
        else if (filter === 'anime' && fm.genres?.includes('Animation')) globalPool.push(fm);
        else if (filter === 'all' || filter === 'new' || filter === 'mylist') globalPool.push(fm);
      });
    }
    
    // 2. Gather Regional & Recommended from Categories
    if (categories.length > 0) {
      const allCategoryMovies = [];
      categories.forEach(c => {
        c.movies.forEach(m => {
          if (m.backdropUrl && !allCategoryMovies.find(p => p.id === m.id)) {
            allCategoryMovies.push(m);
          }
        });
      });
      
      // Filter for the current tab (Movies vs Series vs Anime)
      let tabFilteredMovies = allCategoryMovies;
      if (filter === 'series') tabFilteredMovies = tabFilteredMovies.filter(m => m.isSeries);
      if (filter === 'movies') tabFilteredMovies = tabFilteredMovies.filter(m => !m.isSeries);
      if (filter === 'anime') tabFilteredMovies = tabFilteredMovies.filter(m => m.genres?.includes('Animation'));
      
      // Extract Regional Content (Tamil, Malayalam, Hindi, Telugu, etc.)
      regionalPool = tabFilteredMovies.filter(m => 
        m.audioLanguages?.some(l => l.match(/Tamil|Malayalam|Hindi|Telugu/i)) ||
        m.languages?.some(l => l.match(/Tamil|Malayalam|Hindi|Telugu/i)) ||
        m.title.match(/Tamil|Malayalam|Hindi|Telugu/i)
      );
      
      // Extract Recommended Content based on User History
      const lastWatchedGenres = lastWatched?.genres || [];
      recommendedPool = tabFilteredMovies.filter(m => 
        m.genres?.some(g => lastWatchedGenres.includes(g)) && m.imdbRating >= 7.5
      );
      
      // Fallback for empty regional
      if (regionalPool.length === 0) {
          regionalPool = tabFilteredMovies.filter(m => m.genres?.includes('Drama') && m.imdbRating >= 8.0);
      }
    }
    
    // 3. The "Surpass Authentic" Mixing Algorithm
    // Authentic platforms only show sponsored/global blockbusters. 
    // We intentionally force a balanced rotation: 
    // Global -> Regional -> User Recommended -> Global -> Regional...
    const finalPool = [];
    const usedIds = new Set();
    
    const pushToPool = (movie) => {
      if (movie && !usedIds.has(movie.id)) {
        finalPool.push(movie);
        usedIds.add(movie.id);
      }
    };
    
    // We want 10 slots. We will round-robin between the pools.
    let gIdx = 0, rIdx = 0, recIdx = 0;
    while(finalPool.length < 10 && (gIdx < globalPool.length || rIdx < regionalPool.length || recIdx < recommendedPool.length)) {
      // Prioritize items with logoUrl for the premium banner look, but fallback to title if needed
      const getNext = (pool, idx) => {
          // try to find one with logoUrl first
          for(let i = idx; i < pool.length; i++) {
              if (pool[i].logoUrl && !usedIds.has(pool[i].id)) return pool[i];
          }
          // fallback to without logo
          for(let i = idx; i < pool.length; i++) {
              if (!usedIds.has(pool[i].id)) return pool[i];
          }
          return null;
      };
      
      pushToPool(getNext(globalPool, gIdx++));
      pushToPool(getNext(regionalPool, rIdx++));
      pushToPool(getNext(recommendedPool, recIdx++));
    }
    
    // Fallback if somehow still empty (e.g. no data loaded at all)
    if (finalPool.length === 0) return { activeFeaturedMovie: null, totalFeatured: 0 };
    
    return { activeFeaturedMovie: finalPool[featuredIndex % finalPool.length], totalFeatured: finalPool.length };
  }, [featuredMovies, categories, featuredIndex, filter, lastWatched]);`;

content = content.replace(/  const \{ activeFeaturedMovie, totalFeatured \} = useMemo\(\(\) => \{[\s\S]*?\}, \[featuredMovies, categories, featuredIndex, filter\]\);/, bannerLogic);

fs.writeFileSync('frontend/src/pages/Home.jsx', content);
