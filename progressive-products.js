(() => {
  /* =========================
     SUBCATEGORIES
  ========================= */
  state.subCategory = state.subCategory || 'الكل';

  const baseNormalizeProduct = normalizeProduct;
  normalizeProduct = function(r, idx){
    const p = baseNormalizeProduct(r, idx);
    p.sub_category = norm(
      r.sub_category ||
      r.subcategory ||
      r.sub_category_name ||
      ''
    );
    return p;
  };

  const baseFiltered = filtered;
  filtered = function(){
    return baseFiltered().filter(p =>
      state.subCategory === 'الكل' ||
      p.sub_category === state.subCategory
    );
  };

  function subcategoriesForCategory(category = state.category){
    if(!category || category === 'الكل') return [];
    return [...new Set(
      state.products
        .filter(p => p.category === category)
        .map(p => p.sub_category)
        .filter(Boolean)
    )].sort((a,b) => a.localeCompare(b, 'ar'));
  }

  const baseRenderSubfilters = renderSubfilters;
  renderSubfilters = function(){
    baseRenderSubfilters();

    const box = document.querySelector('#subfilters');
    const categorySelect = document.querySelector('#categorySelect');
    if(!box || !categorySelect) return;

    const subs = subcategoriesForCategory();

    if(state.subCategory !== 'الكل' && !subs.includes(state.subCategory)){
      state.subCategory = 'الكل';
    }

    document.querySelector('#subCategorySelect')?.remove();

    if(!subs.length) return;

    const select = document.createElement('select');
    select.id = 'subCategorySelect';
    select.className = 'sort-select';
    select.setAttribute('aria-label', 'القسم الفرعي');
    select.innerHTML = `
      <option value="الكل">كل الأقسام الفرعية</option>
      ${subs.map(s => `
        <option value="${esc(s)}" ${state.subCategory === s ? 'selected' : ''}>
          ${esc(s)}
        </option>
      `).join('')}
    `;

    categorySelect.insertAdjacentElement('afterend', select);
  };

  const baseOpenProduct = openProduct;
  openProduct = function(id){
    baseOpenProduct(id);
    const p = byId(id);
    if(!p?.sub_category) return;

    const links = document.querySelector('#productModalContent .product-links');
    if(!links || links.querySelector('[data-product-subcategory]')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'product-link-btn';
    btn.dataset.productSubcategory = p.sub_category;
    btn.textContent = p.sub_category;
    links.appendChild(btn);
  };

  document.addEventListener('click', e => {
    const sub = e.target.closest('[data-product-subcategory]');
    if(sub){
      state.subCategory = sub.dataset.productSubcategory;
      state.brand = 'الكل';
      state.offersOnly = false;
      document.querySelector('#productModal')?.close();
      renderProducts();
      storeView('products');
      document.querySelector('#products')?.scrollIntoView({behavior:'smooth', block:'start'});
      return;
    }
  });

  document.addEventListener('click', e => {
    if(e.target.closest('[data-category], [data-quick-category], [data-product-category], [data-go-home], [data-go-categories], [data-filter-offers]')){
      state.subCategory = 'الكل';
    }
  }, true);

  document.addEventListener('change', e => {
    if(e.target.id === 'subCategorySelect'){
      state.subCategory = e.target.value;
      state.offersOnly = false;
      renderProducts();
      return;
    }

    if(e.target.id === 'categorySelect'){
      state.subCategory = 'الكل';
    }
  }, true);

  /* Add subcategory text to product cards without changing the visual design */
  const baseProductCard = productCard;
  productCard = function(p, index = 99){
    let html = baseProductCard(p, index);
    if(p.sub_category){
      const currentMeta = esc([p.category, p.brand].filter(Boolean).join(' • '));
      const newMeta = esc([p.category, p.sub_category, p.brand].filter(Boolean).join(' • '));
      html = html.replace(currentMeta, newMeta);
    }
    return html;
  };
})();

/* =========================================================
   FAST PROGRESSIVE PRODUCT RENDERING
   - Only a small first batch is inserted into the DOM.
   - More products appear automatically while scrolling.
   - The visible design is unchanged.
========================================================= */
(() => {
  const PAGE_SIZE = 16;

  let visibleProducts = PAGE_SIZE;
  let lastFilterKey = '';
  let observer = null;

  function currentFilterKey(){
    return [
      state.category,
      state.subCategory || 'الكل',
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
        rootMargin: '500px 0px',
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
    else if(state.subCategory && state.subCategory !== 'الكل'){
      title = `${state.category} - ${state.subCategory}`;
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

/* =========================================================
   INSTANT CACHE-FIRST FIRST PAINT
   app.js has already started one fresh Google Sheets request.
   While that request is in flight, show the last good product list
   immediately from localStorage. When the single network request
   finishes, app.js replaces it with the newest data automatically.
========================================================= */
(() => {
  const loading = document.querySelector('#loadingCard');
  const cacheKey = C?.cacheKey || 'alameer_products_v1';

  try{
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');

    if(Array.isArray(cached) && cached.length){
      state.products = cached;

      if(loading){
        loading.hidden = true;
      }

      /* Paint cached content on the next frame so the shell appears first. */
      requestAnimationFrame(() => {
        renderAll();
      });
    }
  }
  catch(error){
    console.warn('Product cache unavailable:', error);
  }
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

/* IMPORTANT: Do not call loadProducts() here.
   app.js already performs exactly one fresh background request.
   Calling it again was the main cause of duplicated network work,
   duplicated rendering, and slower image/product display. */
