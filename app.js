const C = window.STORE_CONFIG;

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('alameer_cart_v2') || '[]'),
  category: 'الكل',
  brand: 'الكل',
  search: '',
  offersOnly: false,
  sort: 'default',
  openProductId: null
};

const money = v =>
  `${Number(v || 0).toLocaleString('ar-IQ')} ${C.currency}`;

const norm = v => String(v ?? '').trim();

const truthy = v =>
  ['1','true','yes','y','نعم','عرض','offer']
  .includes(norm(v).toLowerCase());

const esc = s =>
  String(s ?? '').replace(/[&<>'"]/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c]));

const byId = id =>
  state.products.find(p => String(p.id) === String(id));


/* =========================
   CSV
========================= */

function parseCSV(text){

  const rows=[];
  let row=[];
  let cell='';
  let q=false;

  for(let i=0;i<text.length;i++){

    const ch=text[i];
    const nx=text[i+1];

    if(ch==='"' && q && nx==='"'){
      cell+='"';
      i++;
    }

    else if(ch==='"'){
      q=!q;
    }

    else if(ch===',' && !q){
      row.push(cell);
      cell='';
    }

    else if((ch==='\n'||ch==='\r') && !q){

      if(ch==='\r'&&nx==='\n') i++;

      row.push(cell);
      cell='';

      if(row.some(x=>x.trim()!=='')) rows.push(row);

      row=[];
    }

    else{
      cell+=ch;
    }
  }

  row.push(cell);

  if(row.some(x=>x.trim()!=='')) rows.push(row);

  if(!rows.length) return [];

  const headers=
    rows.shift().map(h=>h.trim().toLowerCase());

  return rows.map(r=>
    Object.fromEntries(
      headers.map((h,i)=>[
        h,
        (r[i]??'').trim()
      ])
    )
  );
}


/* =========================
   PRODUCT
========================= */

function normalizeProduct(r, idx){

  const imagesRaw =
    r.images ||
    r.image_urls ||
    r.gallery ||
    '';

  const images = [
    r.image,
    ...imagesRaw.split(/\s*[|;\n]\s*/)
  ]
  .map(norm)
  .filter(Boolean);

  const uniqImages =
    [...new Set(images)];

  const price =
    Number(
      String(r.price||0).replace(/[^\d.]/g,'')
    ) || 0;

  const oldPrice =
    Number(
      String(r.old_price || r.oldprice || 0)
      .replace(/[^\d.]/g,'')
    ) || 0;

  const offer =
    truthy(r.offer) ||
    truthy(r.is_offer) ||
    (oldPrice > price && price > 0) ||
    !!norm(r.discount_note);

  return {

    id: norm(r.id) || `p${idx+1}`,

    name: norm(r.name) || 'منتج',

    price,

    old_price: oldPrice,

    offer,

    discount_note: norm(r.discount_note),

    images:
      uniqImages.length
      ? uniqImages
      : ['assets/logo.png'],

    category:
      norm(r.category) || 'أخرى',

    brand:
      norm(r.brand) || '',

    desc:
      norm(r.desc || r.description),

    active:
      r.active === ''
      ? true
      : !['0','false','no','لا']
        .includes(norm(r.active).toLowerCase())
  };
}


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts(){

  // عرض المنتجات المحفوظة فورًا
  let cached = [];

  try{
    cached = JSON.parse(
      localStorage.getItem(C.cacheKey) || '[]'
    );
  }catch(e){
    cached = [];
  }

  if(cached.length){
    state.products = cached;

    if($('#loadingCard'))
      $('#loadingCard').hidden = true;

    renderAll();
  }else{
    if($('#loadingCard'))
      $('#loadingCard').hidden = false;
  }

  // بعدها تحديث المنتجات من Google Sheets
  try{

    const res = await fetch(C.sheetCsvUrl, {
      cache: 'default'
    });

    if(!res.ok)
      throw new Error('sheet');

    const text = await res.text();

    const rows = parseCSV(text)
      .map(normalizeProduct)
      .filter(p => p.active);

    if(!rows.length)
      throw new Error('empty');

    state.products = rows;

    localStorage.setItem(
      C.cacheKey,
      JSON.stringify(rows)
    );

    if($('#loadingCard'))
      $('#loadingCard').hidden = true;

    renderAll();

  }catch(e){

    if(!cached.length){

      state.products = demoProducts;

      if($('#loadingCard'))
        $('#loadingCard').hidden = true;

      renderAll();

      toast('تعذر تحميل المنتجات.');
    }
  }
}

const demoProducts=[
  {
    id:'demo1',
    name:'منتج تجريبي',
    price:0,
    old_price:0,
    offer:false,
    discount_note:'',
    images:['assets/logo.png'],
    category:'أخرى',
    brand:'AB',
    desc:'منتج تجريبي.'
  }
];


/* =========================
   FILTERS
========================= */

function categories(){

  return [
    ...new Set(
      state.products
      .map(p=>p.category)
      .filter(Boolean)
    )
  ];
}


function brands(){

  return [
    ...new Set(
      state.products
      .map(p=>p.brand)
      .filter(Boolean)
    )
  ].sort((a,b)=>a.localeCompare(b,'ar'));
}


function filtered(){

  const q =
    state.search.toLowerCase().trim();

  let arr =
    state.products.filter(p=>{

      const offerOk =
        !state.offersOnly || p.offer;

      const categoryOk =
        state.category === 'الكل' ||
        p.category === state.category;

      const brandOk =
        state.brand === 'الكل' ||
        p.brand === state.brand;

      const searchText = `
        ${p.name || ''}
        ${p.category || ''}
        ${p.brand || ''}
        ${p.desc || ''}
      `.toLowerCase();

      const searchOk =
        !q || searchText.includes(q);

      return (
        offerOk &&
        categoryOk &&
        brandOk &&
        searchOk
      );
    });


  if(state.sort === 'price-low'){
    arr.sort(
      (a,b)=>Number(a.price||0)-Number(b.price||0)
    );
  }

  if(state.sort === 'price-high'){
    arr.sort(
      (a,b)=>Number(b.price||0)-Number(a.price||0)
    );
  }

  if(state.sort === 'name'){
    arr.sort(
      (a,b)=>a.name.localeCompare(b.name,'ar')
    );
  }

  return arr;
}


/* =========================
   PRODUCT CARD
========================= */

function productCard(p, index){

  const qty = cartQty(p.id);

  return `
  <article class="product-card">

    <div
      class="product-image-wrap"
      data-open-product="${esc(p.id)}">

      <img
  class="product-image"
  src="${esc(p.images[0])}"
  alt="${esc(p.name)}"
  loading="${index < 4 ? 'eager' : 'lazy'}"
  decoding="async"
  fetchpriority="${index < 4 ? 'high' : 'low'}"
  onerror="this.src='assets/logo.png'"
>
      ${
        p.offer
        ? `<span class="offer-pill">
            ${esc(p.discount_note || 'عرض')}
           </span>`
        : ''
      }

      ${
        p.images.length>1
        ? `<span class="image-count">
            📷 ${p.images.length}
           </span>`
        : ''
      }

    </div>

    <div class="product-body">

      <div class="product-meta">
        ${esc(
          [p.category,p.brand]
          .filter(Boolean)
          .join(' • ')
        )}
      </div>

      <h3
        class="product-title"
        data-open-product="${esc(p.id)}">
        ${esc(p.name)}
      </h3>

      ${
        p.desc
        ? `<p class="product-desc">${esc(p.desc)}</p>`
        : ''
      }

      ${
        p.price > 0
        ? `
        <div class="price-row">

          <span class="price">
            ${money(p.price)}
          </span>

          ${
            p.old_price > p.price
            ? `
            <span class="old-price">
              ${money(p.old_price)}
            </span>`
            : ''
          }

        </div>`
        : ''
      }

      <div class="product-actions">

        ${
          qty
          ? qtyControl(p.id,qty)
          : `
          <button
            class="add-btn"
            data-add="${esc(p.id)}">
            أضف للسلة
          </button>`
        }

        <button
          class="details-btn"
          data-open-product="${esc(p.id)}">
          التفاصيل
        </button>

      </div>

    </div>

  </article>
  `;
}


function qtyControl(id,qty){

  return `
  <div class="qty-control">

    <button data-dec="${esc(id)}">−</button>

    <span>${qty}</span>

    <button data-inc="${esc(id)}">+</button>

  </div>
  `;
}


/* =========================
   CATEGORIES
========================= */

function renderCategories(){

  const cats = categories();

  $('#categoryGrid').innerHTML = `

    <button
      class="category-card ${
        state.category === 'الكل'
        ? 'active'
        : ''
      }"
      data-category="الكل">

      <span class="category-icon">◉</span>

      <strong>كل الأقسام</strong>

      <small>
        ${state.products.length} منتج
      </small>

    </button>

    ${cats.map((c,i)=>`

      <button
        class="category-card ${
          state.category === c
          ? 'active'
          : ''
        }"
        data-category="${esc(c)}">

        <span class="category-icon">
          ${['✦','◈','◇','✧','◆'][i%5]}
        </span>

        <strong>${esc(c)}</strong>

        <small>
          ${
            state.products.filter(
              p=>p.category===c
            ).length
          }
          منتج
        </small>

      </button>

    `).join('')}
  `;
}


/* =========================
   OFFERS
========================= */

function renderOffers(){

  const arr =
    state.products
    .filter(p=>p.offer)
    .slice(0,8);

  $('#offersGrid').innerHTML =
    arr.map(productCard).join('');

  $('#offersEmpty').hidden =
    !!arr.length;
}


/* =========================
   BRAND + SORT
========================= */

function renderSubfilters(){

  const box = $('#subfilters');

  if(!box) return;

  const list = brands();

  box.hidden=false;

  box.innerHTML=`

    <div class="brand-filter">

      <button
        class="chip ${
          state.brand === 'الكل'
          ? 'active'
          : ''
        }"
        data-brand="الكل">

        كل البراندات

      </button>

      ${list.map(b=>`

        <button
          class="chip ${
            state.brand === b
            ? 'active'
            : ''
          }"
          data-brand="${esc(b)}">

          ${esc(b)}

        </button>

      `).join('')}

    </div>

    <select
      id="priceSort"
      class="sort-select">

      <option value="default"
        ${
          state.sort==='default'
          ? 'selected'
          : ''
        }>
        الترتيب الافتراضي
      </option>

      <option value="price-low"
        ${
          state.sort==='price-low'
          ? 'selected'
          : ''
        }>
        السعر: الأقل إلى الأعلى
      </option>

      <option value="price-high"
        ${
          state.sort==='price-high'
          ? 'selected'
          : ''
        }>
        السعر: الأعلى إلى الأقل
      </option>

      <option value="name"
        ${
          state.sort==='name'
          ? 'selected'
          : ''
        }>
        حسب الاسم
      </option>

    </select>
  `;
}


