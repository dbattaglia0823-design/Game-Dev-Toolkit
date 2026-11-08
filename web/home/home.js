/** Optional enhancement: static links remain usable without JavaScript. */
(() => {
  const search = document.getElementById('tool-search');
  const directory = document.getElementById('tool-directory');
  const status = document.getElementById('results-count');
  const empty = document.getElementById('empty-results');
  if (!search || !directory || !status || !empty) return;

  const cards = Array.from(directory.querySelectorAll('[data-tool-card]'));
  const groups = Array.from(directory.querySelectorAll('[data-tool-section]'));

  function update() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const searchable = ((card.textContent || '') + ' ' + (card.dataset.search || '')).toLocaleLowerCase();
      const matches = !query || query.split(/\s+/).every(term => searchable.includes(term));
      card.hidden = !matches;
      if (matches) visible++;
    }
    for (const group of groups) {
      group.hidden = !group.querySelector('[data-tool-card]:not([hidden])');
    }
    empty.hidden = visible !== 0;
    status.textContent = query
      ? visible + ' matching ' + (visible === 1 ? 'tool' : 'tools')
      : cards.length + ' tools and demos';
  }
  search.addEventListener('input', update);
  document.addEventListener('keydown', event => {
    const target = event.target;
    const typing = target instanceof HTMLElement &&
      (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
    if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      search.focus();
    }
    if (event.key === 'Escape' && document.activeElement === search && search.value) {
      search.value = '';
      update();
      event.preventDefault();
    }
  });
  update();
})();
