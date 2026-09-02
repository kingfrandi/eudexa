function clean(value, max = 100) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const url = new URL(req.url, 'https://' + (req.headers.host || 'localhost'));
    const id = clean(url.searchParams.get('id'));
    const period = url.searchParams.get('period') || '30D';
    if (!id || !/^[a-z0-9-]+$/i.test(id)) return res.status(400).json({ error: 'Invalid crypto id' });
    const days = period === '1Y' ? 365 : period === '90D' ? 90 : 30;
    const endpoint = 'https://api.coingecko.com/api/v3/coins/' + encodeURIComponent(id) + '/market_chart?vs_currency=usd&days=' + days;
    const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('CoinGecko unavailable');
    const data = await response.json();
    const points = Array.isArray(data.prices) ? data.prices.map(p => [Number(p[0]), Number(p[1])]).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1])) : [];
    if (!points.length) throw new Error('No historical data');
    const first = points[0][1];
    const last = points[points.length - 1][1];
    return res.status(200).json({ id, points, price: last, change: first ? ((last - first) / first) * 100 : 0, updated: points[points.length - 1][0], source: 'CoinGecko' });
  } catch (error) {
    return res.status(502).json({ error: 'Crypto historical data unavailable' });
  }
};