/* =========================
   PRODUCTS
========================= */

function renderProducts(){

  const arr = filtered();

  $('#productsGrid').innerHTML =
    arr.map(productCard).join('');

  $('#productsEmpty').hidden =
    !!arr.length;

  $('#productsCount').textContent =
    `${arr.length} منتج`;

  let title='كل المنتجات';

  if(state.offersOnly)
    title='كل العروض';

  else if(state.brand !== 'الكل')
    title=`منتجات ${state.brand}`;

  else if(state.category !== 'الكل')
    title=state.category;

  $('#productsTitle').textContent =
    title;

  renderSubfilters();
}


function renderAll(){

  renderCategories();
  renderOffers();
  renderProducts();
  updateCartUI();
}


/* =========================
   CART
========================= */

function cartQty(id){

  return (
    state.cart.find(
      x=>String(x.id)===String(id)
    )?.qty || 0
  );
}


function saveCart(){

  localStorage.setItem(
    'alameer_cart_v2',
    JSON.stringify(state.cart)
  );

  updateCartUI();

  renderProducts();

  renderOffers();

  if($('#cartModal')?.open)
    renderCart();
}


function add(id,n=1){

  const x =
    state.cart.find(
      i=>String(i.id)===String(id)
    );

  if(x){
    x.qty+=n;
  }

  else{
    state.cart.push({
      id,
      qty:n
    });
  }

  saveCart();

  const qty=cartQty(id);

  const detailQty=$('#detailQty');

  if(
    detailQty &&
    String(state.openProductId)===String(id)
  ){
    detailQty.innerHTML=
      qtyControl(id,qty);
  }

  toast(
    `تمت الإضافة للسلة • العدد ${qty}`
  );
}


