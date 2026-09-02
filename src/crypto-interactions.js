const CRYPTO_MARKETS = {
  Bitcoin: { symbol: 'BTCUSDT', code: 'BTC', source: 'Binance' },
  Ethereum: { symbol: 'ETHUSDT', code: 'ETH', source: 'Binance' },
  Tether: { symbol: 'USDCUSDT', code: 'USDT', source: 'Binance' },
  Solana: { symbol: 'SOLUSDT', code: 'SOL', source: 'Binance' },
  BNB: { symbol: 'BNBUSDT', code: 'BNB', source: 'Binance' },
  XRP: { symbol: 'XRPUSDT', code: 'XRP', source: 'Binance' },
  Cardano: { symbol: 'ADAUSDT', code: 'ADA', source: 'Binance' },
  Dogecoin: { symbol: 'DOGEUSDT', code: 'DOGE', source: 'Binance' },
  Avalanche: { symbol: 'AVAXUSDT', code: 'AVAX', source: 'Binance' },
  Chainlink: { symbol: 'LINKUSDT', code: 'LINK', source: 'Binance' },
  Polkadot: { symbol: 'DOTUSDT', code: 'DOT', source: 'Binance' },
  Polygon: { symbol: 'POLUSDT', code: 'POL', source: 'Binance' }
};

const periods = { '30D': 30, '90D': 90, '1Y': 365 };
let currentPeriod = '30D';

function cryptoStyles() {
  if (document.getElementById('cryptoDetailStyles')) return;
  const style = document.createElement('style');
  style.id = 'cryptoDetailStyles';
  style.textContent = `
    .crypto-clickable{cursor:pointer;position:relative;transition:transform .18s ease,box-shadow .18s ease}
    .crypto-clickable:hover{transform:translateY(-3px);box-shadow:0 14px 34px rgba(20,40,80,.14)}
    .crypto-clickable:after{content:'↗';position:absolute;right:18px;top:16px;font-size:17px;opacity:.45}
    .crypto-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(5,10,22,.62);backdrop-filter:blur(9px)}
    .crypto-modal.hidden{display:none}
    .crypto-panel{width:min(980px,100%);max-height:min(90vh,900px);overflow:auto;border:1px solid rgba(120,140,180,.22);border-radius:26px;padding:26px;background:var(--panel,#fff);color:var(--text,#101828);box-shadow:0 30px 90px rgba(0,0,0,.3)}
    [data-theme="dark"] .crypto-panel{--panel:#111827;--text:#f5f7fb}
    .crypto-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
    .crypto-title{display:flex;align-items:center;gap:12px}.crypto-title span{font-size:12px;letter-spacing:.12em;opacity:.58}.crypto-title h2{margin:3px 0 0;font-size:30px}.crypto-price{font-size:30px;font-weight:800;text-align:right}.crypto-change{font-size:14px;margin-top:4px;text-align:right}.crypto-close{width:42px;height:42px;border:0;border-radius:12px;background:rgba(127,145,175,.12);font-size:26px;cursor:pointer}
    .crypto-periods{display:flex;gap:8px;margin:24px 0 12px}.crypto-period{border:1px solid rgba(127,145,175,.24);background:transparent;border-radius:10px;padding:9px 14px;cursor:pointer;font-weight:700}.crypto-period.active{background:#1849a9;color:#fff;border-color:#1849a9}
    .crypto-chart{width:100%;height:390px;display:block;border-radius:18px;background:rgba(127,145,175,.055)}
    .crypto-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px;font-size:12px;opacity:.62}.crypto-loading{height:390px;display:flex;align-items:center;justify-content:center;font-weight:700;opacity:.65}.crypto-error{height:390px;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;opacity:.72}
    @media(max-width:680px){.crypto-modal{padding:10px}.crypto-panel{padding:18px;border-radius:20px}.crypto-title h2{font-size:24px}.crypto-price{font-size:22px}.crypto-chart{height:300px}.crypto-head{gap:10px}.crypto-close{width:38px;height:38px}}
  `;
  document.head.appendChild(style);
}

function modalMarkup() {
  if (document.getElementById('cryptoModal')) return;
  const modal = document.createElement('div');
  modal.id = 'cryptoModal';
  modal.className = 'crypto-modal hidden';
  modal.innerHTML = `<div class="crypto-panel" role="dialog" aria-modal="true" aria-labelledby="cryptoModalTitle">
    <div class="crypto-head">
      <div class="crypto-title"><div><span id="cryptoModalCode">CRYPTO</span><h2 id="cryptoModalTitle">Bitcoin</h2></div></div>
      <div><button class="crypto-close" id="cryptoModalClose" aria-label="Close">×</button></div>
    </div>
    <div class="crypto-head" style="margin-top:10px"><div><span id="cryptoPeriodLabel">Historical market data</span></div><div><div class="crypto-price" id="cryptoModalPrice">—</div><div class="crypto-change" id="cryptoModalChange">—</div></div></div>
    <div class="crypto-periods">${Object.keys(periods).map(p=>`<button class="crypto-period${p==='30D'?' active':''}" data-period="${p}">${p}</button>`).join('')}</div>
    <div id="cryptoChartArea" class="crypto-chart"><div class="crypto-loading">Loading historical data…</div></div>
    <div class="crypto-meta"><span id="cryptoSource">Source: Binance</span><span id="cryptoUpdated">—</span></div>
  </div>`;
  document.body.appendChild(modal);
  document.getElementById('cryptoModalClose').onclick = closeCryptoModal;
  modal.addEventListener('click', e => { if (e.target === modal) closeCryptoModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCryptoModal(); });
  modal.querySelectorAll('.crypto-period').forEach(btn => btn.addEventListener('click', () => {
    currentPeriod = btn.dataset.period;
    modal.querySelectorAll('.crypto-period').forEach(x => x.classList.toggle('active', x === btn));
    const name = document.getElementById('cryptoModalTitle').textContent;
    loadCryptoHistory(name);
  }));
}

