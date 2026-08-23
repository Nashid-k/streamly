const https = require('https');
const http = require('http');

const SERVERS = [
  { name: 'Server 1 (vidlink.pro)', url: (id, s, e) => s ? `https://vidlink.pro/tv/${id}/${s}/${e}` : `https://vidlink.pro/movie/${id}` },
  { name: 'Server 2 (vidsrc.cc)', url: (id, s, e) => s ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` : `https://vidsrc.cc/v2/embed/movie/${id}` },
  { name: 'Server 3 (2embed.cc)', url: (id, s, e) => s ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` : `https://www.2embed.cc/embed/${id}` },
  { name: 'Server 4 (vidsrc.pro)', url: (id, s, e) => s ? `https://vidsrc.pro/embed/tv/${id}/${s}/${e}` : `https://vidsrc.pro/embed/movie/${id}` },
  { name: 'Server 5 (multiembed.mov)', url: (id, s, e) => s ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` }
];

const MOVIES = [27205, 157336, 569094, 872585, 155];
const SERIES = [1396, 1399, 66732, 76479, 76331];
const ANIME = [1429, 13916, 46260, 37854, 85937];

async function checkUrl(url) {
  try {
    const res = await fetch(url, { 
      method: 'GET', 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(6000) 
    });
    return res.status;
  } catch (e) {
    if (e.name === 'TimeoutError') return 'TIMEOUT';
    return 'ERROR';
  }
}

async function runTests() {
  console.log("Starting streaming server diagnostic...");
  const results = {};

  for (const server of SERVERS) {
    results[server.name] = { working: 0, failed: 0, details: [] };
    
    // Test Movies
    for (const id of MOVIES) {
      const url = server.url(id);
      const status = await checkUrl(url);
      if (status === 200 || status === 301 || status === 302 || status === 304) results[server.name].working++;
      else results[server.name].failed++;
      results[server.name].details.push(`Movie ${id}: ${status}`);
    }

    // Test Series
    for (const id of SERIES) {
      const url = server.url(id, 1, 1);
      const status = await checkUrl(url);
      if (status === 200 || status === 301 || status === 302 || status === 304) results[server.name].working++;
      else results[server.name].failed++;
      results[server.name].details.push(`Series ${id}: ${status}`);
    }
    
    // Test Anime
    for (const id of ANIME) {
      const url = server.url(id, 1, 1);
      const status = await checkUrl(url);
      if (status === 200 || status === 301 || status === 302 || status === 304) results[server.name].working++;
      else results[server.name].failed++;
      results[server.name].details.push(`Anime ${id}: ${status}`);
    }
    
    console.log(`\n=== ${server.name} ===`);
    console.log(`Working: ${results[server.name].working}/15`);
    console.log(`Failed: ${results[server.name].failed}/15`);
    console.log(`Sample details: ${results[server.name].details.slice(0, 3).join(', ')}...`);
  }
}

runTests();
