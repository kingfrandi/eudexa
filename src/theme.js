function applySavedTheme() {
  const theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
}

// Apply the saved theme immediately and again whenever the SPA re-renders.
// The main app replaces #root.innerHTML when the theme button is clicked.
applySavedTheme();

const themeObserver = new MutationObserver(() => {
  applySavedTheme();
});

themeObserver.observe(document.body, { childList: true, subtree: true });

window.addEventListener('storage', (event) => {
  if (event.key === 'theme') applySavedTheme();
});