function closeCryptoModal() {
  const modal = document.getElementById('cryptoModal');
  if (modal) modal.classList.add('hidden');
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:value < 1 ? 6 : 2 }).format(value);
}

function buildChart(points, name) {
  const width = 900, height = 390, pad = 46;
  const values = points.map(p => p[1]);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || Math.max(max * .01, 1);
  const x = i => pad + i * ((width - pad * 2) / Math.max(points.length - 1, 1));
  const y = v => height - pad - ((v - min) / range) * (height - pad * 2);
  const path = points.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(2)} ${y(p[1]).toFixed(2)}`).join(' ');
  const area = `${path} L${x(points.length-1)} ${height-pad} L${x(0)} ${height-pad} Z`;
  const grid = [0.2,0.4,0.6,0.8].map(r=>{const yy=pad+(height-pad*2)*r;return `<line x1="${pad}" y1="${yy}" x2="${width-pad}" y2="${yy}" class="cryptoGrid"/>`;}).join('');
  const labels = [0, Math.floor(points.length/2), points.length-1].map(i=>`<text x="${x(i)}" y="${height-14}" text-anchor="middle" class="cryptoAxis">${new Date(points[i][0]).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</text>`).join('');
  const last = values[values.length-1], first = values[0], change = first ? ((last-first)/first)*100 : 0;
  const colorClass = change >= 0 ? 'cryptoUp' : 'cryptoDown';
  return { svg:`<svg class="crypto-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="${name} historical chart"><defs><linearGradient id="cryptoFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".18"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#cryptoFill)"/><path d="${path}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(points.length-1)}" cy="${y(last)}" r="5" fill="currentColor"/>${labels}</svg>`, last, change, colorClass };
}

async function loadCryptoHistory(name) {
  const info = CRYPTO_MARKETS[name];
  const area = document.getElementById('cryptoChartArea');
  if (!info || !area) return;
  area.innerHTML = '<div class="crypto-loading">Loading real historical data…</div>';
  try {
    const limit = periods[currentPeriod];
    const url = `https://api.binance.com/api/v3/klines?symbol=${info.symbol}&interval=1d&limit=${limit}`;
    const response = await fetch(url, { cache:'no-store' });
    if (!response.ok) throw new Error('Market data unavailable');
    const rows = await response.json();
    const points = rows.map(r => [Number(r[0]), Number(r[4])]);
    if (!points.length) throw new Error('No historical data');
    const chart = buildChart(points, name);
    area.innerHTML = chart.svg;
    const price = chart.last;
    const change = chart.change;
    document.getElementById('cryptoModalPrice').textContent = formatMoney(price);
    const changeEl = document.getElementById('cryptoModalChange');
    changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}% ${currentPeriod}`;
    changeEl.style.color = change >= 0 ? '#15803d' : '#b42318';
    document.getElementById('cryptoSource').textContent = `Source: ${info.source} · ${info.symbol}`;
    document.getElementById('cryptoUpdated').textContent = `Updated: ${new Date().toLocaleString()}`;
    document.getElementById('cryptoPeriodLabel').textContent = currentPeriod === '1Y' ? '1-year historical data' : `${currentPeriod.replace('D','-day')} historical data`;
    area.style.color = change >= 0 ? '#15803d' : '#b42318';
  } catch (error) {
    area.innerHTML = '<div class="crypto-error">No se pudo cargar el histórico en este momento.<br><br>La gráfica utiliza datos históricos reales de mercado y depende de la disponibilidad del proveedor.</div>';
    document.getElementById('cryptoModalPrice').textContent = '—';
    document.getElementById('cryptoModalChange').textContent = '—';
  }
}

function openCryptoModal(name) {
  cryptoStyles();
  modalMarkup();
  const info = CRYPTO_MARKETS[name];
  if (!info) return;
  const modal = document.getElementById('cryptoModal');
  document.getElementById('cryptoModalTitle').textContent = name;
  document.getElementById('cryptoModalCode').textContent = info.code;
  modal.classList.remove('hidden');
  currentPeriod = '30D';
  modal.querySelectorAll('.crypto-period').forEach(x=>x.classList.toggle('active',x.dataset.period===currentPeriod));
  loadCryptoHistory(name);
}

function bindCryptoCards() {
  document.addEventListener('click', event => {
    const card = event.target.closest('.card');
    if (!card) return;
    const category = card.querySelector('span')?.textContent?.trim();
    const name = card.querySelector('h3')?.textContent?.trim();
    if (category === 'Crypto' && CRYPTO_MARKETS[name]) openCryptoModal(name);
  });
}

cryptoStyles();
modalMarkup();
bindCryptoCards();
