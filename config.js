window.STORE_CONFIG = {
  storeName: "الأمير براند",

  whatsapp: "9647733949777",

  sheetCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQR4CDYOcGSOeHqY-WPr6a-dDdFGqt6f_-wxzTnIjw26haO3oeWZX4AkJ7dqIoBeXKBaNnldf1gu_8x/pub?output=csv",

  currency: "د.ع",

  locale: "ar-IQ",

  logo: "./assets/logo.png",

  instagram: "https://www.instagram.com/alameer.iq1/",

  cacheKey: "alameer_products_v1",

  demoProducts: []
};


/* =========================
   INSTAGRAM ENHANCEMENTS
========================= */

(() => {
  const instagramUrl =
    window.STORE_CONFIG.instagram ||
    "https://www.instagram.com/alameer.iq1/";

  const instagramIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5"></rect>
      <circle cx="12" cy="12" r="4.25"></circle>
      <circle cx="17.4" cy="6.7" r="1"></circle>
    </svg>
  `;

  function showInstagramToast(message){
    const toastEl = document.getElementById('toast');

    if(!toastEl){
      return;
    }

    toastEl.textContent = message;
    toastEl.classList.add('show');

    clearTimeout(toastEl._instagramTimer);

    toastEl._instagramTimer = setTimeout(
      () => toastEl.classList.remove('show'),
      2800
    );
  }

  async function copyText(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }
    catch(_){
      try{
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      }
      catch(__){
        return false;
      }
    }
  }

  function captureCheckoutMessage(form){
    if(typeof checkout !== 'function'){
      return '';
    }

    let capturedUrl = '';
    const originalOpen = window.open;

    try{
      window.open = url => {
        capturedUrl = String(url || '');
        return null;
      };

      checkout({
        preventDefault(){},
        currentTarget: form
      });
    }
    finally{
      window.open = originalOpen;
    }

    if(!capturedUrl){
      return '';
    }

    try{
      const url = new URL(capturedUrl);
      return url.searchParams.get('text') || '';
    }
    catch(_){
      const match = capturedUrl.match(/[?&]text=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : '';
    }
  }

  function addInstagramHeaderButton(){
    const topbarInner = document.querySelector('.topbar-inner');
    const cartButton = document.getElementById('cartBtn');

    if(!topbarInner || document.getElementById('instagramHeaderBtn')){
      return;
    }

    const link = document.createElement('a');
    link.id = 'instagramHeaderBtn';
    link.className = 'instagram-header-btn';
    link.href = instagramUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'حساب الأمير براند على إنستغرام');
    link.title = '@alameer.iq1';
    link.innerHTML = instagramIcon;

    if(cartButton){
      topbarInner.insertBefore(link, cartButton);
    }
    else{
      topbarInner.appendChild(link);
    }
  }

  function addInstagramCheckoutButton(){
    const form = document.getElementById('checkoutForm');

    if(!form || document.getElementById('instagramCheckoutBtn')){
      return;
    }

    const whatsappButton = form.querySelector('.checkout-button');
    const button = document.createElement('button');

    button.type = 'button';
    button.id = 'instagramCheckoutBtn';
    button.className = 'instagram-checkout-button';
    button.innerHTML = `
      ${instagramIcon}
      <span>إرسال الطلب عبر إنستغرام</span>
    `;

    button.addEventListener('click', async () => {
      if(!form.reportValidity()){
        return;
      }

      const message = captureCheckoutMessage(form);

      if(!message){
        showInstagramToast('تعذر تجهيز الطلب. تأكد من وجود منتجات في السلة.');
        return;
      }

      const copied = await copyText(message);

      if(copied){
        showInstagramToast('تم نسخ الطلب — ألصقه في رسالة إنستغرام');
      }
      else{
        showInstagramToast('افتح إنستغرام وأرسل تفاصيل الطلب للحساب');
      }

      window.open(
        instagramUrl,
        '_blank',
        'noopener'
      );
    });

    if(whatsappButton){
      whatsappButton.insertAdjacentElement('afterend', button);
    }
    else{
      form.appendChild(button);
    }
  }

  function addInstagramStyles(){
    if(document.getElementById('instagramEnhancementStyles')){
      return;
    }

    const style = document.createElement('style');
    style.id = 'instagramEnhancementStyles';
    style.textContent = `
      .topbar-inner{
        position:relative;
      }

      .instagram-header-btn{
        position:absolute;
        left:50px;
        top:50%;
        transform:translateY(-50%);
        width:38px;
        height:38px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        border-radius:12px;
        text-decoration:none;
        color:#171512;
        background:rgba(255,255,255,.78);
        border:1px solid rgba(23,21,18,.10);
        box-shadow:0 8px 22px rgba(38,30,18,.07);
        -webkit-backdrop-filter:blur(12px);
        backdrop-filter:blur(12px);
        transition:box-shadow .18s ease;
        z-index:2;
      }

      .instagram-header-btn:active{
        opacity:.78;
      }

      .instagram-header-btn svg{
        width:20px;
        height:20px;
        fill:none;
        stroke:currentColor;
        stroke-width:1.8;
        stroke-linecap:round;
        stroke-linejoin:round;
      }

      .instagram-checkout-button{
        width:100%;
        min-height:50px;
        margin-top:10px;
        border:0;
        border-radius:16px;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:9px;
        cursor:pointer;
        font:inherit;
        font-weight:800;
        color:#fff;
        background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);
        box-shadow:0 10px 26px rgba(131,58,180,.20);
      }

      .instagram-checkout-button:active{
        transform:scale(.985);
      }

      .instagram-checkout-button svg{
        width:21px;
        height:21px;
        fill:none;
        stroke:currentColor;
        stroke-width:1.8;
        stroke-linecap:round;
        stroke-linejoin:round;
      }

      @media (max-width:520px){
        .instagram-header-btn{
          left:46px;
          width:36px;
          height:36px;
          border-radius:11px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  document.addEventListener('DOMContentLoaded', () => {
    addInstagramStyles();
    addInstagramHeaderButton();
    addInstagramCheckoutButton();
  });
})();
