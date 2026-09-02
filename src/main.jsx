import './style.css';

const assets = [
  ['Bitcoin', 'BTC', 'Crypto', '68,420.00', '+2.4%'],
  ['Ethereum', 'ETH', 'Crypto', '3,620.00', '+1.8%'],
  ['Apple', 'AAPL', 'Stock', '218.40', '+0.6%'],
  ['NVIDIA', 'NVDA', 'Stock', '142.20', '-0.8%'],
  ['Gold', 'XAU', 'Commodity', '2,340.00', '+0.3%'],
  ['S&P 500', 'SPX', 'Index', '5,420.30', '+0.4%'],
  ['EUR/USD', 'EURUSD', 'Forex', '1.0842', '-0.1%']
];
const rates = { USD: 1, EUR: 0.92, DOP: 59.1, GBP: 0.78, JPY: 156.4, MXN: 16.9 };
const currencies = Object.keys(rates);
let lang = localStorage.getItem('lang') || 'ES';
let dark = localStorage.getItem('theme') === 'dark';
let lastScrollY = window.scrollY;
const t = (es, en) => lang === 'ES' ? es : en;

const datasets = {
  forex: {
    title: ['Tipos de cambio', 'Exchange rates'],
    label: ['Divisas', 'Foreign exchange'],
    items: [
      ['EUR/USD','EURUSD','Forex','1.0842','-0.1%'],['USD/DOP','USDDOP','Forex','59.10','+0.2%'],['GBP/USD','GBPUSD','Forex','1.2820','-0.1%'],['USD/JPY','USDJPY','Forex','156.40','+0.3%'],['USD/MXN','USDMXN','Forex','16.90','+0.2%'],['USD/CAD','USDCAD','Forex','1.3650','+0.1%'],['AUD/USD','AUDUSD','Forex','0.6620','-0.2%'],['USD/CHF','USDCHF','Forex','0.8840','+0.1%']]
  },
  crypto: {
    title: ['Mercado cripto', 'Crypto market'],
    label: ['Criptomonedas', 'Cryptocurrencies'],
    items: [['Bitcoin','BTC','Crypto','68,420.00','+2.4%'],['Ethereum','ETH','Crypto','3,620.00','+1.8%'],['Tether','USDT','Crypto','1.00','0.0%'],['Solana','SOL','Crypto','156.20','+3.1%'],['BNB','BNB','Crypto','612.40','+1.2%'],['XRP','XRP','Crypto','0.5220','-0.7%'],['Cardano','ADA','Crypto','0.3620','+0.5%'],['Dogecoin','DOGE','Crypto','0.1420','+2.9%'],['Avalanche','AVAX','Crypto','28.40','+1.1%'],['Chainlink','LINK','Crypto','14.80','-0.3%'],['Polkadot','DOT','Crypto','4.92','+0.8%'],['Polygon','POL','Crypto','0.412','+0.4%']]
  },
  stocks: {
    title: ['Acciones', 'Stocks'], label: ['Mercado de acciones', 'Stock market'],
    items: [['Apple','AAPL','Stock','218.40','+0.6%'],['NVIDIA','NVDA','Stock','142.20','-0.8%'],['Microsoft','MSFT','Stock','505.20','+0.4%'],['Amazon','AMZN','Stock','231.60','+0.9%'],['Alphabet','GOOGL','Stock','234.10','+0.3%'],['Meta','META','Stock','745.20','+1.1%'],['Tesla','TSLA','Stock','351.80','-0.5%'],['Amazon','AMZN','Stock','231.60','+0.9%']]
  },
  indices: {
    title: ['Índices', 'Indices'], label: ['Índices globales', 'Global indices'],
    items: [['S&P 500','SPX','Index','5,420.30','+0.4%'],['Nasdaq 100','NDX','Index','19,120.50','+0.7%'],['Dow Jones','DJI','Index','43,180.20','+0.2%'],['Russell 2000','RUT','Index','2,145.30','-0.3%'],['DAX','DAX','Index','18,520.40','+0.5%'],['FTSE 100','FTSE','Index','8,350.20','+0.1%'],['Nikkei 225','N225','Index','38,720.10','+0.8%'],['IBEX 35','IBEX','Index','11,240.60','-0.2%']]
  },
  commodities: {
    title: ['Materias primas', 'Commodities'], label: ['Materias primas globales', 'Global commodities'],
    items: [['Gold','XAU','Commodity','2,340.00 / oz','+0.3%'],['Silver','XAG','Commodity','30.10 / oz','+0.5%'],['WTI Oil','WTI','Commodity','78.20 / bbl','-0.4%'],['Brent Oil','BRENT','Commodity','82.40 / bbl','-0.2%'],['Natural Gas','NG','Commodity','2.21','+1.2%'],['Copper','HG','Commodity','4.12 / lb','+0.6%'],['Platinum','XPT','Commodity','985.20 / oz','+0.2%'],['Corn','ZC','Commodity','4.58 / bu','-0.1%']]
  }
};

