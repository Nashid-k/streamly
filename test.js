const https = require('https');
https.get('https://api.themoviedb.org/3/tv/295389?api_key=522f1f08eda5e03bf93100ba29471d5d', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.parse(data).seasons.map(s=>({sn: s.season_number, ep: s.episode_count}))));
});
