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
const marketCards = (data) => data.map(([name, symbol, type, price, change]) => `
  <div class="card">
    <div><span>${type}</span><h3>${name}</h3><small>${symbol}</small></div>
    <div class="price">${price}<i class="${change.startsWith('-') ? 'neg' : ''}">${change}</i></div>
    <div class="spark">╱╲╱╲╱╲</div>
  </div>
`).join('');

function market(title, data) {
  return `
    <section class="market">
      <div class="sectionhead"><h2>${title}</h2><a href="#markets">${t('Ver todos →', 'View all →')}</a></div>
      <div class="grid">${marketCards(data)}</div>
    </section>
  `;
}

function render() {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  localStorage.setItem('lang', lang);

  document.getElementById('root').innerHTML = `
    <div class="app">
      <header id="siteHeader">
        <b class="logo">EUDEXA<span>•</span></b>
        <nav>
          <a href="#markets">${t('Mercados', 'Markets')}</a>
          <a href="#converter">${t('Convertidor', 'Converter')}</a>
          <a href="#education">${t('Educación', 'Education')}</a>
        </nav>
        <div class="tools">
          <button id="searchToggle" aria-label="Search">⌕</button>
          <button id="langToggle">${lang}</button>
          <button id="themeToggle">${dark ? '☀' : '☾'}</button>
        </div>
      </header>

      <main>
        <section class="hero">
          <div>
            <p class="eyebrow">FINANCIAL INTELLIGENCE</p>
            <h1>${t('Datos financieros globales, herramientas y educación.', 'Global financial data, tools and education.')}</h1>
            <p class="sub">${t('Información clara para entender los mercados, sin recomendaciones de inversión.', 'Clear information to understand markets, without investment recommendations.')}</p>
          </div>
          <div class="status">● DEMO DATA<br><small>${t('Datos de demostración — no tiempo real', 'Demo data — not real time')}</small></div>
        </section>

        <section id="searchPanel" class="search hidden">
          <div class="searchbox"><span>⌕</span><input id="searchInput" placeholder="Bitcoin, Apple, Gold, EUR/USD..." autocomplete="off"><button id="searchClose" aria-label="Close search">×</button></div>
          <div id="searchResults"></div>
        </section>

        <section id="converter" class="converter">
          <div>
            <p class="eyebrow">${t('HERRAMIENTA PRINCIPAL', 'MAIN TOOL')}</p>
            <h2>${t('Convertidor de divisas', 'Currency converter')}</h2>
            <p>${t('Convierte entre monedas internacionales.', 'Convert between international currencies.')}</p>
          </div>
          <div class="convertbox">
            <label>${t('Cantidad', 'Amount')}<input id="amount" type="number" value="100"></label>
            <div class="selects">
              <select id="from">${currencies.map(c => `<option>${c}</option>`).join('')}</select>
              <button class="swap" id="swap">⇄</button>
              <select id="to">${currencies.map(c => `<option ${c === 'DOP' ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
            <div class="total"><span id="pair">USD → DOP</span><strong id="result">5,910 DOP</strong></div>
          </div>
        </section>

        <div class="ad">ADVERTISEMENT · AdSlot reserved</div>

        ${market(t('Tipos de cambio', 'Exchange rates'), [
          ['USD / EUR', 'EURUSD', 'Forex', '0.9200', '+0.1%'],
          ['USD / DOP', 'USDDOP', 'Forex', '59.10', '+0.2%'],
          ['GBP / USD', 'GBPUSD', 'Forex', '1.2820', '-0.1%'],
          ['USD / JPY', 'USDJPY', 'Forex', '156.40', '+0.3%']
        ])}

        ${market(t('Mercado cripto', 'Crypto market'), [
          ...assets.slice(0, 2),
          ['Tether', 'USDT', 'Crypto', '1.00', '0.0%'],
          ['Solana', 'SOL', 'Crypto', '156.20', '+3.1%']
        ])}

        <div class="ad">ADVERTISEMENT · AdSlot reserved</div>

        <section id="markets">
          ${market(t('Mercados financieros', 'Financial markets'), assets.filter(a => ['Stock', 'Index'].includes(a[2])))}
          ${market(t('Materias primas', 'Commodities'), [
            ['Gold', 'XAU', 'Commodity', '2,340.00 / oz', '+0.3%'],
            ['Silver', 'XAG', 'Commodity', '30.10 / oz', '+0.5%'],
            ['WTI Oil', 'WTI', 'Commodity', '78.20 / bbl', '-0.4%'],
            ['Natural Gas', 'NG', 'Commodity', '2.21', '+1.2%']
          ])}
        </section>

        <section id="education" class="education">
          <p class="eyebrow">LEARN</p>
          <h2>${t('Educación financiera', 'Financial education')}</h2>
          <div class="articles">
            ${[
              ['¿Qué es Bitcoin?', 'What is Bitcoin?', 'CRIPTOMONEDAS'],
              ['¿Qué es la inflación?', 'What is inflation?', 'ECONOMÍA'],
              ['¿Qué es el S&P 500?', 'What is the S&P 500?', 'BOLSA'],
              ['¿Qué son las acciones?', 'What are stocks?', 'FINANZAS']
            ].map(([es, en, category]) => `
              <article><span>${category}</span><h3>${t(es, en)}</h3><p>${t('Guía educativa y neutral para comprender conceptos financieros.', 'A neutral educational guide to understanding financial concepts.')}</p><a href="#education">${t('Leer artículo →', 'Read article →')}</a></article>
            `).join('')}
          </div>
        </section>
      </main>

      <footer>
        <b>EUDEXA</b>
        <p>Markets · Converter · Education · Privacy · Terms · Cookies · Disclaimer · Contact</p>
        <small>${t('EUDEXA proporciona información y herramientas financieras con fines informativos y educativos. No constituye asesoramiento financiero, de inversión, fiscal o legal.', 'EUDEXA provides financial information and tools for informational and educational purposes. It is not financial, investment, tax or legal advice.')}</small>
        <small>© 2026 EUDEXA</small>
      </footer>

      <button class="calcb" id="calcToggle" aria-label="Open calculator">🧮</button>
      <div id="calculator" class="calculator hidden" aria-hidden="true">
        <div class="calcTop"><div><span class="calcLabel">EUDEXA</span><strong>${t('Calculadora', 'Calculator')}</strong></div><button id="calcClose" aria-label="Close calculator">×</button></div>
        <input id="calcDisplay" readonly placeholder="0">
        <div class="calcKeys">${['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','+','='].map(k => `<button data-key="${k}">${k}</button>`).join('')}</div>
        <button class="clear" id="calcClear">${t('Limpiar', 'Clear')}</button>
      </div>
    </div>
  `;

  bindEvents();
  updateConverter();
}

function bindEvents() {
  document.getElementById('themeToggle').onclick = () => { dark = !dark; render(); };
  document.getElementById('langToggle').onclick = () => { lang = lang === 'ES' ? 'EN' : 'ES'; render(); };
  document.getElementById('searchToggle').onclick = () => {
    const panel = document.getElementById('searchPanel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) document.getElementById('searchInput').focus();
  };
  document.getElementById('searchClose').onclick = () => document.getElementById('searchPanel').classList.add('hidden');
  document.getElementById('searchInput').oninput = search;

  ['amount', 'from', 'to'].forEach(id => document.getElementById(id).addEventListener('input', updateConverter));
  document.getElementById('swap').onclick = () => {
    const from = document.getElementById('from');
    const to = document.getElementById('to');
    [from.value, to.value] = [to.value, from.value];
    updateConverter();
  };

  const calculator = document.getElementById('calculator');
  document.getElementById('calcToggle').onclick = () => {
    const hidden = calculator.classList.toggle('hidden');
    calculator.setAttribute('aria-hidden', String(hidden));
    if (!hidden) document.getElementById('calcDisplay').focus();
  };
  document.getElementById('calcClose').onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    calculator.classList.add('hidden');
    calculator.setAttribute('aria-hidden', 'true');
  };
  document.getElementById('calcClear').onclick = () => { document.getElementById('calcDisplay').value = ''; };
  document.querySelectorAll('[data-key]').forEach(button => button.onclick = () => calculatorKey(button.dataset.key));
}

function updateConverter() {
  const amount = Number(document.getElementById('amount').value) || 0;
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const result = amount / rates[from] * rates[to];
  document.getElementById('pair').textContent = `${from} → ${to}`;
  document.getElementById('result').textContent = `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(result)} ${to}`;
}

function search() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const results = assets.filter(a => a.join(' ').toLowerCase().includes(query));
  document.getElementById('searchResults').innerHTML = query ? results.map(a => `<div class="result"><b>${a[0]}</b><span>${a[2]} · ${a[1]}</span><strong>${a[3]} <i class="${a[4].startsWith('-') ? 'neg' : ''}">${a[4]}</i></strong></div>`).join('') : '';
}

function calculatorKey(key) {
  const display = document.getElementById('calcDisplay');
  if (key !== '=') { display.value += key; return; }
  try {
    const safe = display.value.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
    if (!/^[0-9+\-*/.() ]+$/.test(safe)) throw new Error('Invalid expression');
    display.value = String(Function(`"use strict"; return (${safe})`)());
  } catch { display.value = 'Error'; }
}

window.addEventListener('scroll', () => {
  const current = window.scrollY;
  const header = document.getElementById('siteHeader');
  const searchPanel = document.getElementById('searchPanel');
  if (!header || !searchPanel) return;

  if (current > lastScrollY + 6 && current > 90) {
    header.classList.add('scroll-hide');
    searchPanel.classList.add('scroll-hide');
  } else if (current < lastScrollY - 6) {
    header.classList.remove('scroll-hide');
    searchPanel.classList.remove('scroll-hide');
  }
  lastScrollY = Math.max(current, 0);
}, { passive: true });

render();
