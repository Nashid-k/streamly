function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  // OG URLs must point at the real deployed origin, not a hardcoded domain.
  const origin = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : `https://${req.headers.host || 'streamly.com'}`;

  if (!type || !id) {
    return res.redirect('/');
  }

  try {
    // 1. Fetch data from TMDB (or our backend if it was public, but TMDB is easier for edge)
    // NOTE: In production, set TMDB_API_KEY as an env var on Vercel.
    const tmdbKey = process.env.TMDB_API_KEY;
    if (!tmdbKey) {
      // No key configured — never bake a placeholder into a request. Just redirect.
      return res.redirect(`/movie/${type}/${id}`);
    }
    const tmdbUrl = `https://api.themoviedb.org/3/${type === 'nflix' || type === 'nprime' ? 'tv' : 'movie'}/${id}?api_key=${tmdbKey}`;

    const response = await fetch(tmdbUrl);
    const data = await response.json();

    const path = `/movie/${type}/${id}`;
    const url = `${origin}${path}`;
    const title = escapeHtml(data.name || data.title || 'Streamly');
    const overview = escapeHtml(data.overview || 'Watch on Streamly');
    const image = data.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
      : `${origin}/default-og.jpg`; // fallback

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
          <meta property="og:url" content="${url}">
          <meta property="og:title" content="${title} | Streamly">
          <meta property="og:description" content="${overview}">
          <meta property="og:image" content="${image}">

          <!-- Twitter -->
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:url" content="${url}">
          <meta property="twitter:title" content="${title} | Streamly">
          <meta property="twitter:description" content="${overview}">
          <meta property="twitter:image" content="${image}">

          <!-- Redirect to the actual React SPA immediately -->
          <meta http-equiv="refresh" content="0; url=${path}" />
        </head>
        <body style="background: #000; color: #fff; font-family: sans-serif; text-align: center; padding-top: 20vh;">
          <h1>Redirecting to ${title}...</h1>
          <p>Please wait.</p>
          <script>window.location.href = ${JSON.stringify(path)};</script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch {
    res.redirect('/');
  }
}