function setQty(id,qty){

  const x =
    state.cart.find(
      i=>String(i.id)===String(id)
    );

  if(!x && qty>0){

    state.cart.push({
      id,
      qty
    });

  }

  else if(x){

    x.qty=qty;

  }

  state.cart =
    state.cart.filter(i=>i.qty>0);

  saveCart();
}


function cartData(){

  return state.cart
    .map(x=>({
      p:byId(x.id),
      qty:x.qty
    }))
    .filter(x=>x.p);
}


function updateCartUI(){

  const n =
    state.cart.reduce(
      (s,x)=>s+x.qty,
      0
    );

  if($('#cartCount'))
    $('#cartCount').textContent=n;

  if($('#bottomCartCount'))
    $('#bottomCartCount').textContent=n;
}


function renderCart(){

  const items = cartData();

  $('#cartItems').innerHTML =

    items.length

    ? items.map(({p,qty})=>`

      <div class="cart-item">

        <img
          src="${esc(p.images[0])}"
          alt="${esc(p.name)}">

        <div>

          <h4>
            ${esc(p.name)}
          </h4>

          ${
            p.price > 0
            ? `
            <p>
              ${money(p.price)} × ${qty}
            </p>`
            : ''
          }

          ${qtyControl(p.id,qty)}

        </div>

        <button
          class="remove-btn"
          data-remove="${esc(p.id)}">

          حذف

        </button>

      </div>

    `).join('')

    : `
      <div class="empty-card">
        السلة فارغة.
      </div>
    `;


  $('#cartPieces').textContent =
    items.reduce(
      (s,x)=>s+x.qty,
      0
    );


  const total =
    items.reduce(
      (s,x)=>
        s+(x.p.price*x.qty),
      0
    );


  $('#cartTotal').textContent =
    money(total);


  let clearTools =
    $('#cartClearTools');

  if(!clearTools){

    $('#cartItems').insertAdjacentHTML(
      'beforebegin',
      `
      <div
        class="cart-tools"
        id="cartClearTools">

        <button
          type="button"
          class="clear-cart-btn"
          data-clear-cart>

          حذف السلة بالكامل

        </button>

      </div>
      `
    );
  }

  const clearBtn =
    $('[data-clear-cart]');

  if(clearBtn)
    clearBtn.hidden=!items.length;
}


