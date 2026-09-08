(() => {
  'use strict';
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
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header') && !mobileNav.hidden) closeMenu();
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

  const search = document.querySelector('input[type="search"]');
  const noteFilters = [...document.querySelectorAll('[data-note-filter]')];
  let category = 'all';
  function filterNotes() {
    const query = search.value.trim().toLocaleLowerCase('zh-CN');
    let visible = 0;
    document.querySelectorAll('[data-note]').forEach(note => {
      note.hidden = !(category === 'all' || category === note.dataset.category) || !note.dataset.search.toLocaleLowerCase('zh-CN').includes(query);
      if (!note.hidden) visible++;
    });
    document.querySelector('#notes-empty').hidden = visible !== 0;
    document.querySelector('.notes-count').textContent = `共 ${visible} 篇笔记`;
  }
  search?.addEventListener('input', filterNotes);
  noteFilters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.noteFilter;
    activate(noteFilters, button);
    filterNotes();
  }));
  document.querySelector('#reset-search')?.addEventListener('click', () => {
    search.value = '';
    category = 'all';
    activate(noteFilters, noteFilters[0]);
    filterNotes();
    search.focus();
  });
})();
