const ALLOWED_TOPICS = new Set(['financial_markets', 'economy_fiscal', 'economy_monetary', 'blockchain', 'earnings', 'ipo', 'mergers_acquisitions', 'technology', 'finance']);

const NEWS_SEARCHES = {
  markets: 'https://news.google.com/search?q=global%20financial%20markets&hl=es-419&gl=US&ceid=US%3Aes-419',
  crypto: 'https://news.google.com/search?q=Bitcoin%20crypto%20markets&hl=es-419&gl=US&ceid=US%3Aes-419',
  forex: 'https://news.google.com/search?q=forex%20currencies%20monetary%20policy&hl=es-419&gl=US&ceid=US%3Aes-419',
  stocks: 'https://news.google.com/search?q=stocks%20earnings%20companies&hl=es-419&gl=US&ceid=US%3Aes-419',
  commodities: 'https://news.google.com/search?q=oil%20gold%20commodities%20markets&hl=es-419&gl=US&ceid=US%3Aes-419'
};

const DEMO_NEWS = [
  { title: 'Los mercados globales siguen atentos a los principales indicadores económicos', summary: 'Panorama educativo de los factores que pueden influir en acciones, divisas y otros mercados financieros.', source: 'Noticias de mercados', time: new Date().toISOString(), url: NEWS_SEARCHES.markets },
  { title: 'Bitcoin y el mercado cripto mantienen la atención de los inversores', summary: 'Resumen neutral sobre la evolución reciente del ecosistema de activos digitales y sus principales temas.', source: 'Noticias cripto', time: new Date(Date.now() - 3600000).toISOString(), url: NEWS_SEARCHES.crypto },
  { title: 'Las divisas reaccionan a las expectativas de política monetaria', summary: 'Las expectativas sobre tipos de interés suelen influir en los mercados de divisas y en el valor relativo de las monedas.', source: 'Noticias de divisas', time: new Date(Date.now() - 7200000).toISOString(), url: NEWS_SEARCHES.forex },
  { title: 'Acciones y resultados empresariales marcan la agenda de los mercados', summary: 'Los resultados corporativos son uno de los elementos que el mercado utiliza para evaluar la evolución de las compañías.', source: 'Noticias de bolsa', time: new Date(Date.now() - 10800000).toISOString(), url: NEWS_SEARCHES.stocks },
  { title: 'Materias primas: petróleo y metales siguen bajo seguimiento', summary: 'Oferta, demanda, actividad económica y geopolítica son algunos de los factores que pueden mover las materias primas.', source: 'Noticias de materias primas', time: new Date(Date.now() - 14400000).toISOString(), url: NEWS_SEARCHES.commodities }
];

function clean(value, max = 300) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function mapFeed(feed) {
  const items = Array.isArray(feed?.feed) ? feed.feed : [];
  const seen = new Set();
  return items.map(item => ({
    title: clean(item.title, 180),
    summary: clean(item.summary || item.overview, 360),
    source: clean(item.source || item.authors?.[0] || 'Alpha Vantage', 80),
    time: item.time_published || new Date().toISOString(),
    url: item.url || 'https://www.alphavantage.co/'
  })).filter(item => {
    if (!item.title || seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    return res.status(200).json({ source: 'demo', warning: 'La API de noticias todavía no está disponible; se muestran enlaces externos de respaldo.', updated: new Date().toISOString(), articles: DEMO_NEWS });
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
      return res.status(200).json({ source: 'demo', warning: clean(data.Information || data.Note || data['Error Message'], 240), updated: new Date().toISOString(), articles: DEMO_NEWS });
    }

    const articles = mapFeed(data).slice(0, 12);
    return res.status(200).json({ source: 'alpha-vantage', updated: new Date().toISOString(), articles: articles.length ? articles : DEMO_NEWS });
  } catch (error) {
    return res.status(200).json({ source: 'demo', warning: 'No fue posible consultar la fuente de noticias en este momento.', updated: new Date().toISOString(), articles: DEMO_NEWS });
  }
}