/* =========================
   PRODUCT DETAILS
========================= */

function openProduct(id){

  const p = byId(id);

  if(!p) return;

  state.openProductId=id;

  const modal =
    $('#productModal');
  
  document.body.style.overflow = 'hidden';

  $('#productModalContent').innerHTML=`

  <div class="product-detail">

    <div class="gallery">

      <div class="gallery-main">

        <img
          id="galleryMain"
          src="${esc(p.images[0])}"
          alt="${esc(p.name)}">

      </div>

      ${
        p.images.length>1
        ? `
        <div class="thumbs">

          ${p.images.map((im,i)=>`

            <button
              class="thumb ${
                i===0?'active':''
              }"
              data-thumb="${esc(im)}">

              <img
                src="${esc(im)}"
                alt="صورة ${i+1}">

            </button>

          `).join('')}

        </div>`
        : ''
      }

    </div>


    <div class="product-info">

     <div class="section-kicker">

  ${
    p.category
    ? `
    <button
      type="button"
      class="detail-filter-link"
      data-detail-category="${esc(p.category)}">
      ${esc(p.category)}
    </button>
    `
    : ''
  }

  ${
    p.category && p.brand
    ? `<span class="detail-separator">•</span>`
    : ''
  }

  ${
    p.brand
    ? `
    <button
      type="button"
      class="detail-filter-link"
      data-detail-brand="${esc(p.brand)}">
      ${esc(p.brand)}
    </button>
    `
    : ''
  }

</div>

      <h2>${esc(p.name)}</h2>

      ${
        p.price>0
        ? `
        <div class="price-row">

          <span class="price">
            ${money(p.price)}
          </span>

          ${
            p.old_price>p.price
            ? `
            <span class="old-price">
              ${money(p.old_price)}
            </span>`
            : ''
          }

        </div>`
        : ''
      }

      ${
        p.desc
        ? `
        <div class="full-desc">
          ${esc(p.desc)}
        </div>`
        : ''
      }

      <div class="detail-add">

        <div id="detailQty">

          ${
            cartQty(p.id)
            ? qtyControl(
                p.id,
                cartQty(p.id)
              )
            : ''
          }

        </div>

        <button
          class="add-btn"
          data-add="${esc(p.id)}">

          أضف قطعة للسلة

        </button>

      </div>

    </div>

  </div>
  `;

  modal.showModal();
}


