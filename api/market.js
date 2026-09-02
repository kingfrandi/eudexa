const ASSETS = {
  Bitcoin: { provider: 'crypto', symbol: 'BTCUSDT', coinbase: 'BTC-USD' },
  Ethereum: { provider: 'crypto', symbol: 'ETHUSDT', coinbase: 'ETH-USD' },
  Tether: { provider: 'crypto', symbol: 'USDTUSDT', coinbase: 'USDT-USD' },
  Solana: { provider: 'crypto', symbol: 'SOLUSDT', coinbase: 'SOL-USD' },
  BNB: { provider: 'crypto', symbol: 'BNBUSDT', coinbase: 'BNB-USD' },
  XRP: { provider: 'crypto', symbol: 'XRPUSDT', coinbase: 'XRP-USD' },
  Cardano: { provider: 'crypto', symbol: 'ADAUSDT', coinbase: 'ADA-USD' },
  Dogecoin: { provider: 'crypto', symbol: 'DOGEUSDT', coinbase: 'DOGE-USD' },
  Avalanche: { provider: 'crypto', symbol: 'AVAXUSDT', coinbase: 'AVAX-USD' },
  Chainlink: { provider: 'crypto', symbol: 'LINKUSDT', coinbase: 'LINK-USD' },
  Polkadot: { provider: 'crypto', symbol: 'DOTUSDT', coinbase: 'DOT-USD' },
  Polygon: { provider: 'crypto', symbol: 'POLUSDT', coinbase: 'POL-USD' },
  Apple: { provider: 'yahoo', symbol: 'AAPL' },
  NVIDIA: { provider: 'yahoo', symbol: 'NVDA' },
  Microsoft: { provider: 'yahoo', symbol: 'MSFT' },
  Amazon: { provider: 'yahoo', symbol: 'AMZN' },
  Alphabet: { provider: 'yahoo', symbol: 'GOOGL' },
  Meta: { provider: 'yahoo', symbol: 'META' },
  Tesla: { provider: 'yahoo', symbol: 'TSLA' },
  'S&P 500': { provider: 'yahoo', symbol: '%5EGSPC' },
  'Nasdaq 100': { provider: 'yahoo', symbol: '%5ENDX' },
  'Dow Jones': { provider: 'yahoo', symbol: '%5EDJI' },
  'Russell 2000': { provider: 'yahoo', symbol: '%5ERUT' },
  DAX: { provider: 'yahoo', symbol: '%5EGDAXI' },
  'FTSE 100': { provider: 'yahoo', symbol: '%5EFTSE' },
  'Nikkei 225': { provider: 'yahoo', symbol: '%5EN225' },
  'IBEX 35': { provider: 'yahoo', symbol: '%5EIBEX' },
  Gold: { provider: 'yahoo', symbol: 'GC=F' },
  Silver: { provider: 'yahoo', symbol: 'SI=F' },
  'WTI Oil': { provider: 'yahoo', symbol: 'CL=F' },
  'Brent Oil': { provider: 'yahoo', symbol: 'BZ=F' },
  'Natural Gas': { provider: 'yahoo', symbol: 'NG=F' },
  Copper: { provider: 'yahoo', symbol: 'HG=F' },
  Platinum: { provider: 'yahoo', symbol: 'PL=F' },
  Corn: { provider: 'yahoo', symbol: 'ZC=F' },
  'EUR/USD': { provider: 'yahoo', symbol: 'EURUSD=X' },
  'USD/DOP': { provider: 'yahoo', symbol: 'USDDOP=X' },
  'GBP/USD': { provider: 'yahoo', symbol: 'GBPUSD=X' },
  'USD/JPY': { provider: 'yahoo', symbol: 'JPY=X', invert: true },
  'USD/MXN': { provider: 'yahoo', symbol: 'MXN=X', invert: true },
  'USD/CAD': { provider: 'yahoo', symbol: 'CAD=X', invert: true },
  'AUD/USD': { provider: 'yahoo', symbol: 'AUDUSD=X' },
  'USD/CHF': { provider: 'yahoo', symbol: 'CHF=X', invert: true }
};

function invertPoints(points) {
  return points.map(function (point) {
    return [point[0], point[1] ? 1 / point[1] : null];
  }).filter(function (point) {
    return Number.isFinite(point[1]);
  });
}

