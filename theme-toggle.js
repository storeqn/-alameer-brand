(() => {
  const KEY = 'alameer_theme';
  const body = document.body;
  const button = document.querySelector('#themeColorBtn');
  const menuButton = document.querySelector('#menuBtn');
  const meta = document.querySelector('meta[name="theme-color"]');
  const viewport = document.querySelector('meta[name="viewport"]');
  if(!button) return;

  /* Put the theme switch directly beside the hamburger menu. */
  if(menuButton && !menuButton.parentElement?.classList.contains('topbar-menu-tools')){
    const tools = document.createElement('div');
    tools.className = 'topbar-menu-tools';
    menuButton.parentNode.insertBefore(tools, menuButton);
    tools.appendChild(menuButton);
    tools.appendChild(button);
  }

  const themeIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9c0-1.1-.9-2-2-2h-1.2a2 2 0 0 1-2-2V6.8A3.8 3.8 0 0 0 12 3Z"></path>
      <circle cx="7.7" cy="11.2" r=".8"></circle>
      <circle cx="9.6" cy="7.6" r=".8"></circle>
      <circle cx="13.7" cy="6.8" r=".8"></circle>
      <circle cx="7.8" cy="15.3" r=".8"></circle>
    </svg>`;

  button.innerHTML = themeIcon;

  function apply(theme){
    const pink = theme === 'pink';
    body.classList.toggle('theme-pink', pink);
    button.classList.toggle('is-pink', pink);
    button.setAttribute('aria-label', pink ? 'الرجوع إلى ألوان الأمير براند' : 'تفعيل اللون الوردي');
    button.title = pink ? 'ألوان الأمير براند' : 'اللون الوردي';
    if(meta) meta.setAttribute('content', pink ? '#ffeaf3' : '#f8f4ec');
  }

  let saved = 'original';
  try{ saved = localStorage.getItem(KEY) || 'original'; }catch(_){ }
  apply(saved);

  button.addEventListener('click', () => {
    const next = body.classList.contains('theme-pink') ? 'original' : 'pink';
    try{ localStorage.setItem(KEY, next); }catch(_){ }
    apply(next);
  });

  /* Prevent accidental pinch/double-tap zoom while preserving normal scrolling. */
  if(viewport){
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    );
  }

  ['gesturestart','gesturechange','gestureend'].forEach(type => {
    document.addEventListener(type, e => e.preventDefault(), {passive:false});
  });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if(now - lastTouchEnd <= 300){
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, {passive:false});
})();