/* =========================
   OPEN / CLOSE CART
========================= */

let cartScrollY=0;

function openCart(){

  renderCart();

  cartScrollY =
    window.scrollY || 0;

  document.body.classList.add(
    'cart-open'
  );

  document.body.style.top =
    `-${cartScrollY}px`;

  $('#cartModal').showModal();

  setTimeout(()=>{

    const first =
      $('#cartModal input');

    if(first)
      first.blur();

  },50);
}


function closeCart(){

  if($('#cartModal')?.open)
    $('#cartModal').close();

  document.body.classList.remove(
    'cart-open'
  );

  document.body.style.top='';

  window.scrollTo(
    0,
    cartScrollY
  );
}


/* =========================
   WHATSAPP CHECKOUT
========================= */

function checkout(e){

  e.preventDefault();

  const items =
    cartData();

  if(!items.length){

    toast('السلة فارغة');

    return;
  }


  const fd =
    new FormData(
      e.currentTarget
    );


  const beforeDiscount =
    items.reduce(
      (sum,x)=>{

        const unit =
          x.p.old_price > x.p.price
          ? x.p.old_price
          : x.p.price;

        return sum+
          unit*x.qty;

      },
      0
    );


  const afterDiscount =
    items.reduce(
      (sum,x)=>
        sum+
        (x.p.price*x.qty),
      0
    );


  const saving =
    Math.max(
      0,
      beforeDiscount-afterDiscount
    );


  const num =
    n=>
      Number(n||0)
      .toLocaleString('en-US');


  const productsText =
    items.map((x,i)=>

      `${i+1}) ${x.p.name}` +
      ` | عدد: ${x.qty}` +
      ` | سعر: ${num(x.p.price)}` +
      ` | مجموع: ${num(x.p.price*x.qty)}`

    ).join('\n');


  const name =
    fd.get('name') || '';

  const phone =
    fd.get('phone') || '';

  const address =
    fd.get('address') || '';

  const landmark =
    fd.get('landmark') || '';

  const notes =
    fd.get('notes') || '';


  let fullAddress =
    address;

  if(landmark){

    fullAddress +=
      ` - أقرب نقطة دالة: ${landmark}`;

  }


  let msg =

`طلب جديد - كوزمتك الأمير براند AB

الاسم: ${name}
الهاتف: ${phone}
العنوان: ${fullAddress}

المنتجات:
${productsText}

الإجمالي قبل الخصم: ${num(beforeDiscount)}
الإجمالي بعد الخصم: ${num(afterDiscount)}
التوفير: ${num(saving)}`;


  if(notes){

    msg +=
      `\n\nملاحظات: ${notes}`;

  }


  window.open(
    `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`,
    '_blank',
    'noopener'
  );
}


/* =========================
   TOAST
========================= */

function toast(msg){

  const t=$('#toast');

  if(!t) return;

  t.textContent=msg;

  t.classList.add('show');

  clearTimeout(t._x);

  t._x=
    setTimeout(
      ()=>t.classList.remove('show'),
      2200
    );
}


/* =========================
   DRAWER
========================= */

function openDrawer(v=true){

  $('#drawer')
  .classList
  .toggle('open',v);

  $('#drawer')
  .setAttribute(
    'aria-hidden',
    String(!v)
  );
}