async function getCryptoBinance(info, period) {
  const limit = period === '1Y' ? 365 : period === '90D' ? 90 : 30;
  const interval = period === '1Y' ? '1d' : '1h';
  const requestLimit = period === '1Y' ? limit : Math.min(limit * 24, 1000);
  const response = await fetch('https://api.binance.com/api/v3/klines?symbol=' + info.symbol + '&interval=' + interval + '&limit=' + requestLimit);
  if (!response.ok) throw new Error('Binance unavailable');
  const rows = await response.json();
  const points = rows.map(function (row) { return [Number(row[0]), Number(row[4])]; }).filter(function (point) { return Number.isFinite(point[1]); });
  if (!points.length) throw new Error('Empty Binance history');
  return points;
}

async function getCryptoCoinbase(info, period) {
  const days = period === '1Y' ? 365 : period === '90D' ? 90 : 30;
  const granularity = 86400;
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 86400;
  const response = await fetch('https://api.exchange.coinbase.com/products/' + encodeURIComponent(info.coinbase) + '/candles?granularity=' + granularity + '&start=' + start + '&end=' + end, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Coinbase unavailable');
  const rows = await response.json();
  const points = rows.map(function (row) { return [Number(row[0]) * 1000, Number(row[4])]; }).filter(function (point) { return Number.isFinite(point[1]); }).sort(function (a,b) { return a[0] - b[0]; });
  if (!points.length) throw new Error('Empty Coinbase history');
  return points;
}

async function getCryptoPoints(info, period) {
  try {
    return { points: await getCryptoBinance(info, period), source: 'Binance' };
  } catch (binanceError) {
    return { points: await getCryptoCoinbase(info, period), source: 'Coinbase' };
  }
}

async function getPoints(name, period) {
  const info = ASSETS[name];
  if (!info) throw new Error('Unknown asset');

  if (info.provider === 'crypto') {
    return (await getCryptoPoints(info, period)).points;
  }

  const range = period === '1Y' ? '1y' : period === '90D' ? '3mo' : '1mo';
  const interval = period === '1Y' ? '1d' : '1h';
  const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + info.symbol + '?range=' + range + '&interval=' + interval + '&events=history');
  if (!response.ok) throw new Error('Yahoo Finance unavailable');
  const json = await response.json();
  const result = json.chart && json.chart.result && json.chart.result[0];
  if (!result || !result.timestamp || !result.indicators || !result.indicators.quote) throw new Error('Empty Yahoo response');

  let points = result.timestamp.map(function (timestamp, index) {
    return [timestamp * 1000, result.indicators.quote[0].close[index]];
  }).filter(function (point) {
    return Number.isFinite(point[1]);
  });

  if (info.invert) points = invertPoints(points);
  const maximum = period === '1Y' ? 365 : period === '90D' ? 90 * 24 : 30 * 24;
  return points.slice(-maximum);
}

async function getSource(name, period) {
  const info = ASSETS[name];
  if (info.provider === 'crypto') return (await getCryptoPoints(info, period)).source;
  return 'Yahoo Finance';
}

async function quote(name) {
  const points = await getPoints(name, '30D');
  if (!points.length) throw new Error('Empty history');
  const last = points[points.length - 1][1];
  const previous = points.length > 1 ? points[points.length - 2][1] : last;
  return {
    name: name,
    price: last,
    change: previous ? ((last - previous) / previous) * 100 : 0,
    updated: points[points.length - 1][0],
    source: await getSource(name, '30D')
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  try {
    const url = new URL(req.url, 'https://' + (req.headers.host || 'localhost'));
    const asset = url.searchParams.get('asset');
    const period = url.searchParams.get('period') || '30D';

    if (asset) {
      const points = await getPoints(asset, period);
      if (!points.length) throw new Error('Empty history');
      const first = points[0][1];
      const last = points[points.length - 1][1];
      return res.status(200).json({
        name: asset,
        points: points,
        price: last,
        change: first ? ((last - first) / first) * 100 : 0,
        updated: points[points.length - 1][0],
        source: await getSource(asset, period)
      });
    }

    const output = {};
    await Promise.all(Object.keys(ASSETS).map(async function (name) {
      try {
        output[name] = await quote(name);
      } catch (error) {
        output[name] = { name: name, error: true };
      }
    }));

    return res.status(200).json(output);
  } catch (error) {
    return res.status(502).json({ error: 'Market data unavailable' });
  }
};
