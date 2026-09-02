const GLOBAL_SEARCH_STYLE = `
#globalSearchOverlay{position:fixed;inset:0;z-index:2000;background:rgba(5,10,20,.58);backdrop-filter:blur(8px);padding:70px 18px 18px;overflow:auto}
#globalSearchOverlay.hidden{display:none!important}
.global-search-box{width:min(760px,100%);margin:0 auto;background:var(--panel);border:1px solid var(--line);border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.3);overflow:hidden}
.global-search-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}
.global-search-head input{flex:1;border:0;outline:0;background:transparent;color:var(--text);font-size:18px}
.global-search-head button{border:1px solid var(--line);background:var(--bg);color:var(--text);border-radius:10px;width:38px;height:38px;font-size:22px;cursor:pointer}
.global-search-results{padding:8px;max-height:70vh;overflow:auto}
.global-search-result{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 14px;border:0;border-radius:12px;background:transparent;color:var(--text);text-align:left;cursor:pointer}
.global-search-result:hover,.global-search-result:focus{background:var(--soft);outline:none}
.global-search-result strong{display:block}.global-search-result small{display:block;color:var(--muted);margin-top:3px}.global-search-type{font-size:10px;font-weight:800;letter-spacing:1px;color:var(--muted)}
.global-search-empty{padding:25px;text-align:center;color:var(--muted)}
`;

function installGlobalSearchStyle(){
  if(document.getElementById('globalSearchStyle'))return;
  const s=document.createElement('style');s.id='globalSearchStyle';s.textContent=GLOBAL_SEARCH_STYLE;document.head.appendChild(s);
}

function ensureGlobalSearch(){
  if(document.getElementById('globalSearchOverlay'))return;
  const overlay=document.createElement('div');overlay.id='globalSearchOverlay';overlay.className='hidden';
  overlay.innerHTML=`<div class="global-search-box" role="dialog" aria-modal="true" aria-label="Global search"><div class="global-search-head"><span>⌕</span><input id="globalSearchInput" placeholder="Bitcoin, Apple, Gold, EUR/USD..." autocomplete="off"><button id="globalSearchClose" aria-label="Close">×</button></div><div id="globalSearchResults" class="global-search-results"></div></div>`;
  document.body.appendChild(overlay);
  document.getElementById('globalSearchClose').onclick=closeGlobalSearch;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeGlobalSearch()});
  const input=document.getElementById('globalSearchInput');
  input.oninput=()=>globalSearch(input.value);
  input.onkeydown=e=>{if(e.key==='Escape')closeGlobalSearch();if(e.key==='Enter'){e.preventDefault();const first=document.querySelector('.global-search-result');if(first)first.click()}};
  document.getElementById('globalSearchResults').onclick=e=>{const b=e.target.closest('.global-search-result');if(b)selectGlobalAsset(b.dataset.name,b.dataset.symbol,b.dataset.type)};
}

function openGlobalSearch(){ensureGlobalSearch();const overlay=document.getElementById('globalSearchOverlay');overlay.classList.remove('hidden');const input=document.getElementById('globalSearchInput');input.value='';document.getElementById('globalSearchResults').innerHTML='<div class="global-search-empty">Escribe un activo, empresa o símbolo.</div>';input.focus()}
function closeGlobalSearch(){document.getElementById('globalSearchOverlay')?.classList.add('hidden')}

let searchTimer;
async function globalSearch(query){
  const q=String(query||'').trim();const out=document.getElementById('globalSearchResults');if(!out)return;
  if(!q){out.innerHTML='<div class="global-search-empty">Escribe un activo, empresa o símbolo.</div>';return;}
  clearTimeout(searchTimer);searchTimer=setTimeout(async()=>{
    out.innerHTML='<div class="global-search-empty">Buscando en los mercados…</div>';
    try{const r=await fetch('/api/assets?q='+encodeURIComponent(q),{cache:'no-store'});const data=await r.json();const items=data.assets||[];
      if(!items.length){out.innerHTML='<div class="global-search-empty">No encontramos ese activo.</div>';return;}
      out.innerHTML=items.slice(0,30).map(a=>`<button class="global-search-result" data-name="${escapeAttr(a.name)}" data-symbol="${escapeAttr(a.symbol)}" data-type="${escapeAttr(a.type)}"><span><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(a.symbol)}</small></span><span class="global-search-type">${escapeHtml(a.type)}</span></button>`).join('');
    }catch(e){out.innerHTML='<div class="global-search-empty">No fue posible consultar el catálogo ahora.</div>'}
  },180);
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escapeAttr(v){return escapeHtml(v)}

function selectGlobalAsset(name,symbol,type){
  closeGlobalSearch();
  const routes={Crypto:'crypto',Stock:'stocks',ETF:'stocks',Index:'indices',Commodity:'commodities',Forex:'forex'};
  if(routes[type]){location.hash='#market/'+routes[type];return;}
  if(window.openEudexaMarket)window.openEudexaMarket(name,'30D');
}

function bindGlobalSearchButton(){
  document.addEventListener('click',e=>{
    const button=e.target.closest?.('#searchToggle');
    if(!button)return;
    e.preventDefault();e.stopImmediatePropagation();openGlobalSearch();
  },true);
}

installGlobalSearchStyle();ensureGlobalSearch();bindGlobalSearchButton();
