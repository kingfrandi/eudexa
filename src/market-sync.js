const EUDEXA_REFRESH_MS = 5 * 60 * 1000;
const MARKET_NAMES = new Set(['Bitcoin','Ethereum','Tether','Solana','BNB','XRP','Cardano','Dogecoin','Avalanche','Chainlink','Polkadot','Polygon','Apple','NVIDIA','Microsoft','Amazon','Alphabet','Meta','Tesla','S&P 500','Nasdaq 100','Dow Jones','Russell 2000','DAX','FTSE 100','Nikkei 225','IBEX 35','Gold','Silver','WTI Oil','Brent Oil','Natural Gas','Copper','Platinum','Corn','EUR/USD','USD/DOP','GBP/USD','USD/JPY','USD/MXN','USD/CAD','AUD/USD','USD/CHF']);

function formatMarketPrice(name, value) {
  if (!Number.isFinite(value)) return '—';
  const forex = name.includes('/');
  const decimals = value < 1 ? 6 : forex ? 4 : 2;
  const text = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  if (['Gold','Silver','Platinum'].includes(name)) return `${text} / oz`;
  if (['WTI Oil','Brent Oil'].includes(name)) return `${text} / bbl`;
  if (name === 'Copper') return `${text} / lb`;
  if (name === 'Corn') return `${text} / bu`;
  return text;
}

function ensureMarketStyles() {
  if (document.getElementById('eudexaMarketStyles')) return;
  const style = document.createElement('style');
  style.id = 'eudexaMarketStyles';
  style.textContent = `
    .card,.marketRow{cursor:pointer}
    .card:hover,.marketRow:hover{border-color:var(--accent);transform:translateY(-1px);transition:transform .15s ease,border-color .15s ease}
    .market-modal{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,15,30,.58);backdrop-filter:blur(7px)}
    .market-modal.hidden{display:none!important}
    .market-panel{width:min(900px,96vw);max-height:90vh;overflow:auto;background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:22px;padding:24px;box-shadow:0 30px 100px rgba(0,0,0,.28)}
    .market-head{display:flex;align-items:center;justify-content:space-between;gap:20px}
    .market-title h2{margin:4px 0 0;font-size:30px}
    .market-code{font-size:11px;letter-spacing:1.5px;color:var(--muted);font-weight:800}
    .market-close{width:40px;height:40px;border:1px solid var(--line);border-radius:11px;background:var(--bg);color:var(--text);font-size:26px;cursor:pointer}
    .market-close:hover{border-color:var(--accent);background:var(--soft)}
    .market-price{font-size:28px;font-weight:800;text-align:right}
    .market-change{font-size:13px;color:var(--muted);text-align:right;margin-top:4px}
    .market-periods{display:flex;gap:8px;margin:22px 0 14px}
    .market-period{border:1px solid var(--line);background:var(--bg);color:var(--text);padding:8px 13px;border-radius:9px;cursor:pointer;font-weight:700}
    .market-period.active,.market-period:hover{background:var(--soft);border-color:var(--accent);color:var(--accent)}
    #marketChartArea{height:390px;min-height:280px;border:1px solid var(--line);border-radius:16px;background:var(--bg);padding:12px;display:flex;align-items:center;justify-content:center}
    #marketChartArea .market-chart{width:100%;height:100%}
    .market-loading,.market-error{color:var(--muted);text-align:center;padding:30px}
    .market-meta{display:flex;justify-content:space-between;gap:15px;margin-top:13px;color:var(--muted);font-size:12px}
    @media(max-width:600px){.market-modal{padding:10px}.market-panel{padding:17px;border-radius:18px}.market-head{align-items:flex-start}.market-price{font-size:21px}.market-title h2{font-size:25px}#marketChartArea{height:300px}.market-meta{flex-direction:column}}
  `;
  document.head.appendChild(style);
}

function ensureMarketModal() {
  if (document.getElementById('marketModal')) return;
  const m = document.createElement('div');
  m.id = 'marketModal';
  m.className = 'market-modal hidden';
  m.innerHTML = `<div class="market-panel" role="dialog" aria-modal="true" aria-labelledby="marketModalTitle">
    <div class="market-head">
      <div class="market-title"><span class="market-code" id="marketModalCode">MARKET</span><h2 id="marketModalTitle">Asset</h2></div>
      <button class="market-close" id="marketModalClose" aria-label="Close">×</button>
    </div>
    <div class="market-head" style="margin-top:10px">
      <div><span id="marketPeriodLabel">Historical market data</span></div>
      <div><div class="market-price" id="marketModalPrice">—</div><div class="market-change" id="marketModalChange">—</div></div>
    </div>
    <div class="market-periods">
      <button class="market-period active" data-period="30D">30D</button>
      <button class="market-period" data-period="90D">90D</button>
      <button class="market-period" data-period="1Y">1Y</button>
    </div>
    <div id="marketChartArea"><div class="market-loading">Cargando datos reales…</div></div>
    <div class="market-meta"><span id="marketSource">Source: —</span><span id="marketUpdated">—</span></div>
  </div>`;
  document.body.appendChild(m);
  document.getElementById('marketModalClose').onclick = () => m.classList.add('hidden');
  m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
}

