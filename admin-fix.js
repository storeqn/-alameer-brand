/* الأمير براند - تثبيت حفظ القسم الفرعي في صفحة الإدارة */
(() => {
  const isAdmin = /(^|\/)admin\.html$/i.test(location.pathname) || document.title.includes('إدارة المتجر');
  if (!isAdmin) return;

  /* تنسيق صفحة الإدارة للهاتف فقط بدون تغيير وظائفها */
  function applyAdminMobileLayout(){
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) viewport.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
    if (document.getElementById('alameerAdminMobileLayout')) return;
    const style = document.createElement('style');
    style.id = 'alameerAdminMobileLayout';
    style.textContent = `
      html,body{width:100%;max-width:100%;overflow-x:hidden;touch-action:manipulation}
      body{font-size:18px!important}
      .container{width:min(760px,calc(100% - 16px))!important;margin:12px auto 44px!important}
      .header{margin:8px 0 14px!important}.header h1{font-size:27px!important;line-height:1.35!important;margin-bottom:6px!important}.header p{font-size:16px!important;line-height:1.5!important}
      .tabs{position:sticky!important;top:env(safe-area-inset-top)!important;z-index:40!important;display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:7px!important;background:#f7f4ed!important;padding:6px 0 9px!important;margin-bottom:10px!important}
      .tab{min-width:0!important;min-height:50px!important;padding:11px 7px!important;border-radius:13px!important;font-size:16px!important;font-weight:800!important}
      .card{padding:18px!important;border-radius:18px!important;box-shadow:0 7px 24px rgba(0,0,0,.055)!important}
      .field{margin-bottom:19px!important}label{font-size:18px!important;line-height:1.45!important;margin-bottom:8px!important;font-weight:800!important}
      input,textarea,select{font-size:18px!important;line-height:1.5!important;min-height:56px!important;border-radius:13px!important;padding:14px 15px!important;color:#171512!important}
      input::placeholder,textarea::placeholder{font-size:16px!important;color:#999!important;opacity:1!important}textarea{min-height:125px!important}
      small{font-size:15px!important;line-height:1.65!important;margin-top:7px!important;color:#777!important}
      .row{grid-template-columns:1fr!important;gap:0!important}.checks{gap:10px!important;margin-bottom:18px!important}.checkBox{min-height:58px!important;padding:13px 14px!important;font-size:17px!important}.checkBox span{font-size:17px!important;font-weight:700!important}.checkBox input{width:25px!important;height:25px!important}
      .hint{font-size:15px!important;line-height:1.7!important;margin:-2px 0 18px!important;padding:12px 13px!important}.comboBtn{width:52px!important;font-size:25px!important}.comboMenu{max-height:45vh!important}.comboOption{min-height:50px!important;font-size:17px!important;padding:13px!important}.comboEmpty{font-size:15px!important}
      .primary,.secondary,.danger{min-height:58px!important;font-size:18px!important;border-radius:14px!important}.preview{width:125px!important;height:125px!important;margin:10px auto 0!important}
      .toolbar{gap:8px!important;margin-bottom:12px!important}.toolbar input{min-width:0!important;font-size:17px!important}.refresh{min-width:54px!important;min-height:54px!important;border-radius:12px!important;font-size:22px!important}
      .productItem{grid-template-columns:68px minmax(0,1fr)!important;gap:11px!important;padding:11px!important;border-radius:14px!important}.productItem img{width:68px!important;height:68px!important}.productInfo h3{font-size:17px!important;line-height:1.5!important}.productMeta{font-size:14px!important;line-height:1.7!important}.editBtn{grid-column:1/-1!important;width:100%!important;min-height:48px!important;padding:10px 12px!important;font-size:16px!important}
      .editTitle{margin-bottom:17px!important}.editTitle h2{font-size:23px!important}.editBadge{font-size:14px!important;padding:7px 11px!important}.count{font-size:15px!important}.empty,.loader{font-size:16px!important}.couponFrame,.brandFrame{height:calc(100vh - 160px)!important;min-height:720px!important;border-radius:18px!important}
      @media(max-width:420px){.container{width:calc(100% - 10px)!important}.card{padding:14px!important}.header h1{font-size:24px!important}.header p{font-size:15px!important}.tab{font-size:15px!important}.checks{grid-template-columns:1fr 1fr!important}}
    `;
    document.head.appendChild(style);
  }
  applyAdminMobileLayout();

  const pending = new Map();
  function val(id){return document.getElementById(id)?.value?.trim?.() || ''}
  function snapshot(){const id=typeof editingId!=='undefined'?String(editingId||'').trim():val('productId');return{id,name:val('name'),price:val('price'),old_price:val('old_price'),stock:val('stock'),category:val('category'),sub_category:val('sub_category'),brand:val('brand'),image:val('image'),images:val('images'),desc:val('desc'),discount_note:val('discount_note'),offer:document.getElementById('offer')?.checked?'نعم':'',featured:document.getElementById('featured')?.checked?'نعم':''}}
  function mergePendingIntoProducts(){if(typeof products==='undefined'||!Array.isArray(products))return;pending.forEach((saved,id)=>{const p=products.find(x=>String(x.id||'').trim()===String(id));if(!p)return;if(saved.sub_category)p.sub_category=saved.sub_category;if(saved.category)p.category=saved.category;if(saved.brand)p.brand=saved.brand;if(saved.stock!=='')p.stock=saved.stock})}
  function restoreEditField(){const id=typeof editingId!=='undefined'?String(editingId||'').trim():val('productId');if(!id||!pending.has(id))return;const saved=pending.get(id),sub=document.getElementById('sub_category');if(sub&&!sub.value.trim()&&saved.sub_category)sub.value=saved.sub_category}
  window.addEventListener('load',()=>{
    applyAdminMobileLayout();const form=document.getElementById('productForm'),list=document.getElementById('productsList');if(!form)return;
    form.addEventListener('submit',()=>{const data=snapshot();if(data.id)pending.set(data.id,data);setTimeout(()=>{mergePendingIntoProducts();try{if(typeof renderProducts==='function')renderProducts();if(typeof updateSuggestions==='function')updateSuggestions()}catch(_){}},900);setTimeout(()=>{mergePendingIntoProducts();try{if(typeof renderProducts==='function')renderProducts()}catch(_){}},2500)},true);
    list?.addEventListener('click',()=>{setTimeout(restoreEditField,30);setTimeout(restoreEditField,250)},true);
    setTimeout(()=>{try{if(typeof refreshProductsSilently==='function'&&typeof fetchProductsData==='function'){refreshProductsSilently=async function(){let newest=null;for(let attempt=0;attempt<4;attempt++){try{newest=await fetchProductsData();if(Array.isArray(newest)){products=newest;mergePendingIntoProducts();products.forEach(p=>{try{rememberSubcategory(p.category,p.sub_category)}catch(_){}});try{updateSuggestions()}catch(_){}try{renderProducts()}catch(_){}}}catch(e){console.warn('Admin refresh retry',e)}if(attempt<3)await new Promise(r=>setTimeout(r,900))}}}}catch(e){console.warn('Admin subcategory fix could not patch refresh',e)}},0)
  });
})();