const marketCards = data => data.map(([name,symbol,type,price,change]) => `<div class="card"><div><span>${type}</span><h3>${name}</h3><small>${symbol}</small></div><div class="price">${price}<i class="${change.startsWith('-')?'neg':''}">${change}</i></div><div class="spark">╱╲╱╲╱╲</div></div>`).join('');

function market(title, data, route) {
  return `<section class="market"><div class="sectionhead"><h2>${title}</h2><a class="viewall" href="#market/${route}">${t('Ver todos →','View all →')}</a></div><div class="grid">${marketCards(data)}</div></section>`;
}

function chartSVG(seed=0) {
  const paths = ['M0 105 C45 70 65 92 105 62 S165 90 205 48 S265 72 305 35 S360 62 420 22','M0 90 C50 102 75 55 120 72 S180 35 220 64 S285 42 330 50 S380 20 420 38'];
  return `<svg class="marketChart" viewBox="0 0 420 130" preserveAspectRatio="none" aria-label="${t('Gráfico histórico','Historical chart')}"><path class="chartGrid" d="M0 30H420M0 65H420M0 100H420"/><path class="chartLine" d="${paths[seed%2]}"/></svg>`;
}

function detailPage(route) {
  const data = datasets[route];
  if (!data) return home();
  const rows = data.items.map(([name,symbol,type,price,change],i) => `<div class="marketRow"><div><span>${type}</span><strong>${name}</strong><small>${symbol}</small></div><div class="rowChart">${chartSVG(i)}</div><strong>${price}</strong><i class="${change.startsWith('-')?'neg':''}">${change}</i></div>`).join('');
  document.getElementById('root').innerHTML = `<div class="app"><header id="siteHeader"><a class="logo" href="#"><b>EUDEXA<span>•</span></b></a><nav><a href="#markets">${t('Mercados','Markets')}</a><a href="#converter">${t('Convertidor','Converter')}</a><a href="#education">${t('Educación','Education')}</a></nav><div class="tools"><button id="searchToggle" aria-label="Search">⌕</button><button id="langToggle">${lang}</button><button id="themeToggle">${dark?'☀':'☾'}</button></div></header><main><div class="detailBack"><a href="#">← ${t('Volver al inicio','Back to home')}</a></div><section class="detailHero"><p class="eyebrow">${data.label[lang==='ES'?0:1].toUpperCase()}</p><h1>${data.title[lang==='ES'?0:1]}</h1><p class="sub">${t('Explora precios, variaciones y evolución de los principales activos de esta categoría.','Explore prices, changes and performance of the main assets in this category.')}</p></section><section class="detailSummary"><div><span>${t('Activos mostrados','Assets shown')}</span><strong>${data.items.length}</strong></div><div><span>${t('Última actualización','Last update')}</span><strong>—</strong></div><div><span>${t('Estado','Status')}</span><strong class="liveDot">● ${t('Demo','Demo')}</strong></div></section><section class="detailTable"><div class="tableHead"><span>${t('Activo','Asset')}</span><span>${t('Gráfico','Chart')}</span><span>${t('Precio','Price')}</span><span>${t('Cambio','Change')}</span></div>${rows}</section><div class="detailNote">${t('Los datos mostrados actualmente son de demostración. Las fuentes de datos de mercado en tiempo real se conectarán en una próxima fase.','The data shown is currently demo data. Real-time market data sources will be connected in a later phase.')}</div></main><footer><b>EUDEXA</b><p>Markets · Converter · Education · Privacy · Terms · Cookies · Disclaimer · Contact</p><small>${t('EUDEXA proporciona información y herramientas financieras con fines informativos y educativos. No constituye asesoramiento financiero, de inversión, fiscal o legal.','EUDEXA provides financial information and tools for informational and educational purposes. It is not financial, investment, tax or legal advice.')}</small><small>© 2026 EUDEXA</small></footer></div>`;
  bindCommon();
}

