const ALLOWED_TOPICS = new Set(['financial_markets', 'economy_fiscal', 'economy_monetary', 'blockchain', 'earnings', 'ipo', 'mergers_acquisitions', 'technology', 'finance']);

function clean(value, max = 300) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function mapFeed(feed) {
  const items = Array.isArray(feed?.feed) ? feed.feed : [];
  const seen = new Set();
  return items.map(item => ({
    title: clean(item.title, 180),
    summary: clean(item.summary || item.overview, 360),
    source: clean(item.source || item.authors?.[0] || 'Alpha Vantage', 80),
    time: item.time_published || new Date().toISOString(),
    url: safeUrl(item.url),
    image: safeUrl(item.banner_image)
  })).filter(item => {
    if (!item.title || !item.url || seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    return res.status(200).json({
      source: 'unavailable',
      warning: 'La API de noticias no está configurada todavía.',
      updated: new Date().toISOString(),
      articles: []
    });
  }

  try {
    const params = new URLSearchParams({ function: 'NEWS_SENTIMENT', apikey: key, limit: '20' });
    const topic = clean(req.query?.topic, 60);
    if (topic && ALLOWED_TOPICS.has(topic)) params.set('topics', topic);
    const ticker = clean(req.query?.ticker, 30);
    if (ticker) params.set('tickers', ticker);

    const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`);
    if (!response.ok) throw new Error(`Alpha Vantage HTTP ${response.status}`);
    const data = await response.json();

    if (data.Information || data.Note || data['Error Message']) {
      return res.status(200).json({
        source: 'unavailable',
        warning: clean(data.Information || data.Note || data['Error Message'], 240),
        updated: new Date().toISOString(),
        articles: []
      });
    }

    const articles = mapFeed(data).slice(0, 12);
    return res.status(200).json({
      source: 'alpha-vantage',
      updated: new Date().toISOString(),
      articles
    });
  } catch (error) {
    return res.status(200).json({
      source: 'unavailable',
      warning: 'No fue posible consultar la fuente de noticias en este momento.',
      updated: new Date().toISOString(),
      articles: []
    });
  }
}
