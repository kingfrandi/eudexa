const EUDEXA_REFRESH_MS = 5 * 60 * 1000;
const MARKET_NAMES = new Set(['Bitcoin','Ethereum','Tether','Solana','BNB','XRP','Cardano','Dogecoin','Avalanche','Chainlink','Polkadot','Polygon','Apple','NVIDIA','Microsoft','Amazon','Alphabet','Meta','Tesla','S&P 500','Nasdaq 100','Dow Jones','Russell 2000','DAX','FTSE 100','Nikkei 225','IBEX 35','Gold','Silver','WTI Oil','Brent Oil','Natural Gas','Copper','Platinum','Corn','EUR/USD','USD/DOP','GBP/USD','USD/JPY','USD/MXN','USD/CAD','AUD/USD','USD/CHF']);

function formatMarketPrice(name,value){
  if(!Number.isFinite(value)) return '—';
  const isForex=name.includes('/');
  const decimals=value<1?6:isForex?4:2;
  const text=new Intl.NumberFormat('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value);
  if(['Gold','Silver','Platinum'].includes(name)) return `${text} / oz`;
  if(['WTI Oil','Brent Oil'].includes(name)) return `${text} / bbl`;
  if(name==='Copper') return `${text} / lb`;
  if(name==='Corn') return `${text} / bu`;
  return text;
}
function applyQuote(name,q){
  if(!q||q.error||!Number.isFinite(q.price)) return;
  document.querySelectorAll('.card,.marketRow').forEach(el=>{
    const title=el.querySelector('h3,strong')?.textContent?.trim(); if(title!==name) return;
    const price=el.querySelector('.price');
    if(price) price.innerHTML=`${formatMarketPrice(name,q.price)}<i class="${q.change<0?'neg':''}">${q.change>=0?'+':''}${q.change.toFixed(2)}%</i>`;
    const strongs=el.querySelectorAll('strong');
    if(el.classList.contains('marketRow')&&strongs.length>1) strongs[strongs.length-1].textContent=formatMarketPrice(name,q.price);
  });
}
async function refreshQuotes(){
  try{
    const r=await fetch('/api/market',{cache:'no-store'}); if(!r.ok) throw new Error('unavailable');
    const data=await r.json(); Object.keys(data).forEach(name=>applyQuote(name,data[name]));
    document.querySelectorAll('.status').forEach(s=>{s.innerHTML='● LIVE MARKET DATA<br><small>Datos de mercado · actualización periódica</small>';});
    document.querySelectorAll('.detailSummary strong').forEach(s=>{if(s.textContent.includes('Demo'))s.textContent='● LIVE';});
    document.querySelectorAll('.detailNote').forEach(n=>{n.textContent='Los precios y variaciones se obtienen de proveedores externos y se actualizan periódicamente. Puede existir un pequeño retraso según el mercado y el proveedor.';});
  }catch(e){}
}
function chartFromPoints(points,name){
  const W=900,H=390,P=46,vals=points.map(p=>p[1]),min=Math.min(...vals),max=Math.max(...vals),range=max-min||Math.max(Math.abs(max)*.01,1),x=i=>P+i*((W-P*2)/Math.max(points.length-1,1)),y=v=>H-P-((v-min)/range)*(H-P*2),path=points.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(2)} ${y(p[1]).toFixed(2)}`).join(' '),area=`${path} L${x(points.length-1)} ${H-P} L${x(0)} ${H-P} Z`,grid=[.2,.4,.6,.8].map(r=>`<line x1="${P}" y1="${P+(H-P*2)*r}" x2="${W-P}" y2="${P+(H-P*2)*r}" class="marketGrid"/>`).join('');
  return `<svg class="market-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Historical chart for ${name}"><defs><linearGradient id="syncFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".18"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#syncFill)"/><path d="${path}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(vals.length-1)}" cy="${y(vals.at(-1))}" r="5" fill="currentColor"/></svg>`;
}
async function loadSyncedMarket(name,period='30D'){
  const modal=document.getElementById('marketModal'); if(!modal) return;
  modal.classList.remove('hidden');
  const title=document.getElementById('marketModalTitle'),code=document.getElementById('marketModalCode'),area=document.getElementById('marketChartArea');
  if(title) title.textContent=name; if(code) code.textContent=name; if(area) area.innerHTML='<div class="market-loading">Cargando datos reales…</div>';
  try{
    const r=await fetch(`/api/market?asset=${encodeURIComponent(name)}&period=${period}`,{cache:'no-store'}); if(!r.ok) throw new Error('unavailable');
    const q=await r.json(); if(!q.points?.length) throw new Error('empty');
    if(area){area.style.color=q.change>=0?'#15803d':'#b42318';area.innerHTML=chartFromPoints(q.points,name);}
    const price=document.getElementById('marketModalPrice'); if(price) price.textContent=formatMarketPrice(name,q.price);
    const change=document.getElementById('marketModalChange'); if(change) change.textContent=`${q.change>=0?'+':''}${q.change.toFixed(2)}% ${period}`;
    const source=document.getElementById('marketSource'); if(source) source.textContent=`Source: ${q.source}`;
    const updated=document.getElementById('marketUpdated'); if(updated) updated.textContent=`Updated: ${new Date(q.updated).toLocaleString()}`;
  }catch(e){if(area) area.innerHTML='<div class="market-error">No se pudo cargar el dato real en este momento. Inténtalo de nuevo en unos segundos.</div>';}
}
function bindSyncedClicks(){
  document.addEventListener('click',e=>{
    const periodButton=e.target.closest('.market-period');
    if(periodButton){
      e.stopPropagation();
      const name=document.getElementById('marketModalTitle')?.textContent?.trim(); if(!name||!MARKET_NAMES.has(name)) return;
      document.querySelectorAll('.market-period').forEach(x=>x.classList.toggle('active',x===periodButton));
      loadSyncedMarket(name,periodButton.dataset.period||'30D'); return;
    }
    const el=e.target.closest('.card,.marketRow'); if(!el) return;
    const name=el.querySelector('h3,strong')?.textContent?.trim(); if(!MARKET_NAMES.has(name)) return;
    e.stopPropagation(); loadSyncedMarket(name,'30D');
  },true);
}
bindSyncedClicks();
refreshQuotes();
setInterval(refreshQuotes,EUDEXA_REFRESH_MS);
