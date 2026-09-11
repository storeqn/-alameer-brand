/* الأمير براند - إدارة مستقرة وسريعة مع حفظ موثوق */
(() => {
  const isAdmin=/(^|\/)admin\.html$/i.test(location.pathname)||document.title.includes('إدارة المتجر');
  if(!isAdmin)return;

  const nativeFetch=window.fetch.bind(window);
  const pending=new Map();
  let categoryFilter='',brandFilter='',stockFilter='all';

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const val=id=>document.getElementById(id)?.value?.trim?.()||'';
  const same=(a,b)=>String(a??'').trim()===String(b??'').trim();

  const viewport=document.querySelector('meta[name="viewport"]');
  if(viewport)viewport.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');

  if(!document.getElementById('alameerAdminThemeFile')){
    const l=document.createElement('link');l.id='alameerAdminThemeFile';l.rel='stylesheet';l.href='./admin-theme.css?v=20260911c';document.head.appendChild(l);
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

  function unique(values){return [...new Set(values.map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ar'))}
  function injectDashboardControls(){
    const view=document.getElementById('productsView'),toolbar=view?.querySelector('.toolbar');if(!view||!toolbar||document.getElementById('adminDashboardControls'))return;
    const box=document.createElement('div');box.id='adminDashboardControls';
    box.innerHTML=`<div class="adminFilters"><select id="adminCategoryFilter"><option value="">جميع الأقسام</option></select><select id="adminBrandFilter"><option value="">جميع البراندات</option></select></div><div class="adminStats"><button type="button" class="adminStat all active" data-stock="all" id="adminStatAll">الكل (0)</button><button type="button" class="adminStat ok" data-stock="ok" id="adminStatOk">متوفر (0)</button><button type="button" class="adminStat out" data-stock="out" id="adminStatOut">نفدت الكمية (0)</button></div>`;
    toolbar.insertAdjacentElement('afterend',box);
    box.querySelector('#adminCategoryFilter').onchange=e=>{categoryFilter=e.target.value;safeRender()};
    box.querySelector('#adminBrandFilter').onchange=e=>{brandFilter=e.target.value;safeRender()};
    box.querySelectorAll('[data-stock]').forEach(b=>b.onclick=()=>{stockFilter=b.dataset.stock;box.querySelectorAll('[data-stock]').forEach(x=>x.classList.toggle('active',x===b));safeRender()});
  }

  function sold(p){return p.stock!==undefined&&p.stock!==''&&Number(p.stock||0)<=0}
  function fillDashboardFilters(){
    if(typeof products==='undefined'||!Array.isArray(products))return;
    const c=document.getElementById('adminCategoryFilter'),b=document.getElementById('adminBrandFilter');if(!c||!b)return;
    const cv=categoryFilter,bv=brandFilter;
    c.innerHTML='<option value="">جميع الأقسام</option>'+unique(products.map(x=>x.category)).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    b.innerHTML='<option value="">جميع البراندات</option>'+unique(products.map(x=>x.brand)).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    c.value=cv;b.value=bv;
  }
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
    if(count&&!String(count.textContent||'').startsWith('✅')&&!String(count.textContent||'').startsWith('⏳')&&!String(count.textContent||'').startsWith('⚠️'))count.textContent=`${list.length} منتج${list.length!==products.length?' من أصل '+products.length:''}`;
    updateStats();fillDashboardFilters();
    if(!list.length){listEl.innerHTML='<div class="empty">لا توجد منتجات مطابقة للبحث أو الفلاتر.</div>';return}
    listEl.innerHTML=list.map(p=>{const out=sold(p),idx=products.indexOf(p);return `<div class="productItem"><img src="${esc(p.image||'assets/logo.png')}" alt="" onerror="this.src='assets/logo.png'"><div class="productInfo"><h3>${esc(p.name||'بدون اسم')}</h3><div class="productMeta">${esc([p.category,p.sub_category,p.brand].filter(Boolean).join(' • ')||'بدون قسم')}<br><span class="adminPrice">${money(p.price)}</span><br><span class="adminBadge ${out?'out':'ok'}">${out?'نفدت الكمية':'متوفر'}</span>${p.stock!==undefined&&p.stock!==''?` <span class="adminQty">• الكمية: ${esc(p.stock)}</span>`:''}</div></div><button class="editBtn" type="button" data-index="${idx}">✎ تعديل</button></div>`}).join('');
  }
  function safeRender(){try{styledRenderProducts()}catch(e){console.warn('Admin styled render',e);try{if(typeof renderProducts==='function')renderProducts()}catch(_){}}}

  function collectValues(){
    return {
      name:val('name'),price:val('price'),old_price:val('old_price'),stock:val('stock'),
      offer:document.getElementById('offer')?.checked?'نعم':'',discount_note:val('discount_note'),
      image:val('image'),images:typeof normalizeImages==='function'?normalizeImages(document.getElementById('images')?.value||'').join('|'):val('images'),
      category:val('category'),sub_category:val('sub_category'),brand:val('brand'),variant_label:val('variant_label'),
      variants:typeof normalizeImages==='function'?normalizeImages(document.getElementById('variants')?.value||'').join('|'):val('variants'),
      featured:document.getElementById('featured')?.checked?'نعم':'',desc:val('desc')
    };
  }

  function mergePending(){
    if(typeof products==='undefined'||!Array.isArray(products))return;
    pending.forEach((entry,id)=>{
      if(entry.type==='delete'){
        products=products.filter(p=>String(p.id||'').trim()!==String(id));
        return;
      }
      const p=products.find(x=>String(x.id||'').trim()===String(id));
      if(p)Object.assign(p,entry.values);
    });
  }

  async function sendPost(action,id,values){
    const data=new URLSearchParams();data.append('action',action);if(id)data.append('id',id);
    if(values)Object.entries(values).forEach(([k,v])=>data.append(k,v??''));
    return nativeFetch(SCRIPT_URL,{method:'POST',body:data,mode:'no-cors',cache:'no-store',credentials:'omit',keepalive:true});
  }

  function expectedMatches(saved,expected){
    if(!saved)return false;
    const keys=['name','price','old_price','stock','offer','discount_note','image','images','category','sub_category','brand','variant_label','variants','featured','desc'];
    return keys.every(k=>same(saved[k],expected[k]));
  }

  async function verifyUpdate(id,expected){
    const delays=[1800,3200,5500,8500];
    let retried=false;
    for(let i=0;i<delays.length;i++){
      await sleep(delays[i]);
      try{
        const fresh=await fetchProductsData();
        const saved=fresh.find(p=>same(p.id,id));
        if(expectedMatches(saved,expected)){
          pending.delete(id);products=fresh;safeRender();
          const count=document.getElementById('productCount');if(count)count.textContent=`✅ تم حفظ التعديل بنجاح — ${products.length} منتج`;
          setTimeout(()=>{if(count)count.textContent='';safeRender()},2500);
          return true;
        }
      }catch(e){console.warn('Verify update',e)}
      if(i===1&&!retried){
        retried=true;
        try{await sendPost('update',id,expected)}catch(e){console.warn('Update retry failed',e)}
      }
    }
    mergePending();safeRender();
    const count=document.getElementById('productCount');if(count)count.textContent='⚠️ لم أستطع تأكيد الحفظ من Google Sheets. اضغط تحديث بعد لحظات.';
    return false;
  }

  async function verifyDelete(id){
    const delays=[1600,3000,5000,8000];
    let retried=false;
    for(let i=0;i<delays.length;i++){
      await sleep(delays[i]);
      try{
        const fresh=await fetchProductsData();
        if(!fresh.some(p=>same(p.id,id))){
          pending.delete(id);products=fresh;safeRender();
          const count=document.getElementById('productCount');if(count)count.textContent=`✅ تم حذف المنتج نهائياً — ${products.length} منتج`;
          setTimeout(()=>{if(count)count.textContent='';safeRender()},2500);
          return true;
        }
      }catch(e){console.warn('Verify delete',e)}
      if(i===1&&!retried){retried=true;try{await sendPost('delete',id)}catch(e){console.warn('Delete retry failed',e)}}
    }
    mergePending();safeRender();
    const count=document.getElementById('productCount');if(count)count.textContent='⚠️ لم أستطع تأكيد الحذف من Google Sheets. اضغط تحديث بعد لحظات.';
    return false;
  }

  function installReliableActions(){
    const form=document.getElementById('productForm'),del=document.getElementById('deleteProductBtn');
    if(!form||form.dataset.reliableSave==='1')return;form.dataset.reliableSave='1';

    form.addEventListener('submit',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const id=typeof editingId!=='undefined'?String(editingId||'').trim():val('productId');
      const isEdit=Boolean(id),values=collectValues();
      if(!values.name||!values.price||!values.category||!values.image){if(typeof setStatus==='function')setStatus('❌ أكمل الحقول المطلوبة أولاً.','error');return}
      try{if(typeof rememberSubcategory==='function')rememberSubcategory(values.category,values.sub_category)}catch(_){}
      const btn=document.getElementById('saveBtn');if(btn){btn.disabled=true;btn.textContent=isEdit?'جاري إرسال التعديل...':'جاري إضافة المنتج...'}
      if(isEdit){
        pending.set(id,{type:'update',values,at:Date.now()});
        try{if(typeof optimisticUpdateProduct==='function')optimisticUpdateProduct(id,values)}catch(_){}
        try{resetFormMode();showView('products')}catch(_){}
        mergePending();safeRender();
        const count=document.getElementById('productCount');if(count)count.textContent='⏳ تم حفظ التعديل محلياً، جاري تثبيته في Google Sheets...';
        sendPost('update',id,values).then(()=>verifyUpdate(id,values)).catch(err=>{console.error(err);if(count)count.textContent='⚠️ تعذر الاتصال للحفظ. سيتم إبقاء التعديل ظاهراً ويمكنك المحاولة مجدداً.'});
      }else{
        sendPost('add','',values).then(()=>{try{resetFormMode();showView('products')}catch(_){};const count=document.getElementById('productCount');if(count)count.textContent='✅ تم إرسال المنتج الجديد، جاري تحديث القائمة...';setTimeout(()=>{try{loadProducts();loadSavedBrands()}catch(_){}},1800)}).catch(err=>{console.error(err);if(typeof setStatus==='function')setStatus('❌ تعذر إرسال المنتج. تحقق من الإنترنت وحاول مرة أخرى.','error')});
      }
      if(btn){setTimeout(()=>{btn.disabled=false;btn.textContent='+ إضافة المنتج'},500)}
    },true);

    del?.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const id=typeof editingId!=='undefined'?String(editingId||'').trim():val('productId');if(!id)return;
      const name=val('name')||'هذا المنتج';if(!confirm(`هل أنت متأكد من حذف المنتج نهائياً؟\n\n${name}\n\nلا يمكن التراجع عن الحذف.`))return;
      pending.set(id,{type:'delete',at:Date.now()});
      try{products=products.filter(p=>!same(p.id,id));resetFormMode();showView('products')}catch(_){}
      safeRender();const count=document.getElementById('productCount');if(count)count.textContent='⏳ جاري حذف المنتج نهائياً من Google Sheets...';
      sendPost('delete',id).then(()=>verifyDelete(id)).catch(err=>{console.error(err);if(count)count.textContent='⚠️ تعذر الاتصال للحذف. حاول مرة أخرى.'});
    },true);
  }

  function patchRendering(){
    try{
      if(typeof renderProducts==='function'&&!renderProducts._alameerStyled){const f=styledRenderProducts;f._alameerStyled=true;renderProducts=f}
      if(typeof refreshProductsSilently==='function'&&!refreshProductsSilently._alameerReliable){
        const reliable=async function(){try{const newest=await fetchProductsData();if(Array.isArray(newest)){products=newest;mergePending();try{products.forEach(p=>rememberSubcategory(p.category,p.sub_category));updateSuggestions()}catch(_){}safeRender();return true}}catch(e){console.warn('Admin refresh',e)}return false};
        reliable._alameerReliable=true;refreshProductsSilently=reliable;
      }
      mergePending();safeRender();
    }catch(e){console.warn('Unable to patch admin',e)}
  }

  window.addEventListener('load',()=>{
    decorateHeader();decorateForm();injectDashboardControls();installReliableActions();patchRendering();
    document.getElementById('refreshBtn')?.addEventListener('click',()=>setTimeout(()=>{mergePending();patchRendering()},600));
    document.getElementById('searchInput')?.addEventListener('input',()=>setTimeout(safeRender,0));
    setTimeout(patchRendering,700);setTimeout(patchRendering,1600);
  });
})();