function applyQuote(name, q) {
  if (!q || q.error || !Number.isFinite(q.price)) return;
  document.querySelectorAll('.card,.marketRow').forEach(el => {
    const title = el.querySelector('h3,strong')?.textContent?.trim();
    if (title !== name) return;
    const price = el.querySelector('.price');
    if (price) price.innerHTML = `${formatMarketPrice(name,q.price)}<i class="${q.change < 0 ? 'neg' : ''}">${q.change >= 0 ? '+' : ''}${q.change.toFixed(2)}%</i>`;
    const strongs = el.querySelectorAll('strong');
    if (el.classList.contains('marketRow') && strongs.length > 1) strongs[strongs.length - 1].textContent = formatMarketPrice(name,q.price);
  });
}

async function refreshQuotes() {
  try {
    const r = await fetch('/api/market', { cache: 'no-store' });
    if (!r.ok) throw new Error('unavailable');
    const data = await r.json();
    Object.keys(data).forEach(name => applyQuote(name, data[name]));
    document.querySelectorAll('.status').forEach(s => { s.innerHTML = '● LIVE MARKET DATA<br><small>Datos de mercado · actualización periódica</small>'; });
    document.querySelectorAll('.detailSummary strong').forEach(s => { if (s.textContent.includes('Demo')) s.textContent = '● LIVE'; });
    document.querySelectorAll('.detailNote').forEach(n => { n.textContent = 'Los precios y variaciones se obtienen de proveedores externos y se actualizan periódicamente. Puede existir un pequeño retraso según el mercado y el proveedor.'; });
  } catch (e) {
    console.warn('EUDEXA market data unavailable:', e);
  }
}

function chartFromPoints(points, name) {
  const W=900,H=390,P=46;
  const vals=points.map(p=>p[1]).filter(Number.isFinite);
  if (!vals.length) return '<div class="market-error">No hay datos históricos disponibles.</div>';
  const min=Math.min(...vals),max=Math.max(...vals),range=max-min||Math.max(Math.abs(max)*.01,1);
  const x=i=>P+i*((W-P*2)/Math.max(vals.length-1,1));
  const y=v=>H-P-((v-min)/range)*(H-P*2);
  const path=vals.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');
  const area=`${path} L${x(vals.length-1)} ${H-P} L${x(0)} ${H-P} Z`;
  return `<svg class="market-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Historical chart for ${name}"><defs><linearGradient id="syncFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".18"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#syncFill)"/><path d="${path}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="${x(vals.length-1)}" cy="${y(vals[vals.length-1])}" r="5" fill="currentColor"/></svg>`;
}

async function loadSyncedMarket(name, period='30D') {
  if (!MARKET_NAMES.has(name)) return;
  ensureMarketModal();
  const modal=document.getElementById('marketModal');
  modal.classList.remove('hidden');
  const title=document.getElementById('marketModalTitle'), code=document.getElementById('marketModalCode'), area=document.getElementById('marketChartArea');
  const knownCode={Bitcoin:'BTC',Ethereum:'ETH',Tether:'USDT',Solana:'SOL',BNB:'BNB',XRP:'XRP',Cardano:'ADA',Dogecoin:'DOGE',Avalanche:'AVAX',Chainlink:'LINK',Polkadot:'DOT',Polygon:'POL'};
  if(title) title.textContent=name;
  if(code) code.textContent=knownCode[name]||name;
  if(area) area.innerHTML='<div class="market-loading">Cargando datos reales…</div>';
  const price=document.getElementById('marketModalPrice');
  if(price) price.textContent='—';
  try {
    const r=await fetch(`/api/market?asset=${encodeURIComponent(name)}&period=${encodeURIComponent(period)}`,{cache:'no-store'});
    if(!r.ok) throw new Error('unavailable');
    const q=await r.json();
    if(!q.points?.length) throw new Error('empty');
    if(area){area.style.color=q.change>=0?'#15803d':'#b42318';area.innerHTML=chartFromPoints(q.points,name);}
    if(price) price.textContent=formatMarketPrice(name,q.price);
    const change=document.getElementById('marketModalChange');
    if(change) change.textContent=`${q.change>=0?'+':''}${q.change.toFixed(2)}% ${period}`;
    const source=document.getElementById('marketSource');
    if(source) source.textContent=`Source: ${q.source}`;
    const updated=document.getElementById('marketUpdated');
    if(updated) updated.textContent=`Actualizado: ${new Date(q.updated).toLocaleString()}`;
    const label=document.getElementById('marketPeriodLabel');
    if(label) label.textContent=period==='1Y'?'Histórico de 1 año':`Histórico de ${period.replace('D',' días')}`;
  } catch(e) {
    if(area) area.innerHTML='<div class="market-error">No se pudo cargar el dato real en este momento. Inténtalo de nuevo en unos segundos.</div>';
    if(price) price.textContent='—';
  }
}

window.openEudexaMarket = loadSyncedMarket;

function bindSyncedClicks() {
  document.addEventListener('click', e => {
    const periodButton=e.target.closest?.('.market-period');
    if(periodButton){e.preventDefault();e.stopPropagation();const name=document.getElementById('marketModalTitle')?.textContent?.trim();if(MARKET_NAMES.has(name))loadSyncedMarket(name,periodButton.dataset.period||'30D');return;}
    const el=e.target.closest?.('[data-market-asset],.card,.marketRow');
    if(!el)return;
    const name=el.dataset.marketAsset || el.querySelector('h3,strong')?.textContent?.trim();
    if(!MARKET_NAMES.has(name))return;
    e.preventDefault();e.stopPropagation();loadSyncedMarket(name,'30D');
  }, true);
}

ensureMarketStyles();
ensureMarketModal();
bindSyncedClicks();
refreshQuotes();
setInterval(refreshQuotes,EUDEXA_REFRESH_MS);
