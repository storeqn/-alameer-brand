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