function home() {
  document.getElementById('root').innerHTML = `<div class="app"><header id="siteHeader"><a class="logo" href="#"><b>EUDEXA<span>•</span></b></a><nav><a href="#markets">${t('Mercados','Markets')}</a><a href="#converter">${t('Convertidor','Converter')}</a><a href="#education">${t('Educación','Education')}</a></nav><div class="tools"><button id="searchToggle" aria-label="Search">⌕</button><button id="langToggle">${lang}</button><button id="themeToggle">${dark?'☀':'☾'}</button></div></header><main><section class="hero"><div><p class="eyebrow">FINANCIAL INTELLIGENCE</p><h1>${t('Datos financieros globales, herramientas y educación.','Global financial data, tools and education.')}</h1><p class="sub">${t('Información clara para entender los mercados, sin recomendaciones de inversión.','Clear information to understand markets, without investment recommendations.')}</p></div><div class="status">● DEMO DATA<br><small>${t('Datos de demostración — no tiempo real','Demo data — not real time')}</small></div></section><section id="searchPanel" class="search hidden"><div class="searchbox"><span>⌕</span><input id="searchInput" placeholder="Bitcoin, Apple, Gold, EUR/USD..." autocomplete="off"><button id="searchClose" aria-label="Close search">×</button></div><div id="searchResults"></div></section><section id="converter" class="converter"><div><p class="eyebrow">${t('HERRAMIENTA PRINCIPAL','MAIN TOOL')}</p><h2>${t('Convertidor de divisas','Currency converter')}</h2><p>${t('Convierte entre monedas internacionales.','Convert between international currencies.')}</p></div><div class="convertbox"><label>${t('Cantidad','Amount')}<input id="amount" type="number" value="100"></label><div class="selects"><select id="from">${currencies.map(c=>`<option>${c}</option>`).join('')}</select><button class="swap" id="swap">⇄</button><select id="to">${currencies.map(c=>`<option ${c==='DOP'?'selected':''}>${c}</option>`).join('')}</select></div><div class="total"><span id="pair">USD → DOP</span><strong id="result">5,910 DOP</strong></div></div></section><div class="ad">ADVERTISEMENT · AdSlot reserved</div>${market(t('Tipos de cambio','Exchange rates'),datasets.forex.items.slice(0,4),'forex')}${market(t('Mercado cripto','Crypto market'),datasets.crypto.items.slice(0,4),'crypto')}<div class="ad">ADVERTISEMENT · AdSlot reserved</div><section id="markets">${market(t('Mercados financieros','Financial markets'),[...datasets.stocks.items.slice(0,2),...datasets.indices.items.slice(0,2)],'stocks')}${market(t('Materias primas','Commodities'),datasets.commodities.items.slice(0,4),'commodities')}</section><section id="education" class="education"><p class="eyebrow">LEARN</p><h2>${t('Educación financiera','Financial education')}</h2><div class="articles">${[['¿Qué es Bitcoin?','What is Bitcoin?','CRIPTOMONEDAS'],['¿Qué es la inflación?','What is inflation?','ECONOMÍA'],['¿Qué es el S&P 500?','What is the S&P 500?','BOLSA'],['¿Qué son las acciones?','What are stocks?','FINANZAS']].map(([es,en,category])=>`<article><span>${category}</span><h3>${t(es,en)}</h3><p>${t('Guía educativa y neutral para comprender conceptos financieros.','A neutral educational guide to understanding financial concepts.')}</p><a href="#education">${t('Leer artículo →','Read article →')}</a></article>`).join('')}</div></section></main><footer><b>EUDEXA</b><p>Markets · Converter · Education · Privacy · Terms · Cookies · Disclaimer · Contact</p><small>${t('EUDEXA proporciona información y herramientas financieras con fines informativos y educativos. No constituye asesoramiento financiero, de inversión, fiscal o legal.','EUDEXA provides financial information and tools for informational and educational purposes. It is not financial, investment, tax or legal advice.')}</small><small>© 2026 EUDEXA</small></footer><button class="calcb" id="calcToggle" aria-label="Open calculator">🧮</button><div id="calculator" class="calculator hidden" aria-hidden="true"><div class="calcTop"><div><span class="calcLabel">EUDEXA</span><strong>${t('Calculadora','Calculator')}</strong></div><button id="calcClose" aria-label="Close calculator">×</button></div><input id="calcDisplay" readonly placeholder="0"><div class="calcKeys">${['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','+','='].map(k=>`<button data-key="${k}">${k}</button>`).join('')}</div><button class="clear" id="calcClear">${t('Limpiar','Clear')}</button></div></div>`;
  bindCommon();
  updateConverter();
  bindCalculator();
}

