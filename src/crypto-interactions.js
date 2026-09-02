const MARKET_ASSETS = {
  Bitcoin: { symbol: 'BTC', code: 'BTC', source: 'Binance', provider: 'binance', asset: 'Bitcoin' },
  Ethereum: { symbol: 'ETH', code: 'ETH', source: 'Binance', provider: 'binance', asset: 'Ethereum' },
  Tether: { symbol: 'USDT', code: 'USDT', source: 'Binance', provider: 'binance', asset: 'Tether' },
  Solana: { symbol: 'SOL', code: 'SOL', source: 'Binance', provider: 'binance', asset: 'Solana' },
  BNB: { symbol: 'BNB', code: 'BNB', source: 'Binance', provider: 'binance', asset: 'BNB' },
  XRP: { symbol: 'XRP', code: 'XRP', source: 'Binance', provider: 'binance', asset: 'XRP' },
  Cardano: { symbol: 'ADA', code: 'ADA', source: 'Binance', provider: 'binance', asset: 'Cardano' },
  Dogecoin: { symbol: 'DOGE', code: 'DOGE', source: 'Binance', provider: 'binance', asset: 'Dogecoin' },
  Avalanche: { symbol: 'AVAX', code: 'AVAX', source: 'Binance', provider: 'binance', asset: 'Avalanche' },
  Chainlink: { symbol: 'LINK', code: 'LINK', source: 'Binance', provider: 'binance', asset: 'Chainlink' },
  Polkadot: { symbol: 'DOT', code: 'DOT', source: 'Binance', provider: 'binance', asset: 'Polkadot' },
  Polygon: { symbol: 'POL', code: 'POL', source: 'Binance', provider: 'binance', asset: 'Polygon' }
};

const PERIODS = { '30D': 30, '90D': 90, '1Y': 365 };
let marketPeriod = '30D';

function findAsset(name) {
  return MARKET_ASSETS[name] || null;
}

function ensureStyles() {
  if (document.getElementById('marketFixStyles')) return;
  const style = document.createElement('style');
  style.id = 'marketFixStyles';
  style.textContent = '.market-loading{display:flex;align-items:center;justify-content:center;height:390px;opacity:.7;font-weight:700}.market-error{display:flex;align-items:center;justify-content:center;text-align:center;height:390px;padding:25px;opacity:.75;font-weight:700}';
  document.head.appendChild(style);
}

