(() => {
  const PAGE_SIZE = 24;

  let visibleProducts = PAGE_SIZE;
  let lastFilterKey = '';
  let observer = null;

  function currentFilterKey(){
    return [
      state.category,
      state.brand,
      state.search,
      state.offersOnly ? '1' : '0',
      state.sort
    ].join('|');
  }

  function ensureLoadMore(){
    const productsSection = document.querySelector('#products');
    const grid = document.querySelector('#productsGrid');

    if(!productsSection || !grid){
      return null;
    }

    let loadMore = document.querySelector('#productsLoadMore');

    if(!loadMore){
      loadMore = document.createElement('div');
      loadMore.id = 'productsLoadMore';
      loadMore.className = 'loading-card';
      loadMore.textContent = 'جاري تحميل المزيد...';
      grid.insertAdjacentElement('afterend', loadMore);
    }

    return loadMore;
  }

  function observeLoadMore(loadMore, hasMore){
    if(observer){
      observer.disconnect();
    }

    if(!loadMore){
      return;
    }

    loadMore.hidden = !hasMore;

    if(!hasMore){
      return;
    }

    observer = new IntersectionObserver(
      entries => {
        if(!entries.some(entry => entry.isIntersecting)){
          return;
        }

        visibleProducts += PAGE_SIZE;
        renderProducts();
      },
      {
        root: null,
        rootMargin: '700px 0px',
        threshold: 0.01
      }
    );

    observer.observe(loadMore);
  }

  renderProducts = function(){
    const grid = document.querySelector('#productsGrid');

    if(!grid){
      return;
    }

    const filterKey = currentFilterKey();

    if(filterKey !== lastFilterKey){
      visibleProducts = PAGE_SIZE;
      lastFilterKey = filterKey;
    }

    const arr = filtered();
    const shown = arr.slice(0, visibleProducts);

    grid.innerHTML = shown
      .map(productCard)
      .join('');

    const empty = document.querySelector('#productsEmpty');

    if(empty){
      empty.hidden = !!arr.length;
    }

    const count = document.querySelector('#productsCount');

    if(count){
      count.textContent = `${arr.length} منتج`;
    }

    let title = 'كل المنتجات';

    if(state.offersOnly){
      title = 'كل العروض';
    }
    else if(state.brand !== 'الكل'){
      title = `منتجات ${state.brand}`;
    }
    else if(state.category !== 'الكل'){
      title = state.category;
    }

    const titleEl = document.querySelector('#productsTitle');

    if(titleEl){
      titleEl.textContent = title;
    }

    renderSubfilters();

    const loadMore = ensureLoadMore();
    observeLoadMore(loadMore, shown.length < arr.length);
  };
})();

/* Glass bottom navigation enhancement */
(() => {
  const style = document.createElement('style');
  style.id = 'alameer-glass-bottom-nav';
  style.textContent = `
    @media(max-width:680px){
      body{padding-bottom:calc(100px + env(safe-area-inset-bottom))!important}
      .bottom-nav{
        display:grid!important;
        grid-template-columns:repeat(4,1fr)!important;
        left:12px!important;
        right:12px!important;
        bottom:max(10px,env(safe-area-inset-bottom))!important;
        min-height:66px!important;
        padding:7px 8px!important;
        border:1px solid rgba(255,255,255,.62)!important;
        border-radius:23px!important;
        background:rgba(255,255,255,.70)!important;
        -webkit-backdrop-filter:blur(22px) saturate(165%)!important;
        backdrop-filter:blur(22px) saturate(165%)!important;
        box-shadow:0 12px 34px rgba(25,20,12,.18),inset 0 1px 0 rgba(255,255,255,.78)!important;
        overflow:visible!important;
      }
      .bottom-nav a,.bottom-nav button{
        min-width:0!important;
        min-height:50px!important;
        border-radius:16px!important;
        color:#4f4a43!important;
        transition:transform .18s ease,background .18s ease,color .18s ease!important;
      }
      .bottom-nav a:active,.bottom-nav button:active{
        transform:scale(.94)!important;
      }
      .bottom-nav a.nav-active,.bottom-nav button.nav-active{
        color:var(--gold)!important;
        background:rgba(182,139,61,.11)!important;
      }
      .bottom-nav span{font-size:22px!important;line-height:1!important}
      .bottom-nav small{margin-top:4px!important;font-size:10px!important;font-weight:800!important;line-height:1!important}
      .bottom-nav b{
        top:3px!important;
        right:calc(50% - 25px)!important;
        min-width:18px!important;
        height:18px!important;
        padding:0 4px!important;
        border:2px solid rgba(255,255,255,.92)!important;
        box-shadow:0 2px 8px rgba(0,0,0,.12)!important;
      }
      .toast{bottom:calc(94px + env(safe-area-inset-bottom))!important}
    }
  `;
  document.head.appendChild(style);

  const nav = document.querySelector('.bottom-nav');
  if(!nav) return;

  const items = [...nav.querySelectorAll('a,button')];
  const setActive = item => {
    items.forEach(el => el.classList.remove('nav-active'));
    if(item) item.classList.add('nav-active');
  };

  setActive(nav.querySelector('[data-go-home]'));
  items.forEach(item => item.addEventListener('click', () => setActive(item)));
})();
