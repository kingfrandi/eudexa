import './news.css';

(() => {
  const categories = [
    ['all', 'Todas', 'All'],
    ['financial_markets', 'Mercados', 'Markets'],
    ['blockchain', 'Cripto', 'Crypto'],
    ['earnings', 'Bolsa', 'Stocks'],
    ['economy_fiscal', 'Economía', 'Economy'],
    ['economy_monetary', 'Divisas', 'Forex'],
    ['finance', 'Materias primas', 'Commodities']
  ];

  let activeTopic = 'all';
  let lang = localStorage.getItem('lang') || 'ES';
  let articles = [];
  let loading = false;

  const t = (es, en) => lang === 'ES' ? es : en;
  const esc = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(lang === 'ES' ? 'es-DO' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function createSection() {
    if (document.getElementById('news')) return document.getElementById('news');
    const education = document.getElementById('education');
    if (!education || !education.parentNode) return null;
    const section = document.createElement('section');
    section.id = 'news';
    section.className = 'newsSection';
    education.parentNode.insertBefore(section, education);
    return section;
  }

  function render() {
    const section = createSection();
    if (!section) return;
    section.innerHTML = `
      <div class="newsHeader">
        <div>
          <p class="eyebrow">${t('ACTUALIDAD FINANCIERA', 'FINANCIAL NEWS')}</p>
          <h2>${t('Noticias financieras', 'Financial news')}</h2>
          <p class="newsIntro">${t('Una selección de noticias de mercados, economía, bolsa, cripto y divisas. Información neutral y con enlace a la fuente original.', 'A selection of market, economy, stocks, crypto and forex news. Neutral information with a link to the original source.')}</p>
        </div>
        <button class="newsRefresh" id="newsRefresh" type="button">↻ ${t('Actualizar', 'Refresh')}</button>
      </div>
      <div class="newsTabs" role="tablist">${categories.map(([key, es, en]) => `<button class="newsTab ${activeTopic === key ? 'active' : ''}" data-topic="${key}" type="button">${t(es, en)}</button>`).join('')}</div>
      <div id="newsGrid" class="newsGrid" aria-live="polite"></div>
    `;

    section.querySelectorAll('.newsTab').forEach(button => {
      button.onclick = () => {
        activeTopic = button.dataset.topic;
        render();
        loadNews();
      };
    });
    section.querySelector('#newsRefresh').onclick = loadNews;
    renderArticles();
  }

  function renderArticles() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    if (loading) {
      grid.innerHTML = Array.from({ length: 6 }, () => '<article class="newsCard skeleton"><div class="skLine wide"></div><div class="skLine"></div><div class="skLine short"></div><div class="skBottom"></div></article>').join('');
      return;
    }
    if (!articles.length) {
      grid.innerHTML = `<div class="newsEmpty">${t('No hay noticias disponibles en este momento.', 'No news is available right now.')}</div>`;
      return;
    }
    grid.innerHTML = articles.map((article, index) => `
      <article class="newsCard ${index === 0 ? 'featured' : ''}">
        <div class="newsCardTop"><span class="newsBadge">${esc(article.source)}</span><time datetime="${esc(article.time)}">${esc(formatTime(article.time))}</time></div>
        <h3>${esc(article.title)}</h3>
        <p>${esc(article.summary || t('Consulta la noticia original para conocer todos los detalles.', 'Visit the original story for full details.'))}</p>
        <a href="${esc(article.url)}" target="_blank" rel="noopener noreferrer">${t('Leer noticia original ↗', 'Read original story ↗')}</a>
      </article>
    `).join('');
  }

  async function loadNews() {
    if (loading) return;
    loading = true;
    renderArticles();
    try {
      const query = activeTopic === 'all' ? '' : `?topic=${encodeURIComponent(activeTopic)}`;
      const response = await fetch(`/api/news${query}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('News request failed');
      const data = await response.json();
      articles = Array.isArray(data.articles) ? data.articles : [];
    } catch {
      articles = [];
    } finally {
      loading = false;
      renderArticles();
    }
  }

  function boot() {
    lang = localStorage.getItem('lang') || 'ES';
    if (document.getElementById('education')) {
      render();
      loadNews();
      return;
    }
    setTimeout(boot, 150);
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById('news') && document.getElementById('education')) boot();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('storage', event => {
    if (event.key === 'lang') {
      lang = event.newValue || 'ES';
      render();
      loadNews();
    }
  });

  boot();
})();
