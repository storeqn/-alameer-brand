/* الأمير براند - تثبيت حفظ القسم الفرعي في صفحة الإدارة */
(() => {
  const isAdmin = /(^|\/)admin\.html$/i.test(location.pathname) || document.title.includes('إدارة المتجر');
  if (!isAdmin) return;

  /* تنسيق صفحة الإدارة للهاتف فقط بدون تغيير وظائفها */
  function applyAdminMobileLayout(){
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
    }

    if (document.getElementById('alameerAdminMobileLayout')) return;
    const style = document.createElement('style');
    style.id = 'alameerAdminMobileLayout';
    style.textContent = `
      html,body{width:100%;max-width:100%;overflow-x:hidden;touch-action:manipulation}
      body{font-size:16px}
      .container{width:min(760px,calc(100% - 20px))!important;margin:14px auto 44px!important}
      .header{margin:8px 0 14px!important}
      .header h1{font-size:24px!important;line-height:1.35!important;margin-bottom:5px!important}
      .header p{font-size:13px!important}
      .tabs{position:sticky!important;top:env(safe-area-inset-top)!important;z-index:40!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;background:#f7f4ed!important;padding:6px 0 8px!important;margin-bottom:10px!important}
      .tab{min-width:0!important;min-height:44px!important;padding:9px 5px!important;border-radius:12px!important;font-size:12px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .card{padding:18px!important;border-radius:18px!important;box-shadow:0 7px 24px rgba(0,0,0,.055)!important}
      .field{margin-bottom:14px!important}
      label{font-size:14px!important;margin-bottom:6px!important}
      input,textarea,select{font-size:16px!important;line-height:1.45!important;min-height:48px!important;border-radius:12px!important;padding:12px 13px!important}
      textarea{min-height:96px!important}
      small{font-size:12px!important;line-height:1.55!important;margin-top:5px!important}
      .row{grid-template-columns:1fr!important;gap:0!important}
      .checks{gap:8px!important;margin-bottom:14px!important}
      .checkBox{min-height:50px!important;padding:10px 12px!important}
      .hint{font-size:12px!important;line-height:1.6!important;margin:-2px 0 14px!important;padding:9px 11px!important}
      .comboBtn{width:46px!important;font-size:22px!important}
      .comboMenu{max-height:45vh!important}
      .comboOption{min-height:44px!important;font-size:15px!important}
      .primary,.secondary,.danger{min-height:52px!important;font-size:16px!important;border-radius:13px!important}
      .preview{width:110px!important;height:110px!important;margin:8px auto 0!important}
      .toolbar{gap:7px!important;margin-bottom:10px!important}
      .toolbar input{min-width:0!important}
      .refresh{min-width:48px!important;min-height:48px!important;border-radius:12px!important}
      .productItem{grid-template-columns:64px minmax(0,1fr) auto!important;gap:10px!important;padding:9px!important;border-radius:14px!important}
      .productItem img{width:64px!important;height:64px!important}
      .productInfo h3{font-size:14px!important}
      .productMeta{font-size:11px!important}
      .editBtn{min-height:42px!important;padding:8px 11px!important;font-size:13px!important}
      .editTitle{margin-bottom:14px!important}
      .editTitle h2{font-size:18px!important}
      .couponFrame,.brandFrame{height:calc(100vh - 160px)!important;min-height:720px!important;border-radius:18px!important}

      @media(max-width:900px){
        .container{width:calc(100% - 16px)!important;margin-top:8px!important}
        .header h1{font-size:21px!important}
        .header p{font-size:12px!important}
        .card{padding:14px!important;border-radius:16px!important}
        .tabs{grid-template-columns:repeat(2,1fr)!important}
        .tab{font-size:13px!important;min-height:42px!important}
        .row{grid-template-columns:1fr!important}
        .productItem{grid-template-columns:58px minmax(0,1fr)!important}
        .productItem img{width:58px!important;height:58px!important}
        .editBtn{grid-column:1/-1!important;width:100%!important}
        .checks{grid-template-columns:1fr 1fr!important}
      }

      @media(max-width:420px){
        .container{width:calc(100% - 12px)!important}
        .card{padding:12px!important}
        .tabs{gap:5px!important}
        .tab{font-size:12px!important;padding-inline:4px!important}
        .checks{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(style);
  }

  applyAdminMobileLayout();

  const pending = new Map();

  function val(id){
    return document.getElementById(id)?.value?.trim?.() || '';
  }

  function snapshot(){
    const id = typeof editingId !== 'undefined' ? String(editingId || '').trim() : val('productId');
    return {
      id,
      name: val('name'),
      price: val('price'),
      old_price: val('old_price'),
      stock: val('stock'),
      category: val('category'),
      sub_category: val('sub_category'),
      brand: val('brand'),
      image: val('image'),
      images: val('images'),
      desc: val('desc'),
      discount_note: val('discount_note'),
      offer: document.getElementById('offer')?.checked ? 'نعم' : '',
      featured: document.getElementById('featured')?.checked ? 'نعم' : ''
    };
  }

  function mergePendingIntoProducts(){
    if (typeof products === 'undefined' || !Array.isArray(products)) return;
    pending.forEach((saved, id) => {
      const p = products.find(x => String(x.id || '').trim() === String(id));
      if (!p) return;
      // لا تسمح لنسخة CSV قديمة بمسح القسم الفرعي الذي حُفظ للتو.
      if (saved.sub_category) p.sub_category = saved.sub_category;
      if (saved.category) p.category = saved.category;
      if (saved.brand) p.brand = saved.brand;
      if (saved.stock !== '') p.stock = saved.stock;
    });
  }

  function restoreEditField(){
    const id = typeof editingId !== 'undefined' ? String(editingId || '').trim() : val('productId');
    if (!id || !pending.has(id)) return;
    const saved = pending.get(id);
    const sub = document.getElementById('sub_category');
    if (sub && !sub.value.trim() && saved.sub_category) sub.value = saved.sub_category;
  }

  window.addEventListener('load', () => {
    applyAdminMobileLayout();
    const form = document.getElementById('productForm');
    const list = document.getElementById('productsList');
    if (!form) return;

    // نلتقط القيم قبل أن يقوم الكود الأصلي بتصفير النموذج.
    form.addEventListener('submit', () => {
      const data = snapshot();
      if (data.id) pending.set(data.id, data);

      // إذا رجعت نسخة CSV القديمة بعد الحفظ، أعد دمج القيمة الصحيحة محلياً.
      setTimeout(() => {
        mergePendingIntoProducts();
        try {
          if (typeof renderProducts === 'function') renderProducts();
          if (typeof updateSuggestions === 'function') updateSuggestions();
        } catch (_) {}
      }, 900);

      setTimeout(() => {
        mergePendingIntoProducts();
        try {
          if (typeof renderProducts === 'function') renderProducts();
        } catch (_) {}
      }, 2500);
    }, true);

    // عند فتح المنتج من جديد، لا تسمح للـ CSV القديم بإظهار القسم الفرعي فارغاً.
    list?.addEventListener('click', () => {
      setTimeout(restoreEditField, 30);
      setTimeout(restoreEditField, 250);
    }, true);

    // استبدال التحديث الصامت بنسخة تنتظر تحديث Google Sheets ولا تمسح القسم الفرعي.
    setTimeout(() => {
      try {
        if (typeof refreshProductsSilently === 'function' && typeof fetchProductsData === 'function') {
          refreshProductsSilently = async function(){
            let newest = null;
            for (let attempt = 0; attempt < 4; attempt++) {
              try {
                newest = await fetchProductsData();
                if (Array.isArray(newest)) {
                  products = newest;
                  mergePendingIntoProducts();
                  products.forEach(p => {
                    try { rememberSubcategory(p.category, p.sub_category); } catch (_) {}
                  });
                  try { updateSuggestions(); } catch (_) {}
                  try { renderProducts(); } catch (_) {}
                }
              } catch (e) {
                console.warn('Admin refresh retry', e);
              }
              if (attempt < 3) await new Promise(r => setTimeout(r, 900));
            }
          };
        }
      } catch (e) {
        console.warn('Admin subcategory fix could not patch refresh', e);
      }
    }, 0);
  });
})();
