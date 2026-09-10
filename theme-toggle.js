(() => {
  const KEY = 'alameer_theme';
  const body = document.body;
  const button = document.querySelector('#themeColorBtn');
  const meta = document.querySelector('meta[name="theme-color"]');
  if(!button) return;

  function apply(theme){
    const pink = theme === 'pink';
    body.classList.toggle('theme-pink', pink);
    button.textContent = pink ? '✨' : '🌸';
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
})();
