document.addEventListener('click', async (e) => {
  const row = e.target.closest?.('.marketRow[data-market-crypto-id]');
  if (!row) return;
  e.preventDefault();
  e.stopPropagation();
  const id = row.dataset.marketCryptoId;
  const name = row.dataset.marketAsset;
  const modal = document.getElementById('marketModal');
  if (!modal || !id) return;
  modal.classList.remove('hidden');
  document.getElementById('marketModalTitle').textContent = name;
  document.getElementById('marketModalCode').textContent = id;
  const area = document.getElementById('marketChartArea');
  area.innerHTML = '<div class="market-loading">Cargando datos reales…</div>';
  try {
    const response = await fetch('/api/crypto-chart?id=' + encodeURIComponent(id) + '&period=30D', {cache:'no-store'});
    if (!response.ok) throw new Error('unavailable');
    const data = await response.json();
    const values = data.points.map(p => p[1]).filter(Number.isFinite);
    const min = Math.min(...values), max = Math.max(...values), range = max-min || 1;
    const points = values.map((v,i) => (i * 900 / Math.max(values.length-1,1)).toFixed(1) + ',' + (350 - ((v-min)/range)*320).toFixed(1)).join(' ');
    area.innerHTML = '<svg class="market-chart" viewBox="0 0 900 390" preserveAspectRatio="none"><polyline points="' + points + '" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
    area.style.color = data.change >= 0 ? '#15803d' : '#b42318';
    document.getElementById('marketModalPrice').textContent = Number(data.price).toLocaleString('en-US',{maximumFractionDigits:8});
    document.getElementById('marketModalChange').textContent = (data.change >= 0 ? '+' : '') + data.change.toFixed(2) + '% 30D';
    document.getElementById('marketSource').textContent = 'Source: ' + data.source;
    document.getElementById('marketUpdated').textContent = 'Actualizado: ' + new Date(data.updated).toLocaleString();
  } catch (error) {
    area.innerHTML = '<div class="market-error">No se pudo cargar el historial de esta criptomoneda.</div>';
  }
}, true);
