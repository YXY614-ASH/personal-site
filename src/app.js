(() => {
  'use strict';
  document.documentElement.classList.add('js-enabled');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');

  function closeMenu(restoreFocus = false) {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '打开导航菜单');
    if (restoreFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    mobileNav.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    if (open) mobileNav.querySelector('a').focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header') && !mobileNav.hidden) closeMenu();
  });
  mobileNav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('focusin', event => {
    if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  const backTop = document.querySelector('.back-top');
  const updateBackTop = () => { backTop.hidden = window.scrollY < 500; };
  window.addEventListener('scroll', updateBackTop, { passive: true });
  updateBackTop();
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    document.querySelector('.brand').focus({ preventScroll: true });
  });

  function activate(buttons, selected) {
    buttons.forEach(button => {
      const active = button === selected;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  const projectFilters = [...document.querySelectorAll('[data-project-filter]')];
  projectFilters.forEach(button => button.addEventListener('click', () => {
    activate(projectFilters, button);
    let visible = 0;
    document.querySelectorAll('.project-card').forEach(card => {
      card.hidden = button.dataset.projectFilter !== 'all' && card.dataset.category !== button.dataset.projectFilter;
      if (!card.hidden) visible++;
    });
    document.querySelector('.result-count').textContent = `${visible} 个项目`;
  }));

  const search = document.querySelector('.notes-tools input[type="search"]');
  const sort = document.querySelector('#note-sort');
  const clearSearch = document.querySelector('.clear-search');
  const notesList = document.querySelector('.notes-list');
  const noteFilters = [...document.querySelectorAll('[data-note-filter]')];
  let category = 'all';
  function filterNotes(save = true) {
    const query = search.value.trim().toLocaleLowerCase('zh-CN').split(/\s+/).filter(Boolean);
    let visible = 0;
    const rows = [...notesList.querySelectorAll('[data-note]')];
    rows.sort((a, b) => (sort.value === 'oldest' ? 1 : -1) * a.dataset.date.localeCompare(b.dataset.date));
    rows.forEach(note => {
      note.hidden = !(category === 'all' || category === note.dataset.category) || !query.every(term => note.dataset.search.toLocaleLowerCase('zh-CN').includes(term));
      if (!note.hidden) visible++;
      notesList.append(note);
    });
    document.querySelector('#notes-empty').hidden = visible !== 0;
    document.querySelector('.notes-count').textContent = `共 ${visible} 篇笔记`;
    clearSearch.disabled = search.value.length === 0;
    if (save) {
      const url = new URL(location.href);
      for (const [key, value] of [['q', search.value.trim()], ['category', category === 'all' ? '' : category], ['sort', sort.value === 'newest' ? '' : sort.value]]) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      history.replaceState(null, '', url);
    }
  }
  function restoreNotes() {
    const params = new URLSearchParams(location.search);
    search.value = (params.get('q') || '').slice(0, 100);
    const selected = noteFilters.find(button => button.dataset.noteFilter === params.get('category')) || noteFilters[0];
    category = selected.dataset.noteFilter;
    sort.value = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
    activate(noteFilters, selected);
    filterNotes(false);
  }
  if (search) {
    restoreNotes();
    window.addEventListener('popstate', restoreNotes);
    window.addEventListener('pageshow', restoreNotes);
  }
  search?.addEventListener('input', () => filterNotes());
  sort?.addEventListener('change', () => filterNotes());
  clearSearch?.addEventListener('click', () => {
    search.value = '';
    filterNotes();
    search.focus();
  });
  noteFilters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.noteFilter;
    activate(noteFilters, button);
    filterNotes();
  }));
  document.querySelector('#reset-search')?.addEventListener('click', () => {
    search.value = '';
    sort.value = 'newest';
    category = 'all';
    activate(noteFilters, noteFilters[0]);
    filterNotes();
    search.focus();
  });

  const readingBody = document.querySelector('[data-reading-body]');
  if (readingBody) {
    const progress = document.querySelector('.reading-progress progress');
    const sections = [...readingBody.querySelectorAll('section[id]')];
    const links = [...document.querySelectorAll('.article-toc a')];
    let scheduled = false;
    function updateReading() {
      scheduled = false;
      const bounds = readingBody.getBoundingClientRect();
      const distance = bounds.height - innerHeight;
      progress.value = distance > 0 ? Math.min(100, Math.max(0, -bounds.top / distance * 100)) : (bounds.top < innerHeight ? 100 : 0);
      const current = sections.findLast(section => section.getBoundingClientRect().top <= 120) || sections[0];
      links.forEach(link => {
        if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    const scheduleReading = () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(updateReading); }
    };
    window.addEventListener('scroll', scheduleReading, { passive: true });
    window.addEventListener('resize', scheduleReading);
    window.addEventListener('pageshow', scheduleReading);
    updateReading();
  }

  document.querySelectorAll('img').forEach(image => {
    const fallback = () => {
      image.classList.add('image-unavailable');
      if (image.classList.contains('site-preview') && !image.parentElement.querySelector('.image-fallback')) {
        const message = document.createElement('span');
        message.className = 'image-fallback';
        message.textContent = '预览图暂不可用';
        image.after(message);
      }
    };
    image.addEventListener('error', fallback);
    if (image.complete && !image.naturalWidth) fallback();
  });

  // Content stays visible if animation APIs are unavailable or motion is reduced.
  if ('IntersectionObserver' in window && Element.prototype.animate) {
    const animations = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (motion.matches) return;
        const animation = entry.target.animate([{ opacity: 0.5, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 380, easing: 'ease-out' });
        animations.add(animation);
        animation.addEventListener('finish', () => animations.delete(animation));
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.section-heading, .project-card, .story-intro, .story-timeline, .story-columns, .note-row, .article-section').forEach(element => observer.observe(element));
    motion.addEventListener('change', () => {
      if (motion.matches) { animations.forEach(animation => animation.cancel()); animations.clear(); }
    });
  }
})();
