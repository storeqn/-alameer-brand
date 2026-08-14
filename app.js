const C = window.STORE_CONFIG;
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const state = { products: [], cart: JSON.parse(localStorage.getItem('alameer_cart_v2') || '[]'), category: 'الكل', sub: 'الكل', search: '', offersOnly: false };

const money = v => `${Number(v || 0).toLocaleString('ar-IQ')} ${C.currency}`;
const norm = v => String(v ?? '').trim();
const truthy = v => ['1','true','yes','y','نعم','عرض','offer'].includes(norm(v).toLowerCase());
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const byId = id => state.products.find(p => String(p.id) === String(id));

function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], nx=text[i+1];
    if(ch==='"' && q && nx==='"'){cell+='"'; i++;}
    else if(ch==='"'){q=!q;}
    else if(ch===',' && !q){row.push(cell); cell='';}
    else if((ch==='\n'||ch==='\r') && !q){
      if(ch==='\r'&&nx==='\n') i++;
      row.push(cell); cell=''; if(row.some(x=>x.trim()!=='')) rows.push(row); row=[];
    } else cell+=ch;
  }
  row.push(cell); if(row.some(x=>x.trim()!=='')) rows.push(row);
  if(!rows.length) return [];
  const headers=rows.shift().map(h=>h.trim().toLowerCase());
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??'').trim()])));
}

function normalizeProduct(r, idx){
  const imagesRaw = r.images || r.image_urls || r.gallery || '';
  const images = [r.image, ...imagesRaw.split(/\s*[|;\n]\s*/)].map(norm).filter(Boolean);
  const uniqImages = [...new Set(images)];
  const price = Number(String(r.price||0).replace(/[^\d.]/g,'')) || 0;
  const oldPrice = Number(String(r.old_price||r.oldprice||0).replace(/[^\d.]/g,'')) || 0;
  const offer = truthy(r.offer) || truthy(r.is_offer) || oldPrice > price || !!norm(r.discount_note);
  return {
    id: norm(r.id) || `p${idx+1}`,
    name: norm(r.name) || 'منتج', price, old_price: oldPrice,
    offer, discount_note: norm(r.discount_note),
    images: uniqImages.length ? uniqImages : ['assets/placeholder.svg'],
    category: norm(r.category) || 'أخرى', sub_category: norm(r.sub_category||r.subcategory),
    brand: norm(r.brand), desc: norm(r.desc||r.description), active: r.active === '' ? true : !['0','false','no','لا'].includes(norm(r.active).toLowerCase())
  };
}

async function loadProducts(){
  $('#loadingCard').hidden=false;
  try{
    const res=await fetch(`${C.sheetCsvUrl}${C.sheetCsvUrl.includes('?')?'&':'?'}_=${Date.now()}`, {cache:'no-store'});
    if(!res.ok) throw new Error('sheet');
    const text=await res.text();
    const rows=parseCSV(text).map(normalizeProduct).filter(p=>p.active);
    if(!rows.length) throw new Error('empty');
    state.products=rows;
    localStorage.setItem(C.cacheKey, JSON.stringify(rows));
  } catch(e){
    const cached=JSON.parse(localStorage.getItem(C.cacheKey)||'[]');
    state.products=cached.length?cached:demoProducts;
    if(!cached.length) toast('تعذر تحميل الشيت؛ تم عرض منتجات تجريبية لتوضيح التصميم.');
  }
  $('#loadingCard').hidden=true; renderAll();
}

const demoProducts=[
  {id:'demo1',name:'عطر الأمير - مثال',price:55000,old_price:90000,offer:true,discount_note:'عرض خاص',images:['assets/placeholder.svg'],category:'العطور',sub_category:'عطور رجالية',brand:'AB',desc:'هذا منتج تجريبي يظهر فقط عند تعذر قراءة Google Sheet. الوصف هنا يظهر كاملًا بدون قص.'},
  {id:'demo2',name:'منتج عناية - مثال',price:25000,old_price:0,offer:false,discount_note:'',images:['assets/placeholder.svg'],category:'العناية',sub_category:'العناية بالبشرة',brand:'AB',desc:'يمكن كتابة وصف طويل جدًا في الشيت وسيظهر كاملًا داخل بطاقة المنتج وصفحة التفاصيل.'}
];

function categories(){return [...new Set(state.products.map(p=>p.category).filter(Boolean))];}
function subsFor(cat){return [...new Set(state.products.filter(p=>cat==='الكل'||p.category===cat).map(p=>p.sub_category).filter(Boolean))];}
function filtered(){
  const q=state.search.toLowerCase();
  return state.products.filter(p => (!state.offersOnly || p.offer) && (state.category==='الكل'||p.category===state.category) && (state.sub==='الكل'||p.sub_category===state.sub) && (!q || [p.name,p.category,p.sub_category,p.brand,p.desc].join(' ').toLowerCase().includes(q)) );
}

