/* الأمير براند - تصميم إدارة موحد مع معرض الفردوس + تحسينات الهاتف */
(() => {
  const isAdmin=/(^|\/)admin\.html$/i.test(location.pathname)||document.title.includes('إدارة المتجر');
  if(!isAdmin)return;

  const viewport=document.querySelector('meta[name="viewport"]');
  if(viewport)viewport.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');

  if(!document.getElementById('alameerAdminThemeFile')){
    const l=document.createElement('link');l.id='alameerAdminThemeFile';l.rel='stylesheet';l.href='./admin-theme.css?v=20260910b';document.head.appendChild(l);
  }

  function decorateHeader(){
    const h=document.querySelector('.header');if(!h||h.dataset.firdawsStyle)return;h.dataset.firdawsStyle='1';
    h.querySelector('h1')?.replaceChildren(document.createTextNode('إدارة متجر الأمير براند'));
    const p=h.querySelector('p');if(p)p.textContent='إدارة المنتجات والخيارات وشعارات البراندات والكوبونات';
  }

  function decorateForm(){
    const form=document.getElementById('productForm');if(!form||form.dataset.decorated==='1')return;form.dataset.decorated='1';
    const groups=[['name','المعلومات الأساسية','▣'],['category','التصنيف والبراند','⌗'],['variant_label','خيارات المنتج','☷'],['discount_note','العروض والخصم','%'],['image','صور المنتج','▧'],['desc','وصف المنتج','≡']];
    groups.forEach(([id,title,icon])=>{const el=document.getElementById(id),field=el?.closest('.field');if(!field)return;const t=document.createElement('div');t.className='adminGroupTitle';t.innerHTML=`<span>${icon}</span>${title}`;field.before(t)});
  }

  let categoryFilter='',brandFilter='',stockFilter='all';
  function injectDashboardControls(){
    const view=document.getElementById('productsView'),toolbar=view?.querySelector('.toolbar');if(!view||!toolbar||document.getElementById('adminDashboardControls'))return;
    const box=document.createElement('div');box.id='adminDashboardControls';
    box.innerHTML=`<div class="adminFilters"><select id="adminCategoryFilter"><option value="">جميع الأقسام</option></select><select id="adminBrandFilter"><option value="">جميع البراندات</option></select></div><div class="adminStats"><button type="button" class="adminStat all active" data-stock="all" id="adminStatAll">الكل (0)</button><button type="button" class="adminStat ok" data-stock="ok" id="adminStatOk">متوفر (0)</button><button type="button" class="adminStat out" data-stock="out" id="adminStatOut">نفدت الكمية (0)</button></div>`;
    toolbar.insertAdjacentElement('afterend',box);
    box.querySelector('#adminCategoryFilter').onchange=e=>{categoryFilter=e.target.value;safeRender()};
    box.querySelector('#adminBrandFilter').onchange=e=>{brandFilter=e.target.value;safeRender()};
    box.querySelectorAll('[data-stock]').forEach(b=>b.onclick=()=>{stockFilter=b.dataset.stock;box.querySelectorAll('[data-stock]').forEach(x=>x.classList.toggle('active',x===b));safeRender()});
  }

  function unique(values){return [...new Set(values.map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ar'))}
  function fillDashboardFilters(){
    if(typeof products==='undefined'||!Array.isArray(products))return;
    const c=document.getElementById('adminCategoryFilter'),b=document.getElementById('adminBrandFilter');if(!c||!b)return;
    const cv=categoryFilter,bv=brandFilter;
    c.innerHTML='<option value="">جميع الأقسام</option>'+unique(products.map(x=>x.category)).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    b.innerHTML='<option value="">جميع البراندات</option>'+unique(products.map(x=>x.brand)).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    c.value=cv;b.value=bv;
  }

  function sold(p){return p.stock!==undefined&&p.stock!==''&&Number(p.stock||0)<=0}
  function updateStats(){
    if(typeof products==='undefined'||!Array.isArray(products))return;
    const all=products.length,out=products.filter(sold).length,ok=all-out;
    const a=document.getElementById('adminStatAll'),o=document.getElementById('adminStatOk'),n=document.getElementById('adminStatOut');
    if(a)a.textContent=`الكل (${all})`;if(o)o.textContent=`متوفر (${ok})`;if(n)n.textContent=`نفدت الكمية (${out})`;
  }

  function styledRenderProducts(){
    if(typeof products==='undefined'||!Array.isArray(products))return;
    const search=document.getElementById('searchInput'),listEl=document.getElementById('productsList'),count=document.getElementById('productCount');if(!search||!listEl)return;
    const q=search.value.trim().toLowerCase();
    const list=products.filter(p=>{
      const matchQ=!q||[p.name,p.category,p.sub_category,p.brand,p.id].some(v=>String(v||'').toLowerCase().includes(q));
      const matchC=!categoryFilter||String(p.category||'')===categoryFilter;
      const matchB=!brandFilter||String(p.brand||'')===brandFilter;
      const isSold=sold(p),matchS=stockFilter==='all'||(stockFilter==='out'?isSold:!isSold);
      return matchQ&&matchC&&matchB&&matchS;
    });
    if(count)count.textContent=`${list.length} منتج${list.length!==products.length?' من أصل '+products.length:''}`;
    updateStats();fillDashboardFilters();
    if(!list.length){listEl.innerHTML='<div class="empty">لا توجد منتجات مطابقة للبحث أو الفلاتر.</div>';return}
    listEl.innerHTML=list.map(p=>{const out=sold(p),idx=products.indexOf(p);return `<div class="productItem"><img src="${esc(p.image||'assets/logo.png')}" alt="" onerror="this.src='assets/logo.png'"><div class="productInfo"><h3>${esc(p.name||'بدون اسم')}</h3><div class="productMeta">${esc([p.category,p.sub_category,p.brand].filter(Boolean).join(' • ')||'بدون قسم')}<br><span class="adminPrice">${money(p.price)}</span><br><span class="adminBadge ${out?'out':'ok'}">${out?'نفدت الكمية':'متوفر'}</span>${p.stock!==undefined&&p.stock!==''?` <span class="adminQty">• الكمية: ${esc(p.stock)}</span>`:''}</div></div><button class="editBtn" type="button" data-index="${idx}">✎ تعديل</button></div>`}).join('');
  }

  function safeRender(){try{styledRenderProducts()}catch(e){console.warn('Admin styled render',e);try{if(typeof renderProducts==='function')renderProducts()}catch(_){}}}

  function patchRendering(){
    try{
      if(typeof renderProducts==='function'&&!renderProducts._alameerStyled){const f=styledRenderProducts;f._alameerStyled=true;renderProducts=f}
      fillDashboardFilters();updateStats();safeRender();
    }catch(e){console.warn('Unable to patch admin renderer',e)}
  }

  /* حفظ القسم الفرعي أثناء التحديثات المتأخرة من Google Sheets */
  const pending=new Map();
  const val=id=>document.getElementById(id)?.value?.trim?.()||'';
  function snapshot(){const id=typeof editingId!=='undefined'?String(editingId||'').trim():val('productId');return{id,category:val('category'),sub_category:val('sub_category'),brand:val('brand'),stock:val('stock')}}
  function mergePending(){if(typeof products==='undefined'||!Array.isArray(products))return;pending.forEach((saved,id)=>{const p=products.find(x=>String(x.id||'').trim()===String(id));if(!p)return;if(saved.sub_category)p.sub_category=saved.sub_category;if(saved.category)p.category=saved.category;if(saved.brand)p.brand=saved.brand;if(saved.stock!=='')p.stock=saved.stock})}

  window.addEventListener('load',()=>{
    decorateHeader();decorateForm();injectDashboardControls();patchRendering();
    const form=document.getElementById('productForm'),list=document.getElementById('productsList');
    form?.addEventListener('submit',()=>{const s=snapshot();if(s.id)pending.set(s.id,s);setTimeout(()=>{mergePending();safeRender()},900);setTimeout(()=>{mergePending();safeRender()},2500)},true);
    list?.addEventListener('click',()=>{},true);
    document.getElementById('refreshBtn')?.addEventListener('click',()=>setTimeout(patchRendering,500));
    document.getElementById('searchInput')?.addEventListener('input',()=>setTimeout(safeRender,0));
    setTimeout(patchRendering,800);setTimeout(patchRendering,1800);
    try{
      if(typeof refreshProductsSilently==='function'&&typeof fetchProductsData==='function'){
        refreshProductsSilently=async function(){for(let attempt=0;attempt<4;attempt++){try{const newest=await fetchProductsData();if(Array.isArray(newest)){products=newest;mergePending();products.forEach(p=>{try{rememberSubcategory(p.category,p.sub_category)}catch(_){}});try{updateSuggestions()}catch(_){}safeRender();return true}}catch(e){console.warn('Admin refresh retry',e)}if(attempt<3)await new Promise(r=>setTimeout(r,900))}return false}
      }
    }catch(e){console.warn('Admin refresh patch failed',e)}
  });
})();
