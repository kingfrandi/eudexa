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
  let warning = '';
  let lastLang = lang;

  const t = (es, en) => lang === 'ES' ? es : en;
  const esc = value => String(value || '').replace(/[&<>'\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' }[char]));

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(lang === 'ES' ? 'es-DO' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function addNewsNavLink() {
    const nav = document.querySelector('#siteHeader nav');
    if (!nav || nav.querySelector('a[href="#news"]')) return;
    const link = document.createElement('a');
    link.href = '#news';
    link.dataset.newsNav = 'true';
    link.textContent = t('Noticias', 'News');
    nav.insertBefore(link, nav.lastElementChild || null);
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

  function adSlot(position) {
    return `<div class="newsAdSlot" data-ad-position="${position}" aria-label="Advertisement"><span>${t('Espacio publicitario', 'Advertising space')}</span></div>`;
  }

  function render() {
    const section = createSection();
    if (!section) return;
    addNewsNavLink();
    const newsNav = document.querySelector('[data-news-nav]');
    if (newsNav) newsNav.textContent = t('Noticias', 'News');

    section.innerHTML = `
      <div class="newsHeader">
        <div>
          <p class="eyebrow">${t('ACTUALIDAD FINANCIERA', 'FINANCIAL NEWS')}</p>
          <h2>${t('Noticias financieras', 'Financial news')}</h2>
          <p class="newsIntro">${t('Noticias financieras reales, con su título, fuente, imagen y enlace directo a la publicación original.', 'Real financial news with its title, source, image and direct link to the original publication.')}</p>
        </div>
        <button class="newsRefresh" id="newsRefresh" type="button">↻ ${t('Actualizar', 'Refresh')}</button>
      </div>
      ${adSlot('top')}
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
      grid.innerHTML = Array.from({ length: 6 }, () => '<article class="newsCard skeleton"><div class="skImage"></div><div class="skLine wide"></div><div class="skLine"></div><div class="skLine short"></div><div class="skBottom"></div></article>').join('');
      return;
    }
    if (!articles.length) {
      grid.innerHTML = `<div class="newsEmpty">${esc(warning || t('No hay noticias disponibles en este momento.', 'No news is available right now.'))}</div>`;
      return;
    }

    grid.innerHTML = articles.map((article, index) => `
      ${index === 4 ? adSlot('middle') : ''}
      <article class="newsCard ${index === 0 ? 'featured' : ''}">
        ${article.image ? `<div class="newsImageWrap"><img class="newsImage" src="${esc(article.image)}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>` : '<div class="newsImageWrap newsImagePlaceholder"><span>◉</span></div>'}
        <div class="newsCardBody">
          <div class="newsCardTop"><span class="newsBadge">${esc(article.source)}</span><time datetime="${esc(article.time)}">${esc(formatTime(article.time))}</time></div>
          <h3>${esc(article.title)}</h3>
          <p>${esc(article.summary || t('Consulta la noticia original para conocer todos los detalles.', 'Visit the original story for full details.'))}</p>
          <a href="${esc(article.url)}" target="_blank" rel="noopener noreferrer">${t('Leer noticia original ↗', 'Read original story ↗')}</a>
        </div>
      </article>
      ${index === 7 ? adSlot('bottom') : ''}
    `).join('');
  }

  async function loadNews() {
    if (loading) return;
    loading = true;
    warning = '';
    renderArticles();
    try {
      const query = activeTopic === 'all' ? '' : `?topic=${encodeURIComponent(activeTopic)}`;
      const response = await fetch(`/api/news${query}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('News request failed');
      const data = await response.json();
      articles = Array.isArray(data.articles) ? data.articles : [];
      warning = typeof data.warning === 'string' ? data.warning : '';
    } catch {
      articles = [];
      warning = t('No fue posible cargar las noticias. Inténtalo de nuevo.', 'News could not be loaded. Please try again.');
    } finally {
      loading = false;
      renderArticles();
    }
  }

  function syncLanguage() {
    const current = localStorage.getItem('lang') || 'ES';
    if (current === lastLang) return;
    lastLang = current;
    lang = current;
    render();
  }

  function boot() {
    lang = localStorage.getItem('lang') || 'ES';
    lastLang = lang;
    if (document.getElementById('education')) {
      render();
      loadNews();
      return;
    }
    setTimeout(boot, 150);
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById('news') && document.getElementById('education')) boot();
    else syncLanguage();
    addNewsNavLink();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('storage', event => {
    if (event.key === 'lang') {
      lang = event.newValue || 'ES';
      lastLang = lang;
      render();
      loadNews();
    }
  });

  boot();
})();
