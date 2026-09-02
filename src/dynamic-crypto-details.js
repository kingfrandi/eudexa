let currentCrypto = null;

function drawCryptoChart(points) {
  const values = points.map(p => p[1]).filter(Number.isFinite);
  if (!values.length) return '<div class="market-error">No hay datos históricos disponibles.</div>';
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const pointsAttr = values.map((v,i) => (i * 900 / Math.max(values.length-1,1)).toFixed(1) + ',' + (350 - ((v-min)/range)*320).toFixed(1)).join(' ');
  return '<svg class="market-chart" viewBox="0 0 900 390" preserveAspectRatio="none"><polyline points="' + pointsAttr + '" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}

async function showCrypto(name, id, period) {
  const modal = document.getElementById('marketModal');
  if (!modal || !id) return;
  currentCrypto = {name, id};
  modal.classList.remove('hidden');
  document.getElementById('marketModalTitle').textContent = name;
  document.getElementById('marketModalCode').textContent = id;
  const area = document.getElementById('marketChartArea');
  area.innerHTML = '<div class="market-loading">Cargando datos reales…</div>';
  try {
    const response = await fetch('/api/crypto-chart?id=' + encodeURIComponent(id) + '&period=' + encodeURIComponent(period), {cache:'no-store'});
    if (!response.ok) throw new Error('unavailable');
    const data = await response.json();
    area.style.color = data.change >= 0 ? '#15803d' : '#b42318';
    area.innerHTML = drawCryptoChart(data.points);
    document.getElementById('marketModalPrice').textContent = Number(data.price).toLocaleString('en-US',{maximumFractionDigits:8});
    document.getElementById('marketModalChange').textContent = (data.change >= 0 ? '+' : '') + data.change.toFixed(2) + '% ' + period;
    document.getElementById('marketSource').textContent = 'Source: ' + data.source;
    document.getElementById('marketUpdated').textContent = 'Actualizado: ' + new Date(data.updated).toLocaleString();
    document.querySelectorAll('#marketModal .market-period').forEach(b => b.classList.toggle('active', b.dataset.period === period));
  } catch (error) {
    area.innerHTML = '<div class="market-error">No se pudo cargar el historial de esta criptomoneda.</div>';
  }
}

document.addEventListener('click', (e) => {
  const row = e.target.closest?.('.marketRow[data-market-crypto-id]');
  if (row) {
    e.preventDefault();
    e.stopPropagation();
    showCrypto(row.dataset.marketAsset, row.dataset.marketCryptoId, '30D');
    return;
  }
  const period = e.target.closest?.('#marketModal .market-period');
  if (period && currentCrypto) {
    e.preventDefault();
    e.stopPropagation();
    showCrypto(currentCrypto.name, currentCrypto.id, period.dataset.period || '30D');
  }
}, true);