function bindCommon() {
  document.getElementById('themeToggle').onclick=()=>{dark=!dark;render();};
  document.getElementById('langToggle').onclick=()=>{lang=lang==='ES'?'EN':'ES';render();};
  document.getElementById('searchToggle').onclick=()=>{const p=document.getElementById('searchPanel');if(p){p.classList.toggle('hidden');if(!p.classList.contains('hidden'))document.getElementById('searchInput').focus();}};
  const close=document.getElementById('searchClose'); if(close) close.onclick=()=>document.getElementById('searchPanel').classList.add('hidden');
  const input=document.getElementById('searchInput'); if(input) input.oninput=search;
}
function bindCalculator(){const c=document.getElementById('calculator');if(!c)return;document.getElementById('calcToggle').onclick=()=>{const hidden=c.classList.toggle('hidden');c.setAttribute('aria-hidden',String(hidden));};document.getElementById('calcClose').onclick=e=>{e.preventDefault();e.stopPropagation();c.classList.add('hidden');c.setAttribute('aria-hidden','true');};document.getElementById('calcClear').onclick=()=>document.getElementById('calcDisplay').value='';document.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>calculatorKey(b.dataset.key));}
function updateConverter(){const amount=Number(document.getElementById('amount')?.value)||0;const from=document.getElementById('from')?.value;const to=document.getElementById('to')?.value;if(!from||!to)return;const result=amount/rates[from]*rates[to];document.getElementById('pair').textContent=`${from} → ${to}`;document.getElementById('result').textContent=`${new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(result)} ${to}`;}
function search(){const q=document.getElementById('searchInput').value.trim().toLowerCase();const results=assets.filter(a=>a.join(' ').toLowerCase().includes(q));document.getElementById('searchResults').innerHTML=q?results.map(a=>`<div class="result"><b>${a[0]}</b><span>${a[2]} · ${a[1]}</span><strong>${a[3]} <i class="${a[4].startsWith('-')?'neg':''}">${a[4]}</i></strong></div>`).join(''):'';}
function calculatorKey(key){const d=document.getElementById('calcDisplay');if(key!=='='){d.value+=key;return;}try{const safe=d.value.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');if(!/^[0-9+\-*/.() ]+$/.test(safe))throw Error();d.value=String(Function(`"use strict"; return (${safe})`)());}catch{d.value='Error';}}
function render(){document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('theme',dark?'dark':'light');localStorage.setItem('lang',lang);const route=location.hash.replace('#market/','');if(location.hash.startsWith('#market/')&&datasets[route])detailPage(route);else home();}
window.addEventListener('hashchange',()=>{lastScrollY=0;render();window.scrollTo({top:0,behavior:'smooth'});});
window.addEventListener('scroll',()=>{const current=window.scrollY;const header=document.getElementById('siteHeader');const searchPanel=document.getElementById('searchPanel');if(!header)return;if(current>lastScrollY+6&&current>90){header.classList.add('scroll-hide');if(searchPanel)searchPanel.classList.add('scroll-hide');}else if(current<lastScrollY-6){header.classList.remove('scroll-hide');if(searchPanel)searchPanel.classList.remove('scroll-hide');}lastScrollY=Math.max(current,0);},{passive:true});

function bindHomeConverter(){['amount','from','to'].forEach(id=>document.getElementById(id)?.addEventListener('input',updateConverter));document.getElementById('swap')?.addEventListener('click',()=>{const f=document.getElementById('from'),to=document.getElementById('to');[f.value,to.value]=[to.value,f.value];updateConverter();});}
const originalHome=home;
home=function(){originalHome();bindHomeConverter();};
render();