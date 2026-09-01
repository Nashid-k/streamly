export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!type || !id) {
    return res.redirect('/');
  }

  try {
    // 1. Fetch data from TMDB (or our backend if it was public, but TMDB is easier for edge)
    // NOTE: In production, you would use process.env.TMDB_API_KEY
    const tmdbKey = process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
    const tmdbUrl = `https://api.themoviedb.org/3/${type === 'nflix' || type === 'nprime' ? 'tv' : 'movie'}/${id}?api_key=${tmdbKey}`;
    
    const response = await fetch(tmdbUrl);
    const data = await response.json();

    const title = data.name || data.title || 'Streamly';
    const overview = data.overview || 'Watch on Streamly';
    const image = data.backdrop_path 
      ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
      : 'https://streamly.com/default-og.jpg'; // fallback

    // 2. Return a perfectly formatted HTML string with OpenGraph tags injected
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          
          <!-- Primary Meta Tags -->
          <title>${title} | Streamly</title>
          <meta name="title" content="${title} | Streamly">
          <meta name="description" content="${overview}">

          <!-- Open Graph / Facebook -->
          <meta property="og:type" content="website">
          <meta property="og:url" content="https://streamly.com/movie/${type}/${id}">
          <meta property="og:title" content="${title} | Streamly">
          <meta property="og:description" content="${overview}">
          <meta property="og:image" content="${image}">

          <!-- Twitter -->
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:url" content="https://streamly.com/movie/${type}/${id}">
          <meta property="twitter:title" content="${title} | Streamly">
          <meta property="twitter:description" content="${overview}">
          <meta property="twitter:image" content="${image}">
          
          <!-- Redirect to the actual React SPA immediately -->
          <meta http-equiv="refresh" content="0; url=/movie/${type}/${id}" />
        </head>
        <body style="background: #000; color: #fff; font-family: sans-serif; text-align: center; padding-top: 20vh;">
          <h1>Redirecting to ${title}...</h1>
          <p>Please wait.</p>
          <script>window.location.href = "/movie/${type}/${id}";</script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (e) {
    res.redirect('/');
  }
}
