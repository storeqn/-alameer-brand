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
  const instagramUrl = window.STORE_CONFIG.instagram;

  const instagramIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5"></rect>
      <circle cx="12" cy="12" r="4.25"></circle>
      <circle cx="17.4" cy="6.7" r="1"></circle>
    </svg>`;

  function showInstagramToast(message){
    const t = document.getElementById('toast');
    if(!t) return;
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(t._instagramTimer);
    t._instagramTimer = setTimeout(() => t.classList.remove('show'), 3000);
  }

  async function copyText(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(_){
      try{
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly','');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      }catch(__){ return false; }
    }
  }

  function captureCheckoutMessage(form){
    if(typeof checkout !== 'function') return '';
    let capturedUrl = '';
    const originalOpen = window.open;
    try{
      window.open = url => { capturedUrl = String(url || ''); return null; };
      checkout({preventDefault(){}, currentTarget:form});
    }finally{
      window.open = originalOpen;
    }
    if(!capturedUrl) return '';
    try{
      const url = new URL(capturedUrl);
      return url.searchParams.get('text') || '';
    }catch(_){
      const match = capturedUrl.match(/[?&]text=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : '';
    }
  }

  function addInstagramHeaderButton(){
    const topbarInner = document.querySelector('.topbar-inner');
    const cartButton = document.getElementById('cartBtn');
    if(!topbarInner || document.getElementById('instagramHeaderBtn')) return;

    const link = document.createElement('a');
    link.id = 'instagramHeaderBtn';
    link.className = 'instagram-header-btn';
    link.href = instagramUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label','حساب الأمير براند على إنستغرام');
    link.title = '@alameer.iq1';
    link.innerHTML = instagramIcon;

    if(cartButton) topbarInner.insertBefore(link, cartButton);
    else topbarInner.appendChild(link);
  }

  function addInstagramCheckoutButtons(){
    const form = document.getElementById('checkoutForm');
    if(!form || document.getElementById('instagramCopyBtn')) return;

    const whatsappButton = form.querySelector('.checkout-button');
    const wrap = document.createElement('div');
    wrap.className = 'instagram-order-tools';
    wrap.innerHTML = `
      <button type="button" id="instagramCopyBtn" class="instagram-copy-button">
        ${instagramIcon}
        <span>نسخ الطلب للإنستغرام</span>
      </button>
      <a class="instagram-open-button" href="${instagramUrl}" target="_blank" rel="noopener noreferrer">
        فتح إنستغرام ولصق الطلب
      </a>`;

    const copyBtn = wrap.querySelector('#instagramCopyBtn');
    copyBtn.addEventListener('click', async () => {
      if(!form.reportValidity()) return;
      const message = captureCheckoutMessage(form);
      if(!message){
        showInstagramToast('تعذر تجهيز الطلب. تأكد من وجود منتجات في السلة.');
        return;
      }
      const copied = await copyText(message);
      showInstagramToast(
        copied
          ? 'تم نسخ الطلب ✓ الآن اضغط «فتح إنستغرام» ثم الصقه في الرسالة'
          : 'تعذر النسخ تلقائياً. حاول مرة أخرى.'
      );
    });

    if(whatsappButton) whatsappButton.insertAdjacentElement('afterend', wrap);
    else form.appendChild(wrap);
  }

  function addInstagramStyles(){
    if(document.getElementById('instagramEnhancementStyles')) return;
    const style = document.createElement('style');
    style.id = 'instagramEnhancementStyles';
    style.textContent = `
      .topbar-inner{position:relative;}
      .instagram-header-btn{
        position:absolute;left:50px;top:50%;transform:translateY(-50%);
        width:38px;height:38px;display:inline-flex;align-items:center;justify-content:center;
        border-radius:12px;text-decoration:none;color:#171512;background:rgba(255,255,255,.78);
        border:1px solid rgba(23,21,18,.10);box-shadow:0 8px 22px rgba(38,30,18,.07);
        -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);z-index:2;
      }
      .instagram-header-btn:active{opacity:.78;}
      .instagram-header-btn svg,.instagram-copy-button svg{
        width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;
        stroke-linecap:round;stroke-linejoin:round;
      }
      .instagram-order-tools{margin-top:10px;display:grid;gap:8px;}
      .instagram-copy-button{
        width:100%;min-height:50px;border:0;border-radius:16px;display:flex;align-items:center;
        justify-content:center;gap:9px;cursor:pointer;font:inherit;font-weight:800;color:#fff;
        background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);
        box-shadow:0 10px 26px rgba(131,58,180,.20);
      }
      .instagram-copy-button:active{transform:scale(.985);}
      .instagram-open-button{
        min-height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;
        text-decoration:none;font-weight:800;color:#171512;background:#fff;border:1px solid rgba(23,21,18,.12);
      }
      @media(max-width:520px){
        .instagram-header-btn{left:46px;width:36px;height:36px;border-radius:11px;}
      }`;
    document.head.appendChild(style);
  }

  document.addEventListener('DOMContentLoaded', () => {
    addInstagramStyles();
    addInstagramHeaderButton();
    addInstagramCheckoutButtons();
  });
})();