function ensureModal() {
  if (document.getElementById('marketModal')) return;
  const modal = document.createElement('div');
  modal.id = 'marketModal';
  modal.className = 'market-modal hidden';
  modal.innerHTML = `
    <div class="market-panel">
      <div class="market-head">
        <div class="market-title">
          <span class="market-code" id="marketModalCode">MARKET</span>
          <h2 id="marketModalTitle">Asset</h2>
        </div>
        <button class="market-close" id="marketModalClose">×</button>
      </div>
      <div class="market-head" style="margin-top:10px">
        <div><span id="marketPeriodLabel">Historical market data</span></div>
        <div>
          <div class="market-price" id="marketModalPrice">—</div>
          <div class="market-change" id="marketModalChange">—</div>
        </div>
      </div>
      <div class="market-periods">
        ${Object.keys(PERIODS).map(period => `<button class="market-period${period === '30D' ? ' active' : ''}" data-period="${period}">${period}</button>`).join('')}
      </div>
      <div id="marketChartArea" class="market-chart">
        <div class="market-loading">Cargando datos reales…</div>
      </div>
      <div class="market-meta">
        <span id="marketSource">Source: —</span>
        <span id="marketUpdated">—</span>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('marketModalClose').onclick = () => modal.classList.add('hidden');
  modal.onclick = event => {
    if (event.target === modal) modal.classList.add('hidden');
  };
  modal.querySelectorAll('.market-period').forEach(button => {
    button.onclick = () => {
      marketPeriod = button.dataset.period;
      modal.querySelectorAll('.market-period').forEach(item => item.classList.toggle('active', item === button));
      loadHistory(document.getElementById('marketModalTitle').textContent.trim());
    };
  });
}

function buildChart(points) {
  const width = 900;
  const height = 390;
  const padding = 46;
  const values = points.map(point => point[1]).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.max(Math.abs(max) * 0.01, 1);
  const x = index => padding + index * ((width - padding * 2) / Math.max(values.length - 1, 1));
  const y = value => height - padding - ((value - min) / range) * (height - padding * 2);
  const path = values.map((value, index) => `${index ? 'L' : 'M'}${x(index).toFixed(2)} ${y(value).toFixed(2)}`).join(' ');
  const area = `${path} L${x(values.length - 1)} ${height - padding} L${x(0)} ${height - padding} Z`;
  const last = values[values.length - 1];
  const first = values[0];
  const change = first ? ((last - first) / first) * 100 : 0;
  return {
    svg: `<svg class="market-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><path d="${area}" fill="currentColor" opacity=".08"/><path d="${path}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="${x(values.length - 1)}" cy="${y(last)}" r="5" fill="currentColor"/></svg>`,
    last,
    change
  };
}

async function getHistory(info) {
  const response = await fetch(`/api/market?asset=${encodeURIComponent(info.asset)}&period=${encodeURIComponent(marketPeriod)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Market API unavailable');
  const data = await response.json();
  if (!Array.isArray(data.points)) throw new Error('No historical data');
  return data.points.map(point => [Number(point[0]), Number(point[1])]).filter(point => Number.isFinite(point[0]) && Number.isFinite(point[1]));
}

async function loadHistory(name) {
  const info = findAsset(name);
  const area = document.getElementById('marketChartArea');
  if (!info || !area) return;

  area.innerHTML = '<div class="market-loading">Cargando precio y gráfico real…</div>';
  document.getElementById('marketModalPrice').textContent = '—';
  document.getElementById('marketModalChange').textContent = '—';

  try {
    const points = await getHistory(info);
    if (!points.length) throw new Error('Empty history');
    const chart = buildChart(points);
    area.innerHTML = chart.svg;
    document.getElementById('marketModalPrice').textContent = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: chart.last < 1 ? 6 : 2
    }).format(chart.last);
    document.getElementById('marketModalChange').textContent = `${chart.change >= 0 ? '+' : ''}${chart.change.toFixed(2)}% ${marketPeriod}`;
    document.getElementById('marketSource').textContent = 'Source: Binance';
    document.getElementById('marketUpdated').textContent = `Actualizado: ${new Date().toLocaleString()}`;
    document.getElementById('marketPeriodLabel').textContent = marketPeriod === '1Y' ? 'Histórico de 1 año' : `Histórico de ${marketPeriod.replace('D', ' días')}`;
  } catch (error) {
    area.innerHTML = '<div class="market-error">No se pudo cargar el precio ni el histórico en este momento.<br><br>Inténtalo de nuevo en unos segundos.</div>';
    document.getElementById('marketSource').textContent = 'Source: —';
    document.getElementById('marketUpdated').textContent = '—';
  }
}

function openMarket(name) {
  ensureModal();
  const info = findAsset(name);
  if (!info) return;
  document.getElementById('marketModalTitle').textContent = name;
  document.getElementById('marketModalCode').textContent = info.code;
  document.getElementById('marketModal').classList.remove('hidden');
  loadHistory(name);
}

function bindCards() {
  ensureStyles();
  ensureModal();
  document.querySelectorAll('.card, .marketRow').forEach(card => {
    const title = card.querySelector('h3, strong');
    const name = title?.textContent?.trim();
    if (!findAsset(name)) return;
    card.classList.add('market-clickable');
    card.onclick = () => openMarket(name);
  });
}

new MutationObserver(bindCards).observe(document.body, { childList: true, subtree: true });
bindCards();
