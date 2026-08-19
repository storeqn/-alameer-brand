(() => {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwxFs75do4gJ941Agg0x6432z18qPjqkZ0ucutOCkaH-keZfDGP_xCPRhawbVXLIw8Y/exec';
  let remoteCoupons = {};

  function showMessage(message, type = 'info') {
    const result = document.getElementById('couponResult');
    if (result) {
      result.textContent = message;
      result.className = 'coupon-result ' + (type === 'error' ? 'error' : 'success');
    }
  }

  async function loadRemoteCoupons() {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=coupons&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'تعذر تحميل الكوبونات');

      remoteCoupons = {};
      (data.coupons || []).forEach(c => {
        const code = String(c.code || '').trim().toUpperCase();
        if (code) remoteCoupons[code] = c;
      });

      window.STORE_CONFIG.coupons = {};
      Object.values(remoteCoupons).forEach(c => {
        if (c.status === 'active' && c.active !== false) {
          window.STORE_CONFIG.coupons[c.code] = {
            type: c.type,
            value: Number(c.value || 0),
            min: Number(c.min || 0),
            active: true,
            start: c.start || '',
            end: c.end || ''
          };
        }
      });
    } catch (error) {
      console.error('Coupons sync error:', error);
      window.STORE_CONFIG.coupons = {};
    }
  }

  function explainCoupon(code) {
    const c = remoteCoupons[code];
    if (!c) return 'الكوبون غير صحيح';
    if (c.status === 'expired') return 'انتهت صلاحية هذا الكوبون';
    if (c.status === 'scheduled') return 'هذا الكوبون لم يبدأ بعد';
    if (c.status === 'disabled' || c.active === false) return 'هذا الكوبون متوقف حالياً';
    return '';
  }

  document.addEventListener('DOMContentLoaded', async () => {
    window.STORE_CONFIG.coupons = {};
    await loadRemoteCoupons();

    const button = document.getElementById('applyCouponBtn');
    const input = document.getElementById('couponInput');
    if (!button || !input) return;

    const original = button.onclick;
    button.onclick = async event => {
      const code = input.value.trim().toUpperCase();
      await loadRemoteCoupons();

      const reason = explainCoupon(code);
      if (reason) {
        event?.preventDefault?.();
        showMessage(reason, 'error');
        const totals = document.getElementById('couponTotals');
        if (totals) {
          totals.hidden = true;
          totals.innerHTML = '';
        }
        return;
      }

      if (typeof original === 'function') {
        original.call(button, event);
      }
    };
  });
})();
