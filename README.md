# الأمير براند — GitHub Pages Store

متجر عربي RTL جاهز للنشر على GitHub Pages، يجلب المنتجات من Google Sheets CSV ويرسل السلة وبيانات العميل إلى WhatsApp.

## النشر على GitHub
1. أنشئ Repository جديد مثل `alameer-brand`.
2. ارفع جميع ملفات هذا المجلد إلى جذر المشروع.
3. من Settings → Pages اختر Deploy from a branch ثم `main` و `/root`.
4. افتح رابط GitHub Pages بعد النشر.

## الشعار
تم استخدام شعار الأمير براند المستخرج من تصميمك السابق. إذا رغبت باستبداله بنسخة الشعار الأصلية عالية الدقة:
- استبدل `assets/logo.png` بشعارك، أو عدّل مسار الشعار في `index.html`.
- يفضل PNG بخلفية شفافة.

## Google Sheet
الرابط موجود في `config.js`. الموقع يدعم الأعمدة القديمة والجديدة:

`id,name,price,old_price,offer,discount_note,image,images,category,desc,sub_category,brand,active`

### تعدد الصور
- `image`: الصورة الرئيسية القديمة وتستمر بالعمل.
- `images`: صور إضافية، افصل الروابط بعلامة `|` أو `;`.

مثال:
`https://site.com/1.jpg | https://site.com/2.jpg | https://site.com/3.jpg`

### العروض
يظهر المنتج في قسم **العروض** تلقائيًا عند تحقق أي شرط:
- `offer` = نعم / yes / true / 1
- أو `old_price` أكبر من `price`
- أو `discount_note` غير فارغ.

### الوصف
ضع النص الكامل في `desc`. لا يوجد line-clamp أو قص؛ يظهر الوصف كاملًا مع الحفاظ على الأسطر.

## الطلب على واتساب
الرقم مضبوط في `config.js` بصيغة دولية: `9647733949777`.
رسالة الطلب تتضمن: المنتجات، الكميات، الأسعار، الإجمالي، الاسم، الهاتف، العنوان، أقرب نقطة دالة، والملاحظات.

## PWA / شبه تطبيق
الملفات `manifest.webmanifest` و `sw.js` تجعل الموقع قابلًا للإضافة إلى الشاشة الرئيسية وتوفر Cache للواجهة.
- iPhone/iPad: Safari → Share → Add to Home Screen.
- Android/Chrome: Add to Home screen / Install app.
- Desktop Chrome/Edge: Install من شريط العنوان عند توفر الخيار.

## ملاحظة تحديث المنتجات
الموقع يحاول قراءة الشيت مباشرة كل مرة، ويحتفظ بآخر نسخة ناجحة محليًا لاستخدامها عند ضعف/انقطاع الاتصال.
