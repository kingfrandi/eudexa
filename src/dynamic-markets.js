const API = '/api/assets';

function formatPrice(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const n = Number(value);
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 8 });
}

function formatChange(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const n = Number(value);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function cryptoRows(assets) {
  return assets.map((asset, index) => {
    const change = formatChange(asset.change);
    const negative = change.startsWith('-') ? 'neg' : '';
    const symbol = String(asset.symbol || '').toUpperCase();
    return `<div class="marketRow" data-market-asset="${String(asset.name || '').replace(/"/g, '&quot;')}">
      <div><span>Crypto</span><strong>${asset.name || '—'}</strong><small>${symbol}</small></div>
      <div class="rowChart"><svg class="marketChart" viewBox="0 0 420 130" preserveAspectRatio="none"><path class="chartGrid" d="M0 30H420M0 65H420M0 100H420"/><path class="chartLine" d="M0 ${85 - (index % 20)} C50 ${105 - (index % 15)} 90 ${45 + (index % 25)} 140 ${70 - (index % 18)} S230 ${35 + (index % 30)} 280 ${62 - (index % 20)} S350 ${28 + (index % 25)} 420 ${45 + (index % 18)}"/></svg></div>
      <strong>${formatPrice(asset.price)}</strong>
      <i class="${negative}">${change}</i>
    </div>`;
  }).join('');
}

async function loadDynamicCrypto() {
  const match = window.location.hash.match(/^#market\/(.+)$/);
  if (!match || match[1] !== 'crypto') return;

  const table = document.querySelector('.detailTable');
  if (!table) return;

  const summary = document.querySelector('.detailSummary strong');
  const note = document.querySelector('.detailNote');
  table.innerHTML = '<div class="tableHead"><span>Activo</span><span>Gráfico</span><span>Precio</span><span>Cambio 24h</span></div><div class="dynamicLoading">Cargando criptomonedas...</div>';

  try {
    const response = await fetch(`${API}?market=crypto`, { cache: 'no-store' });
    if (!response.ok) throw new Error('API assets unavailable');
    const payload = await response.json();
    const assets = Array.isArray(payload.assets) ? payload.assets.filter(a => a.type === 'Crypto') : [];
    if (!assets.length) throw new Error('No crypto assets returned');

    table.innerHTML = '<div class="tableHead"><span>Activo</span><span>Gráfico</span><span>Precio</span><span>Cambio 24h</span></div>' + cryptoRows(assets);
    if (summary) summary.textContent = assets.length.toLocaleString('en-US');
    if (note) note.textContent = `Mostrando ${assets.length.toLocaleString('en-US')} criptomonedas obtenidas automáticamente desde el catálogo de mercado. Los precios y variaciones dependen de la disponibilidad de la fuente de datos.`;
  } catch (error) {
    table.innerHTML = '<div class="tableHead"><span>Activo</span><span>Gráfico</span><span>Precio</span><span>Cambio 24h</span></div><div class="dynamicLoading">No se pudo cargar el catálogo dinámico de criptomonedas. Se mantienen los datos disponibles en la página.</div>';
  }
}

function scheduleDynamicCrypto() {
  window.setTimeout(loadDynamicCrypto, 80);
}

window.addEventListener('hashchange', scheduleDynamicCrypto);
window.addEventListener('DOMContentLoaded', scheduleDynamicCrypto);
scheduleDynamicCrypto();