function productCard(p){
  const qty=cartQty(p.id);
  return `<article class="product-card">
    <div class="product-image-wrap" data-open-product="${esc(p.id)}">
      <img class="product-image" src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='assets/placeholder.svg'">
      ${p.offer?`<span class="offer-pill">${esc(p.discount_note||'عرض')}</span>`:''}
      ${p.images.length>1?`<span class="image-count">📷 ${p.images.length}</span>`:''}
    </div>
    <div class="product-body">
      <div class="product-meta">${esc([p.category,p.sub_category,p.brand].filter(Boolean).join(' • '))}</div>
      <h3 class="product-title">${esc(p.name)}</h3>
      ${p.desc?`<p class="product-desc">${esc(p.desc)}</p>`:''}
      <div class="price-row"><span class="price">${money(p.price)}</span>${p.old_price>p.price?`<span class="old-price">${money(p.old_price)}</span>`:''}</div>
      <div class="product-actions">
        ${qty?qtyControl(p.id,qty):`<button class="add-btn" data-add="${esc(p.id)}">أضف للسلة</button>`}
        <button class="details-btn" data-open-product="${esc(p.id)}">التفاصيل</button>
      </div>
    </div>
  </article>`;
}
function qtyControl(id,qty){return `<div class="qty-control"><button data-dec="${esc(id)}">−</button><span>${qty}</span><button data-inc="${esc(id)}">+</button></div>`}

function renderCategories(){
  const cats = categories();

  $('#categoryGrid').innerHTML = cats.map((c,i) => `
    <button
      class="category-card ${state.category === c ? 'active' : ''}"
      data-category="${esc(c)}">

      <span class="category-icon">
        ${['✦','◈','◇','✧','◆'][i % 5]}
      </span>

      <strong>${esc(c)}</strong>

      <small>
        ${state.products.filter(p => p.category === c).length} منتج
      </small>
    </button>
  `).join('');
}
function renderOffers(){
  const arr=state.products.filter(p=>p.offer).slice(0,8); $('#offersGrid').innerHTML=arr.map(productCard).join(''); $('#offersEmpty').hidden=!!arr.length;
}
function renderSubfilters(){
  const subs=subsFor(state.category); const box=$('#subfilters'); box.hidden=!subs.length;
  box.innerHTML=subs.length?`<button class="chip ${state.sub==='الكل'?'active':''}" data-sub="الكل">الكل</button>`+subs.map(s=>`<button class="chip ${state.sub===s?'active':''}" data-sub="${esc(s)}">${esc(s)}</button>`).join(''):'';
}
function renderProducts(){
  const arr=filtered(); $('#productsGrid').innerHTML=arr.map(productCard).join(''); $('#productsEmpty').hidden=!!arr.length;
  $('#productsCount').textContent=`${arr.length} منتج`;
  $('#productsTitle').textContent=state.offersOnly?'كل العروض':state.category==='الكل'?'كل المنتجات':state.category;
  renderSubfilters();
}
function renderAll(){renderCategories();renderOffers();renderProducts();updateCartUI();}

function cartQty(id){return state.cart.find(x=>String(x.id)===String(id))?.qty||0}
function saveCart(){localStorage.setItem('alameer_cart_v2',JSON.stringify(state.cart));updateCartUI();renderProducts();renderOffers();}
function add(id,n=1){const x=state.cart.find(i=>String(i.id)===String(id)); if(x)x.qty+=n; else state.cart.push({id,qty:n}); saveCart();toast('تمت الإضافة إلى السلة');}
function setQty(id,qty){const x=state.cart.find(i=>String(i.id)===String(id)); if(!x&&qty>0)state.cart.push({id,qty}); else if(x)x.qty=qty; state.cart=state.cart.filter(i=>i.qty>0);saveCart();renderCart();}
function cartData(){return state.cart.map(x=>({p:byId(x.id),qty:x.qty})).filter(x=>x.p)}
function updateCartUI(){const n=state.cart.reduce((s,x)=>s+x.qty,0);$('#cartCount').textContent=n;$('#bottomCartCount').textContent=n;}
function renderCart(){
  const items=cartData();
  $('#cartItems').innerHTML=items.length?items.map(({p,qty})=>`<div class="cart-item"><img src="${esc(p.images[0])}" alt=""><div><h4>${esc(p.name)}</h4><p>${money(p.price)} × ${qty}</p>${qtyControl(p.id,qty)}</div><button class="remove-btn" data-remove="${esc(p.id)}">حذف</button></div>`).join(''):`<div class="empty-card">السلة فارغة.</div>`;
  $('#cartPieces').textContent=items.reduce((s,x)=>s+x.qty,0); $('#cartTotal').textContent=money(items.reduce((s,x)=>s+x.p.price*x.qty,0));
}

