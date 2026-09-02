const FX_API = 'https://open.er-api.com/v6/latest/USD';
const FX_REFRESH_MS = 5 * 60 * 1000;
let fxRates = null;
let fxUpdatedAt = null;
let fxLoading = false;
let lastFxSignature = '';

async function loadLiveFxRates() {
  if (fxLoading) return;
  fxLoading = true;
  try {
    const response = await fetch(`${FX_API}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`FX HTTP ${response.status}`);
    const data = await response.json();
    if (data.result !== 'success' || !data.rates) throw new Error('FX provider returned no rates');
    fxRates = data.rates;
    fxUpdatedAt = data.time_last_update_utc || new Date().toISOString();
    updateLiveConverter();
  } catch (error) {
    console.warn('EUDEXA FX: no se pudieron cargar las tasas en vivo.', error);
    // Keep the last successful live rates instead of replacing them with demo/blank data.
    updateLiveConverter();
  } finally {
    fxLoading = false;
  }
}

function getConverterElements() {
  return {
    amount: document.getElementById('amount'),
    from: document.getElementById('from'),
    to: document.getElementById('to'),
    result: document.getElementById('result'),
    pair: document.getElementById('pair')
  };
}

function updateLiveConverter() {
  const { amount, from, to, result, pair } = getConverterElements();
  if (!amount || !from || !to || !result || !pair) return;

  const f = from.value;
  const t = to.value;
  const value = Number(amount.value) || 0;
  pair.textContent = `${f} → ${t}`;

  if (!fxRates || fxRates[f] == null || fxRates[t] == null) {
    if (fxLoading) {
      result.textContent = 'Cargando…';
      result.title = 'Cargando la tasa de cambio actual.';
    } else {
      result.textContent = '—';
      result.title = 'Esta moneda no tiene una tasa vigente disponible en la fuente de datos.';
    }
    return;
  }

  // All rates share USD as their base, so any pair can be calculated directly:
  // amount × (USD→target) ÷ (USD→source).
  const converted = value * (fxRates[t] / fxRates[f]);
  result.textContent = `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(converted)} ${t}`;
  result.title = fxUpdatedAt ? `Tasa en vivo. Fuente actualizada: ${fxUpdatedAt}` : 'Tasa en vivo';
}

function bindLiveConverter() {
  const { amount, from, to } = getConverterElements();
  if (!amount || !from || !to) return;

  const signature = `${from.options.length}|${to.options.length}|${from.value}|${to.value}`;
  if (signature === lastFxSignature) {
    updateLiveConverter();
    return;
  }
  lastFxSignature = signature;

  [amount, from, to].forEach((element) => {
    if (element.dataset.fxLiveBound === '1') return;
    element.dataset.fxLiveBound = '1';
    element.addEventListener('input', updateLiveConverter);
    element.addEventListener('change', updateLiveConverter);
  });

  // The original converter has a swap button. Rebind it so the live calculation
  // always runs immediately after the pair is inverted.
  const swap = document.getElementById('swap');
  if (swap && swap.dataset.fxLiveBound !== '1') {
    swap.dataset.fxLiveBound = '1';
    swap.addEventListener('click', () => setTimeout(updateLiveConverter, 0));
  }
  updateLiveConverter();
}

function refreshCurrencyOptionsFromLiveRates() {
  const { from, to } = getConverterElements();
  if (!from || !to || !fxRates) return;

  // Only leave currencies for which the live provider has a current rate.
  // This prevents selectable currencies from ever producing a fake/undefined result.
  const available = new Set(Object.keys(fxRates));
  const rebuild = (select) => {
    const selected = select.value;
    const options = [...select.options].filter(option => available.has(option.value));
    if (!options.length) return;
    select.innerHTML = options.map(option => `<option value="${option.value}">${option.textContent}</option>`).join('');
    if (available.has(selected)) select.value = selected;
  };

  rebuild(from);
  rebuild(to);
  lastFxSignature = '';
  bindLiveConverter();
}

function initLiveFx() {
  bindLiveConverter();
  loadLiveFxRates().then(refreshCurrencyOptionsFromLiveRates);
  setInterval(async () => {
    await loadLiveFxRates();
    refreshCurrencyOptionsFromLiveRates();
  }, FX_REFRESH_MS);
}

const fxObserver = new MutationObserver(() => {
  const { from, to } = getConverterElements();
  if (from && to) bindLiveConverter();
});

if (document.body) fxObserver.observe(document.body, { childList: true, subtree: true });
window.addEventListener('hashchange', () => setTimeout(bindLiveConverter, 0));
initLiveFx();
