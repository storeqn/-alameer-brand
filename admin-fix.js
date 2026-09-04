/* الأمير براند - تثبيت حفظ القسم الفرعي + تحسين تصميم الإدارة للهاتف */
(() => {
  const isAdmin = /(^|\/)admin\.html$/i.test(location.pathname) || document.title.includes('إدارة المتجر');
  if (!isAdmin) return;

  function applyAdminMobileLayout(){
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) viewport.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
    if (document.getElementById('alameerAdminMobileLayout')) return;
    const style = document.createElement('style');
    style.id = 'alameerAdminMobileLayout';
    style.textContent = `
      :root{--adm-bg:#f7f4ed;--adm-card:#fff;--adm-ink:#171512;--adm-muted:#777;--adm-line:#e7e0d5;--adm-gold:#b68b3d;--adm-soft:#fff7e6;--adm-danger:#b42318}
      html,body{width:100%;max-width:100%;overflow-x:hidden;touch-action:manipulation;background:var(--adm-bg)!important}
      body{font-size:18px!important;color:var(--adm-ink)!important}
      .container{width:min(760px,calc(100% - 16px))!important;margin:10px auto 54px!important}
      .header{margin:10px 0 16px!important}.header h1{font-size:28px!important;line-height:1.35!important;margin:0 0 5px!important;font-weight:900!important}.header p{font-size:16px!important;line-height:1.55!important;color:#8a847c!important}
      .tabs{position:sticky!important;top:env(safe-area-inset-top)!important;z-index:40!important;display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:8px!important;background:rgba(247,244,237,.96)!important;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:7px 0 10px!important;margin-bottom:12px!important}
      .tab{min-width:0!important;min-height:52px!important;padding:11px 8px!important;border-radius:14px!important;font-size:16px!important;font-weight:900!important;border-color:#ded6ca!important;box-shadow:0 2px 7px rgba(0,0,0,.025)!important}.tab.active{background:#11100e!important;color:#fff!important;box-shadow:0 7px 16px rgba(17,16,14,.16)!important}
      .card{padding:18px!important;border-radius:22px!important;box-shadow:0 8px 28px rgba(0,0,0,.055)!important;border:1px solid rgba(231,224,213,.65)!important}
      .editTitle{margin-bottom:8px!important;align-items:flex-start!important}.editTitle h2{font-size:25px!important;line-height:1.35!important;font-weight:900!important}.editTitle h2:before{content:'◈';display:inline-grid;place-items:center;width:34px;height:34px;margin-left:9px;border-radius:10px;background:#11100e;color:#fff;font-size:18px;vertical-align:-4px}.editBadge{font-size:14px!important;padding:8px 12px!important;border-radius:999px!important}
      #productForm:before{content:'أضف أو عدّل بيانات المنتج بسهولة ووضوح';display:block;color:#8a847c;font-size:15px;line-height:1.5;margin:0 0 18px 0}
      .adminGroupTitle{display:flex;align-items:center;gap:8px;margin:25px 0 12px;padding-top:18px;border-top:1px solid #eee8de;font-size:18px;font-weight:900;color:#27231e}.adminGroupTitle:first-of-type{margin-top:4px;padding-top:0;border-top:0}.adminGroupTitle span{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:var(--adm-soft);color:#9a6b18;font-size:18px}
      .field{margin-bottom:18px!important}label{font-size:18px!important;line-height:1.45!important;margin-bottom:8px!important;font-weight:900!important;color:#26221e!important}
      input,textarea,select{font-size:18px!important;line-height:1.5!important;min-height:58px!important;border-radius:14px!important;padding:14px 16px!important;color:#171512!important;border:1.5px solid var(--adm-line)!important;background:#fff!important;box-shadow:0 1px 0 rgba(0,0,0,.015)!important}
      input:focus,textarea:focus{border-color:var(--adm-gold)!important;box-shadow:0 0 0 3px rgba(182,139,61,.10)!important}
      input::placeholder,textarea::placeholder{font-size:16px!important;color:#aaa39b!important;opacity:1!important}textarea{min-height:130px!important}
      small{font-size:15px!important;line-height:1.7!important;margin-top:7px!important;color:#827b73!important}
      .row{grid-template-columns:1fr!important;gap:0!important}.checks{gap:10px!important;margin:4px 0 18px!important}.checkBox{min-height:64px!important;padding:14px 15px!important;font-size:17px!important;border:1.5px solid #eadfcd!important;background:#fffaf2!important;border-radius:15px!important}.checkBox span{font-size:18px!important;font-weight:900!important}.checkBox input{width:27px!important;height:27px!important;accent-color:#11100e!important}
      .hint{font-size:15px!important;line-height:1.75!important;margin:-2px 0 19px!important;padding:13px 14px!important;border-radius:14px!important;background:#fff7e4!important;color:#765b27!important}.comboBtn{width:54px!important;font-size:26px!important}.comboMenu{max-height:45vh!important;border-radius:14px!important}.comboOption{min-height:52px!important;font-size:17px!important;padding:14px!important}.comboEmpty{font-size:15px!important}
      .primary,.secondary,.danger{min-height:60px!important;font-size:19px!important;border-radius:15px!important;font-weight:900!important}.primary{position:sticky!important;bottom:calc(10px + env(safe-area-inset-bottom))!important;z-index:25!important;box-shadow:0 10px 30px rgba(17,16,14,.24)!important}.primary:before{content:'✓ ';font-size:18px}.secondary{background:#f0ece5!important}.danger{background:var(--adm-danger)!important}
      .preview{width:132px!important;height:132px!important;margin:10px auto 0!important;border-radius:18px!important;background:#fbfaf8!important}
      .toolbar{gap:9px!important;margin-bottom:13px!important}.toolbar input{min-width:0!important;font-size:17px!important}.refresh{min-width:56px!important;min-height:56px!important;border-radius:14px!important;font-size:23px!important}
      .productItem{grid-template-columns:72px minmax(0,1fr)!important;gap:12px!important;padding:12px!important;border-radius:16px!important}.productItem img{width:72px!important;height:72px!important;border-radius:14px!important}.productInfo h3{font-size:18px!important;line-height:1.5!important}.productMeta{font-size:15px!important;line-height:1.75!important}.editBtn{grid-column:1/-1!important;width:100%!important;min-height:50px!important;padding:11px 12px!important;font-size:17px!important;border-radius:13px!important}.count{font-size:15px!important}.empty,.loader{font-size:16px!important}.couponFrame,.brandFrame{height:calc(100vh - 160px)!important;min-height:720px!important;border-radius:18px!important}
      @media(max-width:420px){.container{width:calc(100% - 10px)!important}.card{padding:15px!important}.header h1{font-size:25px!important}.header p{font-size:15px!important}.tab{font-size:15px!important}.checks{grid-template-columns:1fr 1fr!important}.adminGroupTitle{font-size:17px!important}}
    `;
    document.head.appendChild(style);
  }

  function decorateAdminForm(){
    const form=document.getElementById('productForm');
    if(!form || form.dataset.decorated==='1') return;
    form.dataset.decorated='1';
    const groups=[
      ['name','المعلومات الأساسية','▣'],
      ['category','التصنيف والبراند','⌗'],
      ['variant_label','خيارات المنتج','☷'],
      ['discount_note','العروض والخصم','%'],
      ['image','صور المنتج','▧'],
      ['desc','وصف المنتج','≡']
    ];
    groups.forEach(([id,title,icon])=>{
      const el=document.getElementById(id);if(!el)return;
      const field=el.closest('.field');if(!field)return;
      const t=document.createElement('div');t.className='adminGroupTitle';t.innerHTML=`<span>${icon}</span>${title}`;field.before(t);
    });
  }

  applyAdminMobileLayout();

  const pending = new Map();
  function val(id){return document.getElementById(id)?.value?.trim?.() || ''}
  function snapshot(){const id=typeof editingId!=='undefined'?String(editingId||'').trim():val('productId');return{id,name:val('name'),price:val('price'),old_price:val('old_price'),stock:val('stock'),category:val('category'),sub_category:val('sub_category'),brand:val('brand'),image:val('image'),images:val('images'),desc:val('desc'),discount_note:val('discount_note'),offer:document.getElementById('offer')?.checked?'نعم':'',featured:document.getElementById('featured')?.checked?'نعم':''}}
  function mergePendingIntoProducts(){if(typeof products==='undefined'||!Array.isArray(products))return;pending.forEach((saved,id)=>{const p=products.find(x=>String(x.id||'').trim()===String(id));if(!p)return;if(saved.sub_category)p.sub_category=saved.sub_category;if(saved.category)p.category=saved.category;if(saved.brand)p.brand=saved.brand;if(saved.stock!=='')p.stock=saved.stock})}
  function restoreEditField(){const id=typeof editingId!=='undefined'?String(editingId||'').trim():val('productId');if(!id||!pending.has(id))return;const saved=pending.get(id),sub=document.getElementById('sub_category');if(sub&&!sub.value.trim()&&saved.sub_category)sub.value=saved.sub_category}
  window.addEventListener('load',()=>{
    applyAdminMobileLayout();decorateAdminForm();const form=document.getElementById('productForm'),list=document.getElementById('productsList');if(!form)return;
    form.addEventListener('submit',()=>{const data=snapshot();if(data.id)pending.set(data.id,data);setTimeout(()=>{mergePendingIntoProducts();try{if(typeof renderProducts==='function')renderProducts();if(typeof updateSuggestions==='function')updateSuggestions()}catch(_){}},900);setTimeout(()=>{mergePendingIntoProducts();try{if(typeof renderProducts==='function')renderProducts()}catch(_){}},2500)},true);
    list?.addEventListener('click',()=>{setTimeout(restoreEditField,30);setTimeout(restoreEditField,250)},true);
    setTimeout(()=>{try{if(typeof refreshProductsSilently==='function'&&typeof fetchProductsData==='function'){refreshProductsSilently=async function(){let newest=null;for(let attempt=0;attempt<4;attempt++){try{newest=await fetchProductsData();if(Array.isArray(newest)){products=newest;mergePendingIntoProducts();products.forEach(p=>{try{rememberSubcategory(p.category,p.sub_category)}catch(_){}});try{updateSuggestions()}catch(_){}try{renderProducts()}catch(_){}}}catch(e){console.warn('Admin refresh retry',e)}if(attempt<3)await new Promise(r=>setTimeout(r,900))}}}}catch(e){console.warn('Admin subcategory fix could not patch refresh',e)}},0)
  });
})();
