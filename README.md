# 🏛️ منصة مضيافة | Smart Madyafa Platform (Next.js PWA)

نظام متكامل لإدارة "المضايف والجمعيات الخدمية وصناديق العائلات" (Multi-Tenant Community Fund Management Platform) مصمم خصيصاً للموبايل مع معمارية **Offline-First** وثيم ليلي فاخر (Dark Night Mode).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmohamdhamd%2Fmadyafa&env=MONGODB_URI,JWT_SECRET)

---

## ✨ المميزات الرئيسية

1. **العمل أوفلاين مع المزامنة التلقائية (Offline-First Sync Engine):**
   - حفظ فوري لأي عملية على المتصفح عبر `IndexedDB (Dexie.js)` بدون انتظار الخادم (Optimistic UI).
   - رفع البيانات تلقائياً إلى `MongoDB Atlas` السحابي عند توفر الإنترنت.
   - شارة حالة المزامنة اللحظية (🟢 متزامن / 🟠 أوفلاين / 🔄 جاري المزامنة).

2. **الجدول الذكي المخصص للهواتف (Mobile-First Matrix Table):**
   - **عمود الأسماء الثابت (Sticky Right Column):** يظل اسم العضو ورقمه ثابتاً أثناء التمرير الأفقي.
   - **التوليد التلقائي للأعمدة (Auto-Expanding Columns):** عند التأشير بالدفع في آخر عمود، يتم تلقائياً إنشاء العمود التالي بالاسم والقيمة الافتراضية.
   - **تفاصيل متقدمة لكل خلية:** دفع كامل، دفع جزء، إعفاء، وإضافة ملاحظات (فودافون كاش، إنستا باي).

3. **الخزينة والمصروفات وتقارير واتساب:**
   - شريط إحصائي حي لحساب إجمالي المحصل، المتبقي، ونسبة التحصيل، وصافي الخزينة بعد خصم المصروفات.
   - تقارير واتساب منسقة بضغطة زر.
   - إيصالات دفع إلكترونية نصية لكل عضو.

4. **صفحة المشاهدة العامة للمشتركين (`/view/[publicSlug]`):**
   - رابط مخصص للقراءة فقط لأعضاء الجمعية للبحث عن أسمائهم ومتابعة حالة مدفوعاتهم بشفافية كاملة.

5. **تطبيق ويب تقدمي (PWA):**
   - قابل للتثبيت على الهواتف الذكية (Android & iOS) مع شاشة بداية وأيقونات مخصصة وعمل بدون إنترنت.

---

## 🚀 كيفية الرفع على Vercel (Vercel Deployment)

### الطريقة المباشرة (عبر لوحة تحكم Vercel):
1. اذهب إلى [Vercel Dashboard](https://vercel.com/new).
2. اختر استيراد مستودع جيت هب: `mohamdhamd/madyafa`.
3. سيتعرف Vercel تلقائياً على إطار العمل: **Next.js**.
4. في قسم **Environment Variables (متغيرات البيئة)** أضف القيم التالية:

| المتغير (Variable) | القيمة (Value) |
| :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://qwertyuiop01152999615_db_user:VWM0BJzrwDWFyofD@cluster0.rvbzr3o.mongodb.net/madyafa_db?retryWrites=true&w=majority` |
| `JWT_SECRET` | `madyafa_super_secret_jwt_key_2026_secured_offline_first_app` |
| `NEXT_PUBLIC_APP_NAME` | `دفتر المضيافة الذكي` |

5. اضغط **Deploy**. سيقوم Vercel ببناء المشروع في غضون 30 ثانية وتوليد رابط مباشر مجاني يعمل مدى الحياة بشهادة SSL تلقائية.

---

## 🛠️ التشغيل محلياً (Local Development)

```bash
# تثبيت الحزم
npm install

# تشغيل خادم التطوير
npm run dev

# بناء النسخة الإنتاجية
npm run build
npm start
```

---

## 📄 الترخيص
مرخص تحت رخصة [MIT License](LICENSE).