function openProduct(id){
  const p=byId(id);if(!p)return; const modal=$('#productModal');
  $('#productModalContent').innerHTML=`<div class="product-detail"><div class="gallery"><div class="gallery-main"><img id="galleryMain" src="${esc(p.images[0])}" alt="${esc(p.name)}"></div>${p.images.length>1?`<div class="thumbs">${p.images.map((im,i)=>`<button class="thumb ${i===0?'active':''}" data-thumb="${esc(im)}"><img src="${esc(im)}" alt="صورة ${i+1}"></button>`).join('')}</div>`:''}</div><div class="product-info"><span class="section-kicker">${esc([p.category,p.sub_category,p.brand].filter(Boolean).join(' • '))}</span><h2>${esc(p.name)}</h2><div class="price-row"><span class="price">${money(p.price)}</span>${p.old_price>p.price?`<span class="old-price">${money(p.old_price)}</span>`:''}${p.offer?`<span class="discount-note">${esc(p.discount_note||'عرض')}</span>`:''}</div>${p.desc?`<div class="full-desc">${esc(p.desc)}</div>`:''}<div class="detail-add"><div id="detailQty">${cartQty(p.id)?qtyControl(p.id,cartQty(p.id)):'<span></span>'}</div><button class="add-btn" data-add="${esc(p.id)}">أضف قطعة للسلة</button></div></div></div>`;
  modal.showModal();
}
function openCart(){renderCart();$('#cartModal').showModal();}

function checkout(e){
  e.preventDefault(); const items=cartData(); if(!items.length){toast('أضف منتجات إلى السلة أولًا');return;}
  const fd=new FormData(e.currentTarget); const total=items.reduce((s,x)=>s+x.p.price*x.qty,0);
  const lines=items.map((x,i)=>`${i+1}) ${x.p.name}\nالعدد: ${x.qty}\nالسعر: ${money(x.p.price)}\nالمجموع: ${money(x.p.price*x.qty)}`).join('\n\n');
  const msg=`السلام عليكم، أريد تأكيد هذا الطلب من موقع ${C.storeName}:\n\n${lines}\n\nإجمالي الطلب: ${money(total)}\nعدد القطع: ${items.reduce((s,x)=>s+x.qty,0)}\n\nبيانات الزبون:\nالاسم: ${fd.get('name')}\nرقم الهاتف: ${fd.get('phone')}\nالعنوان: ${fd.get('address')}\nأقرب نقطة دالة: ${fd.get('landmark')}\nملاحظات: ${fd.get('notes')||'لا يوجد'}\n\nيرجى تأكيد الطلب.`;
  window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2200)}
function openDrawer(v=true){$('#drawer').classList.toggle('open',v);$('#drawer').setAttribute('aria-hidden',String(!v));}

$('#menuBtn').onclick=()=>openDrawer(true);$('#closeMenuBtn').onclick=()=>openDrawer(false);$('#drawerBackdrop').onclick=()=>openDrawer(false);$$('.drawer-nav a').forEach(a=>a.onclick=()=>openDrawer(false));
$('#cartBtn').onclick=openCart;$('#bottomCartBtn').onclick=openCart;$('#checkoutForm').onsubmit=checkout;
$('#searchInput').addEventListener('input',e=>{state.search=e.target.value;renderProducts()});
$('#showAllBtn').onclick=()=>{state.category='الكل';state.sub='الكل';state.offersOnly=false;state.search='';$('#searchInput').value='';renderProducts();location.hash='products'};

document.addEventListener('click',e=>{
  const addBtn=e.target.closest('[data-add]');if(addBtn){add(addBtn.dataset.add);return}
  const inc=e.target.closest('[data-inc]');if(inc){setQty(inc.dataset.inc,cartQty(inc.dataset.inc)+1);return}
  const dec=e.target.closest('[data-dec]');if(dec){setQty(dec.dataset.dec,cartQty(dec.dataset.dec)-1);return}
  const rem=e.target.closest('[data-remove]');if(rem){setQty(rem.dataset.remove,0);return}
  const op=e.target.closest('[data-open-product]');if(op){openProduct(op.dataset.openProduct);return}
  const cat = e.target.closest('[data-category]');

if(cat){
  state.category = cat.dataset.category;
  state.sub = 'الكل';
  state.offersOnly = false;

  renderCategories();
  renderProducts();

  document.querySelector('#products')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  return;
}
  const sub=e.target.closest('[data-sub]');if(sub){state.sub=sub.dataset.sub;renderProducts();return}
  const offers=e.target.closest('[data-filter-offers]');if(offers){state.offersOnly=true;state.category='الكل';state.sub='الكل';renderProducts();location.hash='products';return}
  const th=e.target.closest('[data-thumb]');if(th){$('#galleryMain').src=th.dataset.thumb;$$('.thumb').forEach(x=>x.classList.toggle('active',x===th));return}
  const close=e.target.closest('[data-close-modal]');if(close){$('#'+close.dataset.closeModal).close();return}
});

window.addEventListener('online',()=>{$('#offlineBar').hidden=true;});window.addEventListener('offline',()=>{$('#offlineBar').hidden=false;});$('#offlineBar').hidden=navigator.onLine;
$('#year').textContent=new Date().getFullYear();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
loadProducts();
