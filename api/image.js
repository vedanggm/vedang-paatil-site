module.exports = (req, res) => {
  try {
    let url = req.query && req.query.url;
    if (!url) {
      const parsed = new URL(req.url, 'http://localhost');
      url = parsed.searchParams.get('url');
    }
    if (!url) {
      res.statusCode = 400;
      return res.end('Missing url parameter');
    }

    const targetUrl = decodeURIComponent(url);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    if (typeof res.redirect === 'function') {
      return res.redirect(307, targetUrl);
    }
    res.statusCode = 307;
    res.setHeader('Location', targetUrl);
    return res.end();
  } catch (err) {
    res.statusCode = 500;
    return res.end('Internal Server Error');
  }
};
