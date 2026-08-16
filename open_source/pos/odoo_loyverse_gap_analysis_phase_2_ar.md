# المرحلة الثانية: تحليل الفجوات البرمجية بين Odoo Community 19.0 وLoyverse

> **النطاق:** تحديد الفجوات والميزات المفقودة والتقنيات ولغات البرمجة اللازمة للوصول إلى تكافؤ وظيفي وسلوكي كامل مع خط أساس Loyverse الموثق سابقاً.
>
> **المشروع المختار في المرحلة الأولى:** `odoo/odoo`، الفرع `19.0`، إصدار Community والوحدات العامة في المستودع الرسمي فقط.
>
> **تاريخ لقطة التحقق:** 16 أغسطس 2026.
>
> **حد هذه الوثيقة:** لا تتضمن ترتيب التنفيذ، السبرنتات، المراحل الزمنية، أو خطة الهيكلة التفصيلية؛ تلك مخرجات المرحلة الثالثة.

## 1. الخلاصة التنفيذية

أعطت المرحلة الأولى Odoo Community 19.0 مؤشر تغطية وظيفية موزوناً قدره **85.5%**. الفارق الحسابي إلى 100% هو **14.5 نقطة موزونة**، لكنه لا يمثل وحده حجم التطوير؛ لأن الوصول إلى التطابق الكامل يتطلب أيضاً تعديل سلوك وواجهة ميزات موجودة أصلاً في Odoo، وليس إضافة الميزات الغائبة فقط.

نتيجة تحليل الفجوات هي:

1. **Odoo مناسب ليبقى قلب النظام**: الخادم، نموذج المعاملات، PostgreSQL، المخزون، المشتريات، التصنيع، العملاء، الولاء، التقارير، POS الأساسي، المطاعم، المحاسبة، والتوطين السعودي.
2. **لا يمكن الوصول إلى تطابق المنصات باستخدام واجهة Odoo المتصفحية وحدها**. توثيق Odoo يصف POS بأنه قائم على المتصفح، بينما خط أساس Loyverse يتضمن تطبيقات مستقلة لـPOS وDashboard وKDS وCDS على Android وiOS/iPadOS. لذلك يلزم تطوير عملاء أصليين للمنصات، مع إبقاء Odoo خادماً ومصدر بيانات مركزياً. [Odoo POS](https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale.html)
3. **أكبر فجوة وظيفية مفردة هي KDS المفتوح**. الوحدة العامة `pos_restaurant` تثبت تقسيم الفاتورة وطباعة الفاتورة قبل الدفع وطباعة تحديثات المطبخ، لكنها لا تحتوي شاشة KDS مستقلة في المصدر العام. توثيق Odoo يعرض Preparation Display، إلا أن مسار وحدة عامة مكافئة لم يُثبت في فرع Community 19.0. [وحدة Restaurant العامة](https://github.com/odoo/odoo/blob/19.0/addons/pos_restaurant/__manifest__.py)، [Preparation Display](https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/extra/preparation.html)
4. **CDS موجود كأساس داخل Odoo، لكنه ليس مطابقاً لتطبيق Loyverse CDS المستقل**. مصدر Odoo العام يتضمن `customer_display_index.xml` وحزمة `point_of_sale.customer_display_assets`، بينما Loyverse يستخدم جهازاً مستقلاً يكتشف ويقترن مع POS على الشبكة المحلية. [وحدة Point of Sale العامة](https://github.com/odoo/odoo/blob/19.0/addons/point_of_sale/__manifest__.py)، [إعداد Loyverse CDS](https://help.loyverse.com/help/customer-display-system)
5. **العمل دون اتصال موجود في Odoo لكنه يحتاج طبقة تطابق أقوى**. Odoo 19 يستخدم IndexedDB وService Worker ويتتبع الطلبات المدفوعة غير المؤكدة خادمياً؛ أما Loyverse فيستخدم مخزناً أصلياً local-first مع UUIDs وطوابير إرسال وآثار حذف ومزامنة تفاضلية وحواجز واجهة واضحة. [IndexedDB في Odoo POS](https://github.com/odoo/odoo/blob/19.0/addons/point_of_sale/static/src/app/models/utils/indexed_db.js)، [Data Service](https://github.com/odoo/odoo/blob/19.0/addons/point_of_sale/static/src/app/services/data_service.js)، [Offline في Loyverse](https://help.loyverse.com/help/offline-work-of-pos)
6. **JSON-2 في Odoo لا يطابق عقد Loyverse API**. Odoo يعرض نماذج وطرائق عامة بصلاحيات Odoo، بينما خط الأساس المطلوب هو REST/JSON بإصدار `/v1.0`، موارد ثابتة، Cursor pagination، OAuth scopes، أخطاء موحدة، وWebhooks صادرة. لذلك يلزم بناء طبقة توافق API مستقلة داخل منظومة Odoo. [Odoo JSON-2 API](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html)، [Loyverse API](https://developer.loyverse.com/docs/)
7. **تكامل ZATCA ليس فجوة محرك**. التدقيق الأعمق لفرع 19.0 أثبت وجود وحدتي `l10n_sa_pos` و`l10n_sa_edi_pos` العامتين؛ الثانية تصف نفسها صراحة بأنها دعم ZATCA للفوترة المبسطة في POS، واختباراتها تثبت إرسال EDI المتزامن أثناء Checkout. المتبقي هو مطابقة حالات الواجهة والطوابير وسلوك الفشل والإيصال، لا إعادة بناء محرك ZATCA. [وحدة ZATCA POS](https://github.com/odoo/odoo/blob/19.0/addons/l10n_sa_edi_pos/__manifest__.py)، [اختبارات ZATCA POS](https://github.com/odoo/odoo/blob/19.0/addons/l10n_sa_edi_pos/tests/test_sa_edi_pos.py)

**الحكم النهائي للمرحلة الثانية:** قاعدة Odoo لا تحتاج إعادة كتابة؛ لكنها تحتاج **طبقة منتجات عميلة جديدة** و**طبقة توافق تعاقدي** و**موصلات أجهزة ومدفوعات**. سجل هذه الوثيقة يحصر **51 بند فجوة أو مطابقة إلزامية**.

## 2. تعريف التطابق 100%

يُعد البند مغلقاً فقط عندما تتساوى النتيجة المرئية والتشغيلية مع خط أساس Loyverse السابق في الحالات الآتية:

- المسار السعيد، والحالات الفارغة، والتحميل، والفشل، وإعادة المحاولة.
- الصلاحيات، وطلب PIN، والتجاوز بواسطة موظف أعلى صلاحية.
- العمل Online وOffline والانتقال بينهما.
- الهاتف واللوحي، والوضعان العمودي والأفقي.
- العربية وRTL والمحتوى ثنائي الاتجاه والطباعة العربية.
- Android وiOS/iPadOS واختلافات الأذونات والعتاد.
- تعدد المتاجر وأجهزة POS والتزامن المتزامن والمتأخر.
- العقود الخارجية: API وWebhooks والمدفوعات والطابعات وZATCA.

لا يكفي وجود ميزة تحمل الاسم نفسه في Odoo. يجب اجتياز **اختبار تعاقدي وسلوكي وبصري** مطابق لكل حالة موثقة.

## 3. منهج التصنيف

### 3.1 حالات التغطية

| الحالة | معناها |
|---|---|
| مرتفع | المحرك موجود؛ المطلوب أساساً مطابقة الواجهة والدلالات |
| جزئي | جزء مهم موجود، لكن سلوكاً رئيسياً أو سطحاً كاملاً مفقود |
| غائب | لا توجد وحدة عامة مثبتة تحقق الوظيفة في Community 19.0 |
| اختلاف عقد | الوظيفة العامة موجودة لكن مخطط البيانات أو API أو الحالات غير متوافق |
| اختلاف منصة | الوظيفة تعمل في المتصفح، لكنها لا تحقق تجربة أو عتاد التطبيق الأصلي |

### 3.2 الأولوية والحجم

| الرمز | المعنى |
|---|---|
| P0 | حاجز يمنع التكافؤ أو يهدد صحة المعاملة والبيانات |
| P1 | فجوة رئيسية ظاهرة للمستخدم أو للتكامل |
| P2 | فجوة مطابقة بصرية أو سلوكية دقيقة؛ مطلوبة للوصول إلى 100% |
| S / M / L / XL | حجم نسبي للفجوة، وليس مدة زمنية |

## 4. الفجوة الموزونة المتبقية من المرحلة الأولى

| المجال | الوزن | نتيجة Odoo | الفجوة الموزونة | تفسير الفجوة |
|---|---:|---:|---:|---|
| POS الأساسي | 18 | 16.6 | 1.4 | اختلاف تجربة الهاتف/اللوحي، حالات التذاكر، الدفع، الورديات، والواجهة |
| المطاعم وKDS | 12 | 9.1 | 2.9 | KDS مستقل غير مثبت في المصدر العام؛ فروق توجيه وحالة الطلب |
| Back Office والمخزون | 15 | 14.4 | 0.6 | المحرك أوسع من Loyverse؛ المطلوب إسقاط موارد وواجهة وحالات مطابقة |
| المتاجر والموظفون | 10 | 8.4 | 1.6 | جهاز POS والـPIN وTime Clock والصلاحيات لا تتطابق واحداً لواحد |
| العملاء والولاء | 7 | 6.0 | 1.0 | دلالات النقاط والإحصاءات وسجل الشراء مختلفة |
| التقارير وDashboard | 8 | 6.7 | 1.3 | لا يوجد تطبيق Dashboard أصلي مستقل مكافئ |
| الأجهزة والمدفوعات وCDS | 10 | 8.4 | 1.6 | اختلاف موصلات الدفع والطابعات واقتران CDS |
| API والتكاملات | 8 | 6.1 | 1.9 | JSON-2 عام، لا عقد REST/Webhooks متوافق |
| Offline والموبايل وRTL | 8 | 5.8 | 2.2 | متصفح/IndexedDB مقابل تطبيقات أصلية local-first |
| السعودية وZATCA | 4 | 4.0 | 0.0 | المحرك العام موجود؛ تبقى أعمال مطابقة سلوكية ضمن سجل التوافق |
| **الإجمالي** | **100** | **85.5** | **14.5** | **الفجوة الوظيفية الموزونة؛ لا تساوي نسبة الجهد** |

## 5. ما يُعاد استخدامه وما يحتاج تطويراً جديداً

| الطبقة | قرار الفجوة | المكونات |
|---|---|---|
| إعادة استخدام مباشرة | الاحتفاظ بالمحرك | Odoo ORM، PostgreSQL، الحسابات، `point_of_sale`، `stock`، `purchase`، `mrp`، `pos_loyalty`، `pos_hr`، `l10n_sa`، `l10n_sa_edi`، `l10n_sa_pos`، `l10n_sa_edi_pos` |
| تمديد داخل Odoo | إضافة وحدات وتعديلات | موارد التوافق، حالات الأعمال، الواجهات الإدارية، التقارير، الصلاحيات، API، Webhooks، مزامنة العملاء |
| إعادة بناء واجهة | مطابقة تجربة الاستخدام | شاشة البيع، الدفع، التذاكر، الورديات، Back Office المختصر، RTL، الرسائل والحركات |
| عميل جديد | غير متاح كمنتج مطابق | POS أصلي Android/iOS، Dashboard، KDS، CDS |
| موصلات جديدة | اختلاف منظومة الموردين | بوابات الدفع، Tap to Pay، طابعات Bluetooth/USB، طابعات مدمجة، أجهزة LAN |

## 6. فجوة نموذج البيانات

Odoo يملك معظم الحقائق التجارية المطلوبة، لكن أسماء موارده وحدودها لا تطابق Loyverse. المطلوب هو طبقة إسقاط متوافقة تحفظ معرّفات مستقرة ولا تكرر منطق المخزون أو المحاسبة.

| مورد Loyverse | أقرب نموذج Odoo 19 | مستوى المطابقة | الفجوة الواجب إغلاقها |
|---|---|---|---|
| `MerchantProfile` | `res.company` | مرتفع | إسقاط العملة والبلد والحقول المنشورة بصيغة العقد العام |
| `Store` | `stock.warehouse` + مواقع المخزون + الشركة | جزئي | مورد متجر واحد يجمع العنوان والنطاق والوصول والمخزون |
| `Employee` | `hr.employee` + مجموعات/قواعد POS | جزئي | متاجر الموظف، `is_owner`، PIN، صلاحيات Loyverse الحرفية |
| `PosDevice` | `pos.config` + معرف المتصفح/الجهاز | جزئي | فصل إعداد الكاشير عن الجهاز المفعّل وهوية تثبيته |
| `Supplier` | `res.partner` كمورّد | مرتفع | حقول الاتصال ودلالة المورد الأساسي للصنف |
| `Customer` | `res.partner` | جزئي | `first_visit`, `last_visit`, `total_visits`, `total_spent`, `total_points`, `permanent_deletion_at` |
| `Category` | `pos.category` و`product.category` | جزئي | Loyverse يعرض تصنيفاً ولوناً واحداً؛ Odoo يفصل تصنيف POS والمخزون |
| `Tax` | `account.tax` | مرتفع | إسقاط `ADDED/INCLUDED` ونطاق المتاجر والتوقيتات |
| `Discount` | `loyalty.program` وقواعد الخصم | جزئي | الأنواع الثابتة/المتغيرة و`restricted_access` وخصم النقاط |
| `Modifier` | سمات/خيارات منتج وتخصيص POS | جزئي | مجموعة خيارات مرتبة، سعر كل خيار، وربط متعدد بالأصناف والمتاجر |
| `Item` | `product.template` | مرتفع | `handle`، اللون، form، أعلام الوزن/التركيب/الإنتاج، أسماء الخيارات الثلاثة |
| `Variant` | `product.product` | مرتفع | سعر وتوافر ومستوى إنذار لكل متجر، ومعرف/مرجع متوافق ثابت |
| `Component` | `mrp.bom` و`mrp.bom.line` | مرتفع | إسقاط BOM مبسط على مستوى المتغير والكميات |
| `InventoryLevel` | `stock.quant` مجمّعاً حسب موقع المتجر | جزئي | مفتاح `(variant_id, store_id)` وتحديث `stock_after` الذري |
| `Receipt` | `pos.order` | جزئي | رقم إيصال متوافق، snapshots التاريخية، المصدر، البقشيش، النقاط، خيار التناول |
| `LineItem` | `pos.order.line` | جزئي | modifiers والخصومات والضرائب والـcost والحقول المحسوبة بنفس الدقة |
| `Payment` | `pos.payment` | جزئي | تعداد الأنواع و`payment_details` وبيانات الطرفية وEMV |
| `Shift` | `pos.session` + حركات النقد | جزئي | نفس تجميعات البداية/المتوقع/الفعلي/Pay In/Out والموظفين |
| Open ticket | طلب POS غير مدفوع/مسودة | جزئي | `syncId`، الاسم والتعليق، الآثار المحذوفة، التزامن بين الأجهزة |
| Webhook | لا مورد صادر مطابق | غائب | مورد اشتراك وحالة وتسليم ومحاولات وتوقيع |
| KDS order state | لا نموذج عام مثبت مكافئ | غائب | بطاقة الطلب، العناصر، void، done، recall، أزمنة التحذير |

## 7. سجل الفجوات التفصيلي

### 7.1 POS وتجربة البيع

| ID | الهدف المطلوب من Loyverse | حالة Odoo الحالية | الفجوة | الأولوية/الحجم | التقنية واللغة المطلوبة | معيار الإغلاق |
|---|---|---|---|---|---|---|
| POS-01 | دخول الجهاز ثم PIN الموظف، قفل وتبديل موظف، وتجاوز فعل حساس بواسطة PIN أعلى | `pos_hr` يدعم barcode/PIN لتسجيل الموظف، لكن التدفق والصلاحيات ليست مطابقة | جزئي | P0 / L | Python، Odoo ORM، JavaScript/Owl، XML | تطابق مصفوفة الدخول والقفل والتبديل والتجاوز لكل دور |
| POS-02 | تخطيط هاتف منفصل وتخطيط لوحي ثنائي اللوحة، عمودي/أفقي | POS متجاوب في المتصفح، لا تطبيق أصلي مطابق | اختلاف منصة | P0 / XL | Kotlin/Compose، Swift/SwiftUI/UIKit، JavaScript/Owl، SCSS | اجتياز لقطات مرجعية لكل حجم واتجاه ومنصة |
| POS-03 | Favorites على الهاتف وCustom Pages/Grid على اللوحي مع drag/long-press وترتيب محفوظ | تصنيفات وأزرار منتجات موجودة، ودلالات التخصيص مختلفة | جزئي | P1 / L | Owl، JavaScript، XML، SCSS، Python | نفس سعة الشبكة، إجراءات التحرير، الترتيب، والحفظ لكل جهاز |
| POS-04 | عناصر موزونة/متغيرة السعر، modifiers، comments، dining option، ضرائب وخصومات على السطر/التذكرة | معظم المحرك موجود عبر المنتجات والضرائب والخصومات والمطعم | مرتفع مع اختلاف دلالي | P1 / L | Python، Owl، JavaScript، XML | نفس ترتيب الحوارات، القيود، الحساب، والتقريب في عينات مطابقة |
| POS-05 | اختيار العميل، النقاط، Redeem، وسجل الشراء داخل POS | العملاء و`pos_loyalty` موجودان، لكن العرض والحساب والعقد مختلف | جزئي | P1 / M | Python، Owl، PostgreSQL | نفس رصيد النقاط والحد الأقصى للاستبدال وسجل الزيارات والمشتريات |
| POS-06 | Open tickets بأسماء مخصصة أو مسبقة، تعليقات، بحث/فرز، ومزامنة لحظية داخل المتجر | الطلبات والطاولات موجودة، لكن نموذج التذكرة المسبقة وحالة المزامنة لا يتطابقان | جزئي | P0 / XL | Python، Owl، IndexedDB، WebSocket/bus، Kotlin/Swift | نفس قائمة التذاكر، الأسماء المشغولة، البحث، والتحديث عبر جهازين |
| POS-07 | Split ticket حتى التدفقات الموثقة، Merge، Move، وPrint bill قبل الدفع | `pos_restaurant` يثبت Bill Splitting وBill Printing، مع اختلاف UX وقواعد الحافة | مرتفع | P1 / M | Owl، JavaScript، Python | نفس نتائج النقل/الدمج والكميات الجزئية والأسماء والفاتورة المؤقتة |
| POS-08 | شاشة Charge، Split payment، Cash، Card، tips، cash rounding، وشاشة النجاح | المحرك الأساسي موجود؛ التخطيط، الخطوات، وتقسيم الدفعات تختلف | مرتفع | P0 / L | Owl/JavaScript، Kotlin، Swift، موصلات الدفع | نفس state machine، المبالغ، الباقي، التقريب، الإلغاء، وإعادة المحاولة |
| POS-09 | Receipts محلية/متجرية، تفاصيل، Refund، وCancel من Back Office وفق الصلاحيات | الإيصالات والاسترداد موجودان، لكن النطاق والحالات والرسائل تختلف | جزئي | P0 / L | Python، Owl، API، مزامنة محلية | نفس نطاق الرؤية، سطور الرد، تحديث المخزون، وحالات الإلغاء والتدقيق |
| POS-10 | وردية: opening cash، cash sales/refunds، Pay In/Out، expected/actual، إغلاق وتقرير | جلسات POS وحركات النقد موجودة؛ النموذج والتجربة لا يطابقان Shift | جزئي | P0 / L | Python، PostgreSQL، Owl، تخزين محلي أصلي | تطابق جميع مجاميع الوردية وإسناد الموظف والعمل Offline |

### 7.2 Dashboard وKDS وCDS

| ID | الهدف المطلوب | حالة Odoo الحالية | الفجوة | الأولوية/الحجم | التقنية واللغة المطلوبة | معيار الإغلاق |
|---|---|---|---|---|---|---|
| APP-01 | تطبيق Dashboard مستقل على Android وiOS بنفس بيانات Back Office | تقارير Odoo متاحة في الويب؛ لا تطبيق مدير مستقل مطابق | غائب | P1 / XL | Kotlin/Compose، Swift/SwiftUI، REST/JSON، Push | تثبيت مستقل، دخول موحد، وصلاحيات Sales/Items المطابقة |
| APP-02 | Receipts، Net sales، Average ticket، مقارنة الفترة السابقة، drill-down، Items/stock alerts | تحليل وتقارير Odoo أوسع لكن المقاييس والتفاعل مختلفان | جزئي | P1 / L | Python، SQL/ORM، Kotlin، Swift، رسوم أصلية | تطابق كل KPI والفلاتر والفترة المخصصة بالوقت والفرز والمتجر |
| KDS-01 | تطبيق KDS مستقل مفتوح المصدر لـAndroid وiPad | طباعة مطبخ عامة؛ وحدة شاشة تجهيز عامة مطابقة غير مثبتة | غائب | P0 / XL | Kotlin/Compose، Swift/SwiftUI، Python/Odoo models | تطبيق مستقل يعمل دون أي وحدة مغلقة ويعرض الطلبات الحية |
| KDS-02 | بطاقات ticket/name/time/server، modifiers/comments، green/yellow/red، done item/order، void، recall/clear | لا عقد Community كامل مثبت لهذه الحالات | غائب/جزئي | P0 / XL | Kotlin/Swift، مخزن SQLite، state machine، timers/audio | اجتياز حالات KDS الموثقة بما فيها 240/420 ثانية والوضع الداكن |
| KDS-03 | اكتشاف واقتران على LAN، توجيه بالفئات، تسليم محلي، persistence وresync | Odoo Preparation Display موثق كمتصفح؛ ليس تطبيق LAN مماثلاً | اختلاف منصة | P0 / XL | mDNS/UDP، TCP أو WebSocket/TLS، Kotlin/Swift، SQLite | استمرار POS→KDS دون إنترنت مع LAN، ثم مصالحة بلا فقد أو تكرار |
| CDS-01 | تطبيق CDS مستقل، اكتشاف/إدخال IP، دعوة Pair/Unpair، عدة شاشات للـPOS | Customer Display داخل Odoo موجود، لكن نموذج التوصيل شاشة ثانية/IoT | جزئي | P0 / XL | Kotlin/Compose، Swift/SwiftUI، Network.framework/NSD، تشفير اقتران | نفس خطوات البحث والاقتران اليدوي والتأكيد والحفظ وإلغاء الربط |
| CDS-02 | عرض ticket/modifiers/discounts/taxes، المتجر والكاشير، العميل والنقاط والبريد، الدفع والباقي | Odoo يعرض الطلب للعميل، لكن الحقول والتفاعل والتخطيط مختلف | جزئي | P1 / L | Kotlin/Swift، بروتوكول LAN، JavaScript/Owl عند الويب | تطابق الشاشة الفارغة والطويلة والنجاح والانقطاع والوضع الداكن |

### 7.3 Back Office والمخزون والموظفون والعملاء

| ID | الهدف المطلوب | حالة Odoo الحالية | الفجوة | الأولوية/الحجم | التقنية واللغة المطلوبة | معيار الإغلاق |
|---|---|---|---|---|---|---|
| BO-01 | قشرة Back Office وقائمة Loyverse المختصرة وحالات النماذج والأزرار | Odoo أوسع وأكثر تعقيداً | اختلاف UX | P1 / XL | XML views، Owl/JavaScript، SCSS، Python | نفس خريطة التنقل، الحقول الظاهرة، حالات Save/Cancel/Delete والأخطاء |
| REP-01 | Sales Summary، Sales by Item/Category/Employee/Payment/Modifier/Tax، Receipts، Shifts | Odoo يملك تحليلات قوية لكن تعريف المقاييس والفلاتر مختلف | جزئي | P1 / L | Python ORM، PostgreSQL views، Owl/Charts، CSV | تطابق أرقام التقارير على dataset مرجعي والفلاتر والتصدير |
| CAT-01 | نموذج Item/Variant حتى ثلاثة خيارات، Store price/availability، modifiers، low/optimal stock، import/export | `product.template/product.product` أقوى، لكن العقد والواجهة مختلفان | اختلاف عقد | P0 / XL | Python، ORM، XML، CSV import، API | round-trip كامل دون فقد بين نموذج Loyverse ونماذج Odoo |
| INV-01 | Suppliers وPurchase Orders وحالاتها والاستلام الجزئي وAutofill والتكاليف الإضافية | Purchase والموردون وإعادة الطلب موجودون | مرتفع مع اختلاف سير | P1 / L | Python، XML/Owl، Stock/Purchase ORM | نفس الحالات والحساب `Optimal - In stock - Incoming` والاستلام والتكلفة |
| INV-02 | Transfer Orders، Stock Adjustments، Inventory History، Valuation | محركات Odoo تغطيها وتزيد عليها | مرتفع مع اختلاف إسقاط | P1 / L | Python، Stock ORM، PostgreSQL reporting | نفس المستندات والأسباب والروابط والحركات والتقييم لكل متجر |
| INV-03 | Inventory Count كامل/جزئي، Expected/Actual، shortage/surplus، سجل المستند | Inventory adjustments/cycle counts موجودة | مرتفع مع اختلاف UX | P1 / M | Python، Barcode/Stock، Owl/XML | نفس أنواع العد والحالات والنتيجة والحركة المحاسبية/المخزنية |
| INV-04 | Production وDisassembly للعنصر المركب وتحديث تكلفة المكونات | MRP وBoM وUnbuild موجودة | مرتفع مع اختلاف تبسيط | P1 / M | Python، MRP ORM، XML | نفس استهلاك/إنتاج الكميات وتكلفة المركب والمكونات في الاختبارات |
| INV-05 | Printing Labels بالقوالب والأحجام والباركود والسعر | تقارير وملصقات Odoo موجودة، لكن القوالب مختلفة | جزئي | P2 / M | QWeb/XML، CSS للطباعة، ZPL عند الحاجة | تطابق الحقول والأبعاد والكمية والمعاينة والباركود |
| EMP-01 | Access Rights المسماة، Time Clock من شاشة PIN، Timecards قابلة للتعديل، Total Hours عشري | `pos_hr` يدعم PIN؛ `hr_attendance` منفصل عن تدفق POS | جزئي | P0 / L | Python، HR/POS ORM، Owl، Kotlin/Swift | نفس الصلاحيات وClock In/Out و0.25=15 دقيقة وسجل التعديل |
| CRM-01 | Customer Base، إحصاءات الزيارة والإنفاق، purchase history، import/export، النقاط | العملاء والولاء موجودان، لكن الحقول والتجربة غير متطابقة | جزئي | P1 / L | Python، PostgreSQL aggregates، Owl/XML، API | تطابق الإحصاءات والنقاط والحذف والاستيراد وسجل الشراء |

### 7.4 العمل دون اتصال والمزامنة

| ID | الهدف المطلوب | حالة Odoo الحالية | الفجوة | الأولوية/الحجم | التقنية واللغة المطلوبة | معيار الإغلاق |
|---|---|---|---|---|---|---|
| OFF-01 | قاعدة أعمال أصلية local-first لكل تطبيق POS مع معاملات وهجرات | Odoo POS يستخدم IndexedDB في المتصفح؛ Loyverse Android يستخدم SQLite محلياً | اختلاف منصة | P0 / XL | Kotlin + SQLite/Room، Swift + SQLite/Core Data، تشفير محلي | قتل التطبيق/الجهاز وإعادة التشغيل لا يفقد تذكرة أو إيصالاً أو وردية |
| OFF-02 | Outbox ثابت، local UUID، إقرار جزئي، Idempotency-Key، retry/backoff، Manual Sync | Odoo يتتبع بيانات غير متزامنة وطلبات مدفوعة محلية، لكن العقد المرئي والدلالي غير مطابق | جزئي | P0 / XL | Python، PostgreSQL outbox، Kotlin/Swift، WorkManager/BackgroundTasks | لا تكرار بيع تحت timeout/retry؛ تختفي Unsynced بعد إقرار السجل نفسه فقط |
| OFF-03 | مزامنة تفاضلية للكيانات، cursors/timestamps، tombstones، وحل تعارض Open tickets | Odoo bus/IndexedDB يوفر أساساً، ولا يثبت تكافؤ قواعد Loyverse | جزئي | P0 / XL | Python، WebSocket/bus، version vectors أو revisions، SQLite | اختبارات تعديل/حذف متزامن من جهازين بلا resurrection أو فقد |
| OFF-04 | مصفوفة Offline الحرفية: البيع والورديات متاحان؛ refund والعملاء والبحث/المخزون الحي مقيدان؛ البريد مؤجل | Odoo يدعم Offline عاماً لكن مجموعة القيود والرسائل مختلفة | اختلاف سلوكي | P0 / L | Kotlin/Swift، Owl، feature guards، queue | كل خلية في مصفوفة Online/Offline السابقة تطابق الحالة والرسالة والعودة |
| OFF-05 | منع Sign out مع Unsynced، حماية reload، فشل IndexedDB/SQLite، recovery وschema migration | Odoo 19 أضاف حماية reload ومعالجة فقد اتصال IndexedDB، لكن لا يغطي دورة التطبيقات الأصلية كاملة | جزئي | P0 / L | Kotlin/Swift lifecycle، DB migrations، Owl، telemetry | لا خروج مدمر؛ استرداد تلقائي/موجّه لكل فشل تخزين واتصال موثق |

### 7.5 API ونموذج الموارد وWebhooks

| ID | الهدف المطلوب | حالة Odoo الحالية | الفجوة | الأولوية/الحجم | التقنية واللغة المطلوبة | معيار الإغلاق |
|---|---|---|---|---|---|---|
| DATA-01 | معرفات موارد ثابتة وعلاقات Store/Device/Item/Variant/Receipt/Shift | Odoo يستخدم معرفات ونماذج داخلية مختلفة | اختلاف عقد | P0 / XL | Python، Odoo ORM، PostgreSQL، UUID mapping | استقرار المعرفات عبر الاستيراد والتعديل والحذف والترقية وعدم تسريب IDs داخلية |
| API-01 | 34 مساراً و57 عملية REST تحت API versioned، بموارد JSON وصورة PNG | Odoo JSON-2 يستدعي model methods، لا هذا العقد | غائب كعقد | P0 / XL | Python controllers، OpenAPI 3.0، JSON، multipart/PNG | اجتياز مجموعة عقد كاملة للمسارات والأساليب والحقول والقيود |
| API-02 | Personal Access Token وOAuth 2.0/OIDC، refresh، scopes وUserInfo/JWKS | صلاحيات Odoo ومفاتيحه لا تطابق مزود OAuth المنشور | اختلاف عقد | P0 / XL | Python، OAuth 2.0/OIDC، JWT/RS256، تشفير المفاتيح | اجتياز Authorization Code/refresh/revoke ونطاقات READ/WRITE لكل مورد |
| API-03 | Cursor pagination، 50/250، UTC، soft delete، أخطاء موحدة، 300 طلب/300 ثانية | JSON-2 له بروتوكول وأخطاء وصلاحيات مختلفة | اختلاف عقد | P0 / L | Python، PostgreSQL cursors، reverse-proxy/app rate limiting | تطابق status codes وerror codes والحدود والحذف وcursor المعتم |
| WH-01 | مورد `/webhooks/` وأنواع `inventory_levels.update`, `items.update`, `customers.update`, `receipts.update`, `shifts.create` | `base_automation` يوفر webhook وارداً؛ لا اشتراكات صادرة مطابقة | غائب | P0 / L | Python، Odoo ORM، HTTPS، event outbox | إنشاء/قراءة/حذف اشتراك وإطلاق الحدث الصحيح مرة دلالياً |
| WH-02 | batches حتى 100، HMAC-SHA1 لـOAuth، API-version header، 2xx، 200 محاولة/نحو 48 ساعة، ثم DISABLED | لا توجد آلة تسليم عامة مطابقة | غائب | P0 / XL | Python workers/cron، PostgreSQL queue، HMAC، backoff، observability | اختبارات failure injection تثبت retries والترتيب والتوقيع والتعطيل والبريد |

### 7.6 الدفع والطباعة والأجهزة

| ID | الهدف المطلوب | حالة Odoo الحالية | الفجوة | الأولوية/الحجم | التقنية واللغة المطلوبة | معيار الإغلاق |
|---|---|---|---|---|---|---|
| PAY-01 | مصفوفة Loyverse المنشورة: SumUp، Zettle، Teya، Tyro، Smartpay، Yoco، STORES، PAYGATE، SoftBank، CpayPro، KICC، NICE، Ezetap، وLoyverse Payments | قائمة Odoo الرسمية مختلفة؛ التقاطع الاسمي المباشر الواضح هو Tyro، وStripe لا يساوي تجربة Loyverse Payments | غائب جزئياً | P0 / XL | Python adapters، Kotlin/Java SDKs، Swift/Obj-C SDKs | كل مزود يعمل في البلد والمنصة والطرفية المنشورة مع sale/refund/cancel |
| PAY-02 | آلة حالة موحدة: initiate، approve/decline، timeout، check status، refund، reconciliation | Odoo يملك adapters لمزوديه، لا الحالات المرجعية لكل مزودي Loyverse | اختلاف عقد | P0 / XL | Kotlin/Swift، Python، idempotency، terminal SDKs | لا بيع مكرر أو حالة مالية مجهولة بعد قطع الشبكة في كل نقطة |
| PAY-03 | Pairing الطرفية، Tap to Pay on iPhone، قارئ Bluetooth/شبكي، وقيود Offline حسب المزود | دعم Odoo يختلف حسب الموصل والجهاز | اختلاف منصة | P0 / XL | Swift/Contactless APIs، Kotlin/NFC/Bluetooth، SDKs معتمدة | اجتياز مصفوفة جهاز×نظام×بلد×Online/Offline المنشورة |
| PRN-01 | قائمة Android المباشرة عبر TCP/Bluetooth/USB والطابعات المدمجة Sunmi/iMin | Odoo يدعم طابعات وLNA/IoT، لكنه ليس مصفوفة عميل Android نفسها | اختلاف منصة | P0 / XL | Kotlin، Android USB Host، Bluetooth RFCOMM، TCP 9100، ESC/POS، vendor SDKs | Test print وإيصال وQR وcut/status لكل موديل/واجهة مستهدفة |
| PRN-02 | قائمة iOS عبر Ethernet/Bluetooth/USB للنماذج الموصى بها | دعم الويب/IoT لا يغطي ExternalAccessory وقيود iOS نفسها | اختلاف منصة | P0 / XL | Swift، Network.framework، ExternalAccessory، StarPRNT/Epson SDKs | نفس قائمة النماذج والواجهات والنتيجة على iPhone/iPad |
| PRN-03 | توجيه فئات المطبخ، additions/voids، single item، reprint بعلامة، drawer/cutter/buzzer | `pos_restaurant` يثبت Kitchen Order Printing، لكن القالب والتوجيه والحواف تختلف | جزئي | P1 / L | Python، Owl، Kotlin/Swift، ESC/POS raster/text | تطابق طباعة الحفظ والتعديل والإلغاء وإعادة الطباعة وفتح الدرج |
| HW-01 | قارئ HID، كاميرا، embedded-weight barcode، ميزان، درج نقد، شاشات محلية | Odoo يدعم فئات العتاد، وغالباً عبر متصفح/LNA/IoT | جزئي/اختلاف منصة | P1 / XL | Kotlin CameraX/USB/Bluetooth، Swift AVFoundation/ExternalAccessory، GS1/ESC-POS | اجتياز مصفوفة العتاد والصلاحيات والانقطاع والرسائل لكل منصة |

### 7.7 ZATCA وRTL والمطابقة العابرة للمنظومة

| ID | الهدف المطلوب | حالة Odoo الحالية | الفجوة | الأولوية/الحجم | التقنية واللغة المطلوبة | معيار الإغلاق |
|---|---|---|---|---|---|---|
| SA-01 | فاتورة POS مبسطة، QR، onboarding/CSID، إرسال ZATCA، sale/refund، حالات success/warning/error | `l10n_sa_edi_pos` و`l10n_sa_edi` يوفران القلب والتكامل | مرتفع جداً | P0 / M | Python/Odoo EDI، XML UBL 2.1، شهادات، Owl | عينات البيع والاسترداد تنتج XML/QR وحالات مطابقة وتُقبل في بيئة الاختبار |
| SA-02 | سلوك Offline والفشل وإعادة الإرسال وعدم إغلاق الإيصال قبل الحالة المطلوبة | اختبار Odoo يثبت إرسالاً متزامناً أثناء Checkout؛ سلوك Loyverse المرئي والطابور مختلف | اختلاف سلوكي | P0 / L | Python، outbox، idempotency، Kotlin/Swift UI | انقطاع قبل/بعد الإرسال لا ينتج رقمين أو hash chain مكسوراً، والحالة مرئية |
| RTL-01 | RTL كامل في POS/Back Office/Dashboard/KDS/CDS والإيصالات العربية | Odoo يدعم RTL، لكن العملاء الأصلية والواجهات الجديدة والطابعات غير موجودة بعد | جزئي | P1 / XL | CSS logical properties، Owl، Compose RTL، Swift layout direction، bidi/raster print | لقطات واختبارات نص/رقم/عملة/باركود عربية بلا قص أو انعكاس خاطئ |
| UI-01 | الألوان، المقاييس، المكونات، الحركات، الإيماءات، dark theme، phone/tablet/platform differences | Odoo له Design System مختلف | اختلاف بصري | P2 / XL | Design tokens، SCSS، Owl، Compose، SwiftUI/UIKit | Visual-diff ضمن هامش صفري متفق عليه لكل شاشة وحالة |
| SEC-01 | هوية جهاز، تخزين آمن للرموز ومفاتيح الاقتران، صلاحيات شبكة/كاميرا/USB، نقل مشفر | Odoo يؤمن الويب؛ العملاء وLAN والموصلات الجديدة توسع السطح | فجوة عابرة | P0 / L | Android Keystore، iOS Keychain، TLS، certificate pinning حيث يلزم، OAuth | لا أسرار في logs/DB مكشوفة؛ revocation وإعادة الاقتران واختبارات MITM ناجحة |
| QA-01 | إثبات 100% عبر الشاشة والبيانات والعقود والعتاد والمنصات | اختبارات Odoo تغطي نواته، لا عقد Loyverse الكامل | غائب كمنظومة تحقق | P0 / XL | Odoo unittest، HOOT، tours، OpenAPI contract tests، Espresso، XCUITest/Appium، golden tests | لا يُغلق أي بند قبل اجتياز مصفوفة القبول المرجعية آلياً ويدوياً |

## 8. التقنيات ولغات البرمجة المطلوبة

### 8.1 تقنيات Odoo التي يجب استخدامها عند التعديل

| المجال | اللغة/التقنية | سبب الإلزام |
|---|---|---|
| منطق الخادم والوحدات | **Python 3.10+**، Odoo ORM، controllers، cron/jobs | Odoo 19 يكتب طبقة المنطق في Python، ويشترط Python 3.10 أو أحدث. [معمارية Odoo](https://www.odoo.com/documentation/19.0/developer/tutorials/server_framework_101/01_architecture.html)، [التثبيت من المصدر](https://www.odoo.com/documentation/19.0/administration/on_premise/source.html) |
| قاعدة البيانات | **PostgreSQL** | هي قاعدة البيانات الوحيدة المدعومة في طبقة بيانات Odoo؛ لا حاجة إلى استبدالها. [معمارية Odoo](https://www.odoo.com/documentation/19.0/developer/tutorials/server_framework_101/01_architecture.html) |
| واجهات Back Office والتعريفات | **XML**، QWeb، Odoo views/data/security CSV | النماذج والقوائم والتقارير والصلاحيات والوحدات تعرف بهذه الأدوات |
| POS والويب | **JavaScript ES modules**، **Owl**، XML templates | وحدة POS العامة تحمل Owl وasset bundles وملفات JavaScript الحديثة. [Owl](https://www.odoo.com/documentation/19.0/developer/reference/frontend/owl_components.html)، [JavaScript modules](https://www.odoo.com/documentation/19.0/developer/reference/frontend/javascript_modules.html) |
| التنسيق البصري | **SCSS/CSS**، Bootstrap utilities، HTML | مطابقة القياسات والألوان وRTL والحالات المتجاوبة |
| Offline للويب | IndexedDB، Service Worker، Cache API، WebSocket/Odoo bus | موجودة في POS 19 ويجب تمديدها واختبارها، لا استبدالها بلا داع |
| الاختبارات داخل Odoo | Python `unittest`، HOOT، web tours | أدوات Odoo الأصلية لاختبار الخادم وOwl والتدفقات. [Testing Odoo](https://www.odoo.com/documentation/19.0/developer/reference/backend/testing.html)، [HOOT](https://www.odoo.com/documentation/19.0/developer/reference/frontend/unit_testing/hoot.html) |

### 8.2 تقنيات العملاء الأصلية المطلوبة للتطابق الكامل

| المنصة/السطح | اللغة والتقنيات المطلوبة | النطاق |
|---|---|---|
| Android POS/KDS/CDS/Dashboard | **Kotlin**، Jetpack Compose مع Android Views عند الحاجة، SQLite/Room، WorkManager، Android Keystore | واجهات أصلية، تخزين local-first، مزامنة خلفية، أذونات، عتاد، dark/RTL |
| Android SDK compatibility | **Java interoperability** | عدد من SDKs الدفع والطابعات يقدّم واجهات Java؛ Kotlin يستدعيها مباشرة |
| iOS/iPadOS POS/KDS/CDS/Dashboard | **Swift**، SwiftUI مع UIKit عند الحاجة، SQLite/Core Data، BackgroundTasks، Keychain | واجهات أصلية، تخزين، دورة حياة، تعدد النوافذ، dark/RTL |
| iOS SDK compatibility | Objective-C bridging عند حاجة SDK المورد | بعض SDKs الطرفيات والطابعات لا تزال Objective-C |
| LAN للأجهزة | Network.framework/Bonjour على Apple؛ NSD/mDNS وUDP/TCP أو WebSocket/TLS على Android | اكتشاف KDS/CDS، الاقتران، التحديث الفوري، والعمل داخل الفرع |
| عتاد Android | USB Host، Bluetooth Classic/BLE، CameraX، NFC، sockets | الطباعة، القارئ، الكاميرا، الميزان، Tap/terminal |
| عتاد Apple | ExternalAccessory، Network.framework، AVFoundation، AirPrint/vendor SDKs، NFC/Contactless APIs المتاحة | الطباعة، الكاميرا، الطرفيات، Tap to Pay ومسارات النظام |

> تقنيات Loyverse المرصودة مثل Requery ORM وRealm توثق تطبيقه الحالي، لكنها **ليست تبعيات لازمة لـOdoo**. المطلوب هو تحقيق العقد المحلي والسلوك؛ التخزين الجديد يجب أن يتكامل مع Odoo ويجتاز اختبارات المزامنة، ولا يلزم نسخ اختيار ORM بعينه.

### 8.3 تقنيات العقود والتكاملات

| المجال | التقنيات المطلوبة | الاستخدام |
|---|---|---|
| API العام | REST/HTTPS، JSON، OpenAPI 3.0، Cursor pagination، UTC | عقد الموارد الـ34 والعمليات الـ57 |
| الهوية | OAuth 2.0 Authorization Code، OpenID Connect، JWT RS256، JWKS، Personal Access Tokens | الدخول المفوض والنطاقات والتجديد |
| Webhooks | HTTPS POST، HMAC-SHA1 للعقد المتوافق، event outbox، retry/backoff | الأحداث الخمسة والتسليم الموثوق |
| الاتصال الحي | WebSocket/Odoo bus، Push عبر FCM/APNs | تحديثات الأجهزة وDashboard والتنبيهات |
| الدفع | SDKs الموردين، idempotency، terminal state machines، EMV reference fields | البيع والاسترداد وتسوية الحالات المجهولة |
| الطباعة | ESC/POS، TCP 9100، Bluetooth RFCOMM، USB، StarPRNT، Epson ePOS، SDKs Sunmi/iMin/PAX عند النطاق | الإيصالات والمطبخ والدرج والقاطع وQR |
| ZATCA | UBL 2.1/XML، الشهادات وCSID، QR، signing/hashing، Reporting/Clearance APIs | تمديد وحدات Odoo العامة ومطابقة تدفق POS |
| التحقق الخارجي | Contract tests، fault injection، network shaping، hardware-in-the-loop | إثبات API وOffline والدفع والطباعة تحت الفشل |

## 9. مصفوفة المهارات المطلوبة

| التخصص | المستوى المطلوب | مسؤولية الفجوة |
|---|---|---|
| Odoo Backend Engineer | متقدم | ORM، POS/Stock/Purchase/MRP/Accounting، API، EDI، migrations |
| Odoo Frontend Engineer | متقدم | Owl، POS patching، XML، SCSS، RTL، HOOT |
| Android Engineer | متقدم | التطبيقات الأربعة، التخزين، WorkManager، LAN، USB/Bluetooth/NFC |
| iOS Engineer | متقدم | التطبيقات الأربعة، BackgroundTasks، LAN، ExternalAccessory، Tap to Pay |
| Distributed Systems Engineer | متقدم جداً | outbox، idempotency، delta sync، conflict resolution، Webhooks |
| Payment Integration Engineer | متقدم جداً | SDKs، terminal state، refund، reconciliation، PCI-sensitive boundaries |
| Hardware/Printing Engineer | متقدم | ESC/POS، Star/Epson، raster، code pages، drawer/cutter/status |
| Saudi E-Invoicing Engineer | متقدم | ZATCA POS، XML/UBL، certificates، failure/retry conformance |
| QA Automation Engineer | متقدم جداً | E2E، visual golden، contract، native، offline، hardware matrix |
| UI/UX Systems Engineer | متقدم | design tokens، responsive states، RTL، accessibility، platform parity |

## 10. بوابات إغلاق الفجوة

الوصول إلى 100% لا يُعلن بناءً على نسبة عامة؛ بل بعد تحقق البوابات الآتية جميعاً:

| البوابة | شرط النجاح |
|---|---|
| وظيفية | جميع أفعال وشاشات POS/Back Office/Dashboard/KDS/CDS تعطي النتيجة المرجعية |
| بيانات | كل مورد وعلاقة وحساب مالي/مخزني يطابق dataset مرجعياً |
| Offline | لا فقد ولا تكرار تحت الانقطاع وإعادة التشغيل وتعارض جهازين |
| API | جميع المسارات والحقول والأخطاء والمصادقة والحدود تجتاز Contract Suite |
| Webhooks | الحدث والتوقيع والدفعات والمحاولات والتعطيل تطابق العقد |
| مدفوعات | كل مزود ومنصة وبلد وحالة sale/refund/timeout مجتاز |
| أجهزة | كل طابعة/واجهة وقارئ وميزان ودرج ضمن المصفوفة مجتاز فعلياً |
| ZATCA | جميع عينات البيع والاسترداد والرفض وإعادة الإرسال صحيحة ومقبولة |
| بصري ومنصات | Android وiOS والهاتف واللوحي وRTL وdark mode تجتاز golden tests |
| أمان وتشغيل | مفاتيح ورموز آمنة؛ الاسترداد والمراقبة والتدقيق لا يغيران النتيجة التجارية |

## 11. الاستنتاج النهائي للمرحلة الثانية

الفجوة بين Odoo Community 19.0 وLoyverse ليست نقصاً في ERP أو المخزون؛ بل نقص في **منتج التشغيل المتنقل المتكامل**. المحركات الإدارية والمالية والمخزنية في Odoo تغطي الجزء الأصعب من Back Office، كما أن POS والمطاعم والولاء والموظفين وZATCA توفر قاعدة قوية. للوصول إلى التطابق الكامل يلزم إغلاق الكتل التالية كلها:

1. عملاء أصلية لـPOS وDashboard وKDS وCDS على Android وiOS/iPadOS.
2. مزامنة local-first وOffline مطابقة، مع outbox وidempotency وconflict handling.
3. واجهات POS وBack Office مطابقة للحالات والتدفقات والـRTL.
4. طبقة موارد وREST API وOAuth/Webhooks متوافقة.
5. موصلات الدفع والطباعة والعتاد وفق مصفوفة Loyverse المنشورة.
6. مطابقة سلوك ZATCA في POS فوق الوحدات العامة الموجودة، لا إعادة بناء المحرك.
7. منظومة اختبارات تعاقدية وبصرية ومنصات وعتاد تثبت كل بند.

وبذلك تكون مخرجات **المرحلة الثانية فقط** مكتملة، ويظل ترتيب هذه الأعمال وهيكلتها وخطة تنفيذها ضمن المرحلة الثالثة.

## 12. المصادر الأولية الرئيسية

### Odoo 19

- [المستودع الرسمي العام](https://github.com/odoo/odoo/tree/19.0)
- [Point of Sale manifest](https://github.com/odoo/odoo/blob/19.0/addons/point_of_sale/__manifest__.py)
- [Restaurant manifest](https://github.com/odoo/odoo/blob/19.0/addons/pos_restaurant/__manifest__.py)
- [POS HR manifest](https://github.com/odoo/odoo/blob/19.0/addons/pos_hr/__manifest__.py)
- [POS Loyalty manifest](https://github.com/odoo/odoo/blob/19.0/addons/pos_loyalty/__manifest__.py)
- [POS IndexedDB](https://github.com/odoo/odoo/blob/19.0/addons/point_of_sale/static/src/app/models/utils/indexed_db.js)
- [POS Data Service](https://github.com/odoo/odoo/blob/19.0/addons/point_of_sale/static/src/app/services/data_service.js)
- [Saudi POS localization](https://github.com/odoo/odoo/blob/19.0/addons/l10n_sa_pos/__manifest__.py)
- [Saudi ZATCA POS](https://github.com/odoo/odoo/blob/19.0/addons/l10n_sa_edi_pos/__manifest__.py)
- [Odoo JSON-2 API](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html)
- [Odoo Hardware and network](https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/hardware_network.html)
- [Odoo payment terminals](https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/payment_methods/terminals.html)
- [Odoo Saudi Arabia localization](https://www.odoo.com/documentation/19.0/applications/finance/fiscal_localizations/saudi_arabia.html)

### Loyverse

- [Loyverse API](https://developer.loyverse.com/docs/)
- [Offline Use of Loyverse POS](https://help.loyverse.com/help/offline-work-of-pos)
- [Advanced Inventory](https://help.loyverse.com/help/advanced-inventory-management)
- [Time Clock](https://help.loyverse.com/help/time-clock)
- [Open Tickets](https://help.loyverse.com/help/m-open-tickets)
- [Loyverse Dashboard](https://help.loyverse.com/help/using-dashboard)
- [KDS Configuration](https://help.loyverse.com/help/kds-configuration)
- [Using Loyverse KDS](https://help.loyverse.com/help/kitchen-display-system)
- [CDS Configuration](https://help.loyverse.com/help/customer-display-system)
- [How Loyverse CDS Works](https://help.loyverse.com/help/how-customer-display-works)
- [Supported Printers](https://help.loyverse.com/help/supported-printers)
- [Kitchen Printers](https://help.loyverse.com/help/using-kitchen-printers)