/* =========================
   VIEW
========================= */

function storeView(mode){

  const hero =
    document.querySelector('.hero');

  const toolbar =
    document.querySelector('.toolbar');

  const offers =
    document.querySelector('#offers');

  const categories =
    document.querySelector('#categories');

  const products =
    document.querySelector('#products');


  if(mode==='home'){

    if(hero) hero.hidden=false;
    if(toolbar) toolbar.hidden=false;
    if(offers) offers.hidden=false;
    if(categories) categories.hidden=false;
    if(products) products.hidden=false;

  }


  if(mode==='categories'){

    if(hero) hero.hidden=true;
    if(toolbar) toolbar.hidden=true;
    if(offers) offers.hidden=true;

    if(categories)
      categories.hidden=false;

    if(products)
      products.hidden=true;

  }


  if(mode==='products'){

    if(hero) hero.hidden=true;
    if(offers) offers.hidden=true;

    if(toolbar)
      toolbar.hidden=false;

    if(categories)
      categories.hidden=true;

    if(products)
      products.hidden=false;

  }
}


function resetStoreFilters(){

  state.category='الكل';
  state.brand='الكل';
  state.offersOnly=false;
  state.search='';
  state.sort='default';

  if($('#searchInput')){
    $('#searchInput').value='';
  }

  renderCategories();
  renderProducts();
}


/* =========================
   BUTTON EVENTS
========================= */

if($('#menuBtn'))
  $('#menuBtn').onclick=
    ()=>openDrawer(true);

if($('#closeMenuBtn'))
  $('#closeMenuBtn').onclick=
    ()=>openDrawer(false);

if($('#drawerBackdrop'))
  $('#drawerBackdrop').onclick=
    ()=>openDrawer(false);


$$('.drawer-nav a')
.forEach(
  a=>a.onclick=
    ()=>openDrawer(false)
);


if($('#cartBtn'))
  $('#cartBtn').onclick=
    openCart;

if($('#bottomCartBtn'))
  $('#bottomCartBtn').onclick=
    openCart;

if($('#checkoutForm'))
  $('#checkoutForm').onsubmit=
    checkout;


if($('#searchInput')){

  $('#searchInput')
  .addEventListener(
    'input',
    e=>{

      state.search=
        e.target.value;

      renderProducts();

    }
  );
}


if($('#showAllBtn')){

  $('#showAllBtn').onclick=
    ()=>{

      resetStoreFilters();

      storeView('home');

      location.hash='products';

    };
}


/* =========================
   GLOBAL CLICK
========================= */

