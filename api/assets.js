function clean(value, max = 120) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

const FALLBACK = [
  ['Bitcoin','BTC','Crypto'],['Ethereum','ETH','Crypto'],['Tether','USDT','Crypto'],['BNB','BNB','Crypto'],['XRP','XRP','Crypto'],['Solana','SOL','Crypto'],['Cardano','ADA','Crypto'],['Dogecoin','DOGE','Crypto'],['Avalanche','AVAX','Crypto'],['Chainlink','LINK','Crypto'],['Polkadot','DOT','Crypto'],['Polygon','POL','Crypto'],
  ['Apple','AAPL','Stock'],['Microsoft','MSFT','Stock'],['NVIDIA','NVDA','Stock'],['Amazon','AMZN','Stock'],['Alphabet','GOOGL','Stock'],['Meta','META','Stock'],['Tesla','TSLA','Stock'],
  ['S&P 500','SPX','Index'],['Nasdaq 100','NDX','Index'],['Dow Jones','DJI','Index'],['DAX','DAX','Index'],['Nikkei 225','N225','Index'],['FTSE 100','FTSE','Index'],['Russell 2000','RUT','Index'],['IBEX 35','IBEX','Index'],
  ['Gold','XAU','Commodity'],['Silver','XAG','Commodity'],['WTI Oil','WTI','Commodity'],['Brent Oil','BRENT','Commodity'],['Natural Gas','NG','Commodity'],['Copper','HG','Commodity'],['Platinum','XPT','Commodity'],['Corn','ZC','Commodity'],
  ['EUR/USD','EURUSD','Forex'],['USD/JPY','USDJPY','Forex'],['GBP/USD','GBPUSD','Forex'],['USD/DOP','USDDOP','Forex'],['USD/CAD','USDCAD','Forex'],['USD/CHF','USDCHF','Forex'],['AUD/USD','AUDUSD','Forex'],['USD/MXN','USDMXN','Forex']
];

function fallbackCatalog() {
  return FALLBACK.map(([name, symbol, type]) => ({ name, symbol, type }));
}

async function getCryptoPage(page) {
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=' + page + '&sparkline=false';
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('CoinGecko unavailable');
  const data = await response.json();
  return data.filter(x => x?.name && x?.symbol).map(x => ({
    name: clean(x.name), symbol: clean(String(x.symbol).toUpperCase(), 30), type: 'Crypto', id: clean(x.id, 100),
    price: Number.isFinite(x.current_price) ? x.current_price : null,
    change: Number.isFinite(x.price_change_percentage_24h) ? x.price_change_percentage_24h : null,
    marketCap: Number.isFinite(x.market_cap) ? x.market_cap : null
  }));
}

async function getCrypto() {
  const pages = await Promise.all([1,2,3,4].map(getCryptoPage));
  return pages.flat();
}

async function getStocks(key) {
  if (!key) return [];
  const response = await fetch('https://www.alphavantage.co/query?function=LISTING_STATUS&state=active&apikey=' + encodeURIComponent(key));
  if (!response.ok) throw new Error('Alpha Vantage unavailable');
  const text = await response.text();
  if (text.includes('Information') || text.includes('Note') || text.includes('Error Message')) return [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',');
  const index = Object.fromEntries(headers.map((h, i) => [h.trim(), i]));
  return lines.slice(1).map(line => {
    const cells = line.split(',');
    const symbol = clean(cells[index.symbol], 30); const name = clean(cells[index.name], 160); const assetType = clean(cells[index.assetType], 30);
    if (!symbol || !name || (assetType && !['Stock','ETF'].includes(assetType))) return null;
    return { name, symbol, type: assetType === 'ETF' ? 'ETF' : 'Stock', exchange: clean(cells[index.exchange], 30) };
  }).filter(Boolean);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const q = clean(new URL(req.url, 'https://' + (req.headers.host || 'localhost')).searchParams.get('q'), 80).toLowerCase();
  try {
    const [crypto, stocks] = await Promise.allSettled([getCrypto(), getStocks(process.env.ALPHA_VANTAGE_API_KEY)]);
    let assets = [...fallbackCatalog()];
    if (crypto.status === 'fulfilled') assets.push(...crypto.value);
    if (stocks.status === 'fulfilled') assets.push(...stocks.value);
    const seen = new Set();
    assets = assets.filter(asset => { const key = `${asset.type}:${asset.symbol}`.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
    if (q) assets = assets.filter(a => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
    return res.status(200).json({ source: { crypto: crypto.status, stocks: stocks.status }, count: assets.length, assets: assets.slice(0, q ? 30 : 1000) });
  } catch (error) {
    const assets = fallbackCatalog().filter(a => !q || a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
    return res.status(200).json({ source: 'fallback', count: assets.length, assets });
  }
};