document.addEventListener(
  'click',
  e=>{


    const addBtn =
      e.target.closest('[data-add]');

    if(addBtn){

      add(addBtn.dataset.add);

      return;
    }


    const inc =
      e.target.closest('[data-inc]');

    if(inc){

      setQty(
        inc.dataset.inc,
        cartQty(inc.dataset.inc)+1
      );

      return;
    }


    const dec =
      e.target.closest('[data-dec]');

    if(dec){

      setQty(
        dec.dataset.dec,
        cartQty(dec.dataset.dec)-1
      );

      return;
    }


    const rem =
      e.target.closest('[data-remove]');

    if(rem){

      setQty(
        rem.dataset.remove,
        0
      );

      return;
    }


    const clearCart =
      e.target.closest(
        '[data-clear-cart]'
      );

    if(clearCart){

      if(state.cart.length){

        state.cart=[];

        saveCart();

        renderCart();

        toast(
          'تم حذف السلة بالكامل'
        );
      }

      return;
    }


    const op =
      e.target.closest(
        '[data-open-product]'
      );

    if(op){

      openProduct(
        op.dataset.openProduct
      );

      return;
    }


    const homeBtn =
      e.target.closest(
        'a[href="#home"], [data-go-home]'
      );

    if(homeBtn){

      e.preventDefault();

      resetStoreFilters();

      storeView('home');

      window.scrollTo({
        top:0,
        behavior:'smooth'
      });

      return;
    }


    const categoriesBtn =
      e.target.closest(
        'a[href="#categories"], [data-go-categories]'
      );

    if(categoriesBtn){

      e.preventDefault();

      state.category='الكل';
      state.brand='الكل';
      state.offersOnly=false;

      renderCategories();

      storeView('categories');

      document
      .querySelector('#categories')
      ?.scrollIntoView({
        behavior:'smooth',
        block:'start'
      });

      return;
    }


    const cat =
      e.target.closest(
        '[data-category]'
      );

    if(cat){

      state.category=
        cat.dataset.category;

      state.brand='الكل';
      state.offersOnly=false;

      renderCategories();

      renderProducts();

      storeView('products');

      document
      .querySelector('#products')
      ?.scrollIntoView({
        behavior:'smooth',
        block:'start'
      });

      return;
    }


    const brand =
      e.target.closest(
        '[data-brand]'
      );

    if(brand){

      state.brand =
        brand.dataset.brand;

      state.offersOnly=false;

      renderProducts();

      return;
    }


    const offers =
      e.target.closest(
        '[data-filter-offers]'
      );

    if(offers){

      state.offersOnly=true;

      state.category='الكل';
      state.brand='الكل';

      renderCategories();

      renderProducts();

      storeView('products');

      return;
    }

    const detailCategory =
  e.target.closest(
    '[data-detail-category]'
  );

if(detailCategory){

  state.category =
    detailCategory.dataset.detailCategory;

  state.brand = 'الكل';
  state.offersOnly = false;

  $('#productModal')?.close();
  document.body.style.overflow = '';
  state.openProductId = null;

  renderCategories();
  renderProducts();

  storeView('products');

  document
    .querySelector('#products')
    ?.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });

  return;
}


const detailBrand =
  e.target.closest(
    '[data-detail-brand]'
  );

if(detailBrand){

  state.brand =
    detailBrand.dataset.detailBrand;

  state.category = 'الكل';
  state.offersOnly = false;

  $('#productModal')?.close();
  document.body.style.overflow = '';
  state.openProductId = null;

  renderCategories();
  renderProducts();

  storeView('products');

  document
    .querySelector('#products')
    ?.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });

  return;
}
    

    const th =
      e.target.closest(
        '[data-thumb]'
      );

    if(th){

      $('#galleryMain').src =
        th.dataset.thumb;

      $$('.thumb')
      .forEach(
        x=>
          x.classList.toggle(
            'active',
            x===th
          )
      );

      return;
    }


    const close =
  e.target.closest(
    '[data-close-modal]'
  );

if(close){

  const id =
    close.dataset.closeModal;

  if(id==='cartModal'){

    closeCart();

  }

  else if(id==='productModal'){

    $('#productModal')?.close();

    document.body.style.overflow = '';

    state.openProductId = null;

  }

  else{

    $('#'+id)?.close();

  }

  return;
}
  }
);


/* =========================
   SORT
========================= */

document.addEventListener(
  'change',
  e=>{

    if(e.target.id==='priceSort'){

      state.sort=
        e.target.value;

      renderProducts();

    }

  }
);


/* =========================
   CART CLOSE
========================= */

$('#cartModal')
?.addEventListener(
  'close',
  ()=>{

    if(
      document.body
      .classList
      .contains('cart-open')
    ){

      document.body
      .classList
      .remove('cart-open');

      document.body.style.top='';

      window.scrollTo(
        0,
        cartScrollY
      );
    }

  }
);


/* =========================
   ONLINE
========================= */

window.addEventListener(
  'online',
  ()=>{
    if($('#offlineBar'))
      $('#offlineBar').hidden=true;
  }
);


window.addEventListener(
  'offline',
  ()=>{
    if($('#offlineBar'))
      $('#offlineBar').hidden=false;
  }
);


if($('#offlineBar'))
  $('#offlineBar').hidden=
    navigator.onLine;


if($('#year'))
  $('#year').textContent=
    new Date().getFullYear();


/* =========================
   SERVICE WORKER
========================= */

if('serviceWorker' in navigator){

  window.addEventListener(
    'load',
    ()=>
      navigator
      .serviceWorker
      .register('./sw.js')
      .catch(()=>{})
  );
}


/* =========================
   START
========================= */

loadProducts();
