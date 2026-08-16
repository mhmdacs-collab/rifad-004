# المرحلة الأولى: تقييم المرشحين وتحديد هيكل هجين مفتوح المصدر لمطابقة Loyverse

| البيان | القيمة |
|---|---|
| المرحلة | الأولى فقط: تقييم المرشحين واختيار الهيكل الهجين |
| تاريخ اللقطة البحثية | 16 أغسطس 2026 |
| خط الأساس | قائمة المرشحين السبعة ومصفوفة الميزات في الدراسة السابقة |
| النظام الأساسي المختار | Odoo Community 19.0 |
| تغطية النظام الأساسي منفرداً | 85.5% وفق المؤشر الموزون السابق |
| التغطية القابلة لإعادة الاستخدام بعد التركيب الهجين | 91.4% |
| طبقة المطابقة المخصصة المتبقية للوصول إلى 100% | 8.6% |
| تعقيد الدمج الكلي الموزون | 3.4 من 5 — مرتفع لكنه مضبوط بحدود واضحة |
| قرار تعدد الأنظمة | مصدر حقيقة تشغيلي واحد فقط؛ لا يُشغّل ERP أو POS ثانٍ بوصفه نداً للنواة |

## 1. الخلاصة التنفيذية

الهيكل الهجين المختار هو:

1. **Odoo Community 19.0** للنواة التشغيلية: POS، Back Office، المخزون، المشتريات، التصنيع، العملاء، الولاء، الموظفون، المحاسبة، المطاعم، شاشة العميل، والأرضية السعودية وZATCA.
2. **FastAPI مع Pydantic** لطبقة التوافق الخارجية وعقد REST/OpenAPI المنفصل عن نماذج Odoo.
3. **Keycloak** للهوية الموحدة وOAuth 2.0 وOpenID Connect وJWKS ودورة الرموز.
4. **Celery مع RabbitMQ** للمهام غير المتزامنة وتسليم Webhooks وإعادة المحاولة والموصلات البطيئة.
5. **Apache Superset** للتحليلات ولوحات الإدارة المتقدمة فوق طبقة تقارير للقراءة فقط.
6. **Kotlin Multiplatform مع Ktor وSQLDelight** للمجال والمزامنة والتخزين المحلي المشترك بين عملاء Android وiOS، مع إبقاء الواجهات الخاصة بالمنصة قابلة للمطابقة الدقيقة.
7. **OpenPrinting CUPS مع python-escpos** كبوابة طباعة فرعية للطابعات الشبكية والمحلية ودعم ESC/POS وQR والباركود والقطع.

لا تُدمج ERPNext أو Dolibarr أو uniCenta أو Floreant أو NexoPOS أو OSPOS في وقت التشغيل؛ جميعها تكرر كتالوجاً وإيصالات ومخزوناً وموظفين موجودة في Odoo، بينما تكون كلفة توحيد المعرفات والضرائب والورديات والاسترداد أعلى من المكسب الوظيفي المتبقي.

الرقم **91.4%** لا يعني أن المكونات الثانوية توفر شاشات Loyverse جاهزة. إنه تقدير محافظ لما يمكن إعادة استخدامه بعد الدمج الفعلي، مع احتساب المكسب غير المتداخل فقط. للوصول إلى 100% يلزم تنفيذ 8.6% مخصصاً، يتركز في السلوك البصري الدقيق، KDS وCDS الأصليين، قواعد Offline، مصفوفة مزودي الدفع، وبعض فروق الورديات والولاء والأجهزة.

## 2. خط الأساس الملزم من الدراسة السابقة

### 2.1 المرشحون السبعة ودرجاتهم المستقلة

| الترتيب السابق | المرشح | مؤشر التغطية المستقل |
|---:|---|---:|
| 1 | Odoo Community 19.0 | 85.5% |
| 2 | ERPNext + POS Awesome | 75.8% |
| 3 | Dolibarr + TakePOS | 67.3% |
| 4 | uniCenta oPOS | 67.1% |
| 5 | FloreantPOS | 56.3% |
| 6 | NexoPOS Core | 52.0% |
| 7 | Open Source Point of Sale — OSPOS | 51.3% |

### 2.2 المجالات والأوزان التي أعيد استخدامها

| الرمز | المجال | الوزن |
|---|---|---:|
| A | نواة نقطة البيع | 18 |
| B | المطاعم وKDS | 12 |
| C | المكتب الخلفي والمخزون | 15 |
| D | المتاجر والموظفون | 10 |
| E | العملاء والولاء | 7 |
| F | التقارير وDashboard | 8 |
| G | الأجهزة والمدفوعات وCDS | 10 |
| H | API والتكاملات | 8 |
| I | المنصات والعمل دون اتصال | 8 |
| J | السعودية وZATCA | 4 |
|  | **المجموع** | **100** |

## 3. منهج تقييم التركيب الهجين

### 3.1 الفرق بين التغطية المستقلة والمساهمة الهامشية

- **التغطية المستقلة:** ما يستطيع المشروع تقديمه إذا استُخدم وحده.
- **المساهمة الهامشية:** النقاط الجديدة التي يضيفها إلى Odoo في أجزاء لم تكن مغطاة بالفعل.
- **التغطية التراكمية:** تغطية Odoo مضافاً إليها المساهمات الهامشية غير المتداخلة.
- **المتبقي المخصص:** الوظائف أو السلوكيات التي لا يقدمها مصدر مستقر جاهز بالقدر المطلوب.

لذلك لا يجوز جمع 85.5% لـOdoo مع 75.8% لـERPNext. معظم وظائفهما متداخلة، والجمع الحسابي سيعطي نتيجة وهمية تتجاوز 100%.

### 3.2 قاعدة احتساب المساهمة

حُسبت المساهمة وفق المبادئ الآتية:

1. لا يأخذ المكوّن نقاطاً في وظيفة يغطيها Odoo بالمستوى نفسه.
2. لا تتجاوز الإضافة العجز المتبقي في المجال.
3. تخفض النقاط عندما يحتاج المكوّن إلى إعادة كتابة كبيرة قبل الاستفادة منه.
4. لا تُحسب المشاريع التجريبية أو العروض التوضيحية أو الإصدارات غير المستقرة.
5. تُحسب المكتبة التأسيسية بقدر ما توفره فعلياً من تخزين أو مزامنة أو عقد أو بروتوكول، لا بوصفها ميزة منتج مكتملة.
6. لا يُحسب التكامل الذي ينشئ مصدر حقيقة ثانياً للمبيعات أو المخزون.

### 3.3 بوابة النضج والاستقرار

لا يدخل المكوّن في التركيب الإلزامي إلا إذا حقق:

- إصدار GA أو فرعاً مستقراً قابلاً للتثبيت.
- نشاط صيانة وإصلاحات أمنية أو إصدارات حديثة.
- توثيقاً رسمياً وعقداً واضحاً للاستخدام.
- بنية اختبار أو سياسة إصدارات معقولة.
- قابلية تشغيل مستقلة ضمن حدود واضحة.
- عدم الاعتماد على مشروع تجريبي بوصفه قلب تدفق مالي أو تشغيلي.

### 3.4 مقياس تعقيد الدمج

| الدرجة | التفسير |
|---:|---|
| 1 | منخفض جداً: تهيئة أو اتصال قراءة فقط |
| 2 | منخفض: محول صغير وعقد ثابت |
| 3 | متوسط: خدمة أو مخطط هوية أو بوابة أجهزة مستقلة |
| 4 | مرتفع: مزامنة حالات ومعاملات متعددة أو عميل جديد |
| 5 | مرتفع جداً: نظاما حقيقة، مخططان تشغيليان، وتسوية ثنائية الاتجاه |

## 4. إعادة تقييم المرشحين بوصفهم أجزاء في نظام هجين

| المرشح | القيمة الفريدة بعد اختيار Odoo | التعقيد إذا شُغّل مع Odoo | مخاطر الازدواج | قرار وقت التشغيل |
|---|---|---:|---|---|
| **Odoo Community 19.0** | أعلى تقاطع موحد بين POS والمخزون والمطاعم والموظفين والمحاسبة وZATCA | 1/5 بوصفه النواة | لا يوجد عند اعتماده مصدراً وحيداً | **مختار كنواة** |
| ERPNext + POS Awesome | REST ومخزون وتصنيع قويان، وواجهة POS إضافية | 5/5 | مرتفعة جداً: أصناف، عملاء، فواتير، مخزون، ضرائب ودفعات مزدوجة | غير مختار كمكوّن تشغيل |
| Dolibarr + TakePOS | Back Office وREST وPOS ويب | 5/5 | مرتفعة جداً مع اختلاف PHP/MySQL ونماذج المستندات | غير مختار |
| uniCenta oPOS | خبرة جيدة بالأجهزة والطابعات والمطاعم المحلية | 5/5 | قاعدة محلية وجلسات وإيصالات مستقلة؛ iOS/Android يحتاجان RDP وفق توثيقه | غير مختار؛ مرجع عتاد فقط |
| FloreantPOS | تدفقات مطاعم وطاولات وطباعة مطبخ قوية | 5/5 | طلبات ودفعات ومستخدمون مستقلون؛ KDS المجاني موصوف تجريبياً | غير مختار؛ مرجع سلوك فقط |
| NexoPOS Core | نظام وحدات وPOS ويب حديث | 4/5 | تكرار الكتالوج والمخزون والعملاء، والميزات المطعمية خارج النواة | غير مختار |
| OSPOS | POS تجزئة بسيط وناضج | 4/5 | يكرر وظائف أقل عمقاً ولا يضيف KDS أو Offline أو ZATCA | غير مختار |

### 4.1 لماذا لا يُعد تشغيل نظامين كاملين تركيباً ناجحاً

تشغيل Odoo مع ERPNext أو Dolibarr أو uniCenta أو Floreant كنظامين متساويين يفرض الإجابة عن أسئلة لا تضيف قيمة مباشرة للمطابقة:

- أيهما ينشئ رقم الإيصال النهائي؟
- أيهما يملك كمية المخزون؟
- أين تُحسب الضريبة والتقريب؟
- كيف يُمنع Refund مزدوج؟
- أي وردية ترتبط بالدفع؟
- كيف تُسوّى نقاط الولاء عند الانقطاع؟
- كيف يُحافظ على تسلسل مستندات ZATCA؟

كل إجابة تنتهي إما إلى اختيار نظام واحد مرجعاً والآخر واجهة باهظة، أو إلى بناء تسوية ثنائية الاتجاه عالية المخاطر. لذلك يحقق الهيكل المختار التنوع في **المكونات المتخصصة** لا في **أنظمة السجل**.

## 5. النظام الأساسي المختار

### 5.1 Odoo Community 19.0

| البند | التقييم |
|---|---|
| الدور | نظام السجل المركزي والنواة الوظيفية |
| التغطية المستقلة | 85.5% |
| النضج | 5/5 |
| التعقيد الأساسي | 1/5 |
| مصدر البيانات | PostgreSQL عبر Odoo ORM |
| وحدات النواة | point_of_sale، pos_restaurant، pos_hr، pos_loyalty، stock، purchase، mrp، l10n_sa، l10n_sa_edi |
| سبب الاختيار | أعلى تغطية سابقة وأقل تشتت بين POS وBack Office والمخزون والمطاعم وZATCA |

يصف المستودع الرسمي Odoo بأنه مجموعة تطبيقات أعمال مفتوحة تشمل POS والمخزون والموارد البشرية والتصنيع، ويحتوي فرع 19.0 النشط على أكثر من مئتي ألف commit. كما توثق Odoo 19 إدارة المتاجر والمطاعم، الأجهزة، شاشة العميل، واجهة JSON-2، والتكامل السعودي مع ZATCA:

- [مستودع Odoo الرسمي — فرع 19.0](https://github.com/odoo/odoo)
- [Odoo 19 — Point of Sale](https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale.html)
- [Odoo 19 — Restaurant](https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/restaurant.html)
- [Odoo 19 — Hardware and Network](https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/hardware_network.html)
- [Odoo 19 — Customer Display](https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/hardware_network/customer_display.html)
- [Odoo 19 — External JSON-2 API](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html)
- [Odoo 19 — Saudi Arabia and ZATCA](https://www.odoo.com/documentation/19.0/applications/finance/fiscal_localizations/saudi_arabia.html)

### 5.2 حدود مسؤولية النواة

Odoo يظل المالك الوحيد لـ:

- الأصناف والمتغيرات والفئات والضرائب والخصومات.
- المتاجر والمواقع والكميات والحركات.
- العملاء والموظفين والحقوق التشغيلية.
- التذاكر والإيصالات والاسترداد والورديات.
- القيود المحاسبية والتقارير المالية الأساسية.
- وثائق ZATCA والتسلسل المحاسبي.

لا تكتب Superset أو Keycloak أو تطبيقات الهاتف أو خدمة الطباعة في جداول Odoo مباشرة.

## 6. الأنظمة والمكتبات الداعمة المختارة

### 6.1 FastAPI مع Pydantic

| البند | التقييم |
|---|---|
| الدور | طبقة توافق REST/OpenAPI مستقلة أمام Odoo |
| الإصدار المرجعي الحالي | FastAPI 0.141.0؛ يُثبت آخر patch مستقر عند التجميد |
| النضج | 5/5 |
| المساهمة الهامشية | 0.8 نقطة |
| المجال المستفيد | H — API والتكاملات |
| تعقيد الدمج | 3/5 |
| أسلوب الربط | استدعاء خدمات Odoo المصرح بها وتحويل الموارد إلى العقد الخارجي |

يسد FastAPI فرق شكل العقد، لا فرق قواعد الأعمال. يوفّر تعريف OpenAPI والتحقق من المدخلات والمخرجات والأخطاء والإصدار، بينما تظل أوامر البيع والمخزون في Odoo. نشاط الإصدارات الرسمي مستمر، وكان 0.141.0 إصداراً موثقاً في 29 يوليو 2026.

- [FastAPI — المستودع الرسمي](https://github.com/fastapi/fastapi)
- [FastAPI — الإصدارات الرسمية](https://github.com/fastapi/fastapi/releases)

**ما يغطيه:**

- عقد REST versioned.
- OpenAPI schemas.
- validation وتسلسل JSON.
- cursor وerror envelope ورفع الصور.
- حد واضح بين العملاء ونماذج Odoo.

**ما لا يغطيه:**

- منطق البيع أو المخزون.
- المزامنة المحلية وحدها.
- OAuth الكامل؛ يغطيه Keycloak.

### 6.2 Keycloak

| البند | التقييم |
|---|---|
| الدور | مزود الهوية وOAuth 2.0 وOpenID Connect |
| الإصدار المرجعي الحالي | 26.7.1 — صدر 5 أغسطس 2026 |
| النضج | 5/5 |
| المساهمة الهامشية | 0.6 نقطة |
| المجال المستفيد | H — API والتكاملات |
| تعقيد الدمج | 3/5 |
| أسلوب الربط | رموز OIDC تحمل subject وscopes، مع mapping إلى مستخدم ومتجر وجهاز في Odoo |

يوفر Keycloak SSO وOIDC وOAuth 2.0 وSAML والهوية المركزية وخدمات التفويض. وجود دورة إصدارات أمنية نشطة وإصدار 26.7.1 حديث يجعله أنسب من بناء مزود هوية كامل داخل Odoo.

- [Keycloak — الإصدار 26.7.1](https://www.keycloak.org/2026/08/keycloak-2671-released)
- [Keycloak — دليل إدارة الخادم](https://www.keycloak.org/docs/latest/server_admin/index.html)
- [Keycloak — OpenID Connect](https://www.keycloak.org/securing-apps/oidc-layers)
- [Keycloak — الإصدارات الرسمية](https://github.com/keycloak/keycloak/releases)

**ما يغطيه:**

- Authorization Code وrefresh وrevoke.
- UserInfo وJWKS وتدوير المفاتيح.
- عملاء عامة وسرية وتطبيقات متعددة.
- إدارة مركزية للهوية والسياسات.

**ما يبقى داخل Odoo:**

- صلاحيات المتجر والسجل وإجراءات PIN التشغيلية.
- علاقة الموظف بالوردية والجهاز.
- Personal Access Token المتوافق إذا اختلف عقده عن Keycloak.

### 6.3 Celery مع RabbitMQ

| البند | التقييم |
|---|---|
| الدور | تنفيذ المهام غير المتزامنة وتسليم Webhooks والموصلات |
| الإصدار المرجعي الحالي | Celery 5.6.3 وRabbitMQ 4.3.4 |
| النضج | 5/5 |
| المساهمة الهامشية | 0.4 نقطة |
| المجال المستفيد | H أساساً، مع دعم محدود لـI |
| تعقيد الدمج | 4/5 |
| أسلوب الربط | Outbox داخل معاملة Odoo ثم نشر مؤكد إلى RabbitMQ ومهام Celery idempotent |

توثق Celery 5.6.3 retry مع task ID ثابتاً وسياسات routing، بينما يوفر RabbitMQ publisher confirms وconsumer acknowledgements وquorum queues. لا تُستخدم الطوابير بديلاً من سجل Odoo؛ تستخدم لنقل العمل بعد ثبات المعاملة.

- [Celery 5.6.3 — Tasks and Retry](https://docs.celeryq.dev/en/stable/userguide/tasks.html)
- [Celery 5.6.3 — Configuration](https://docs.celeryq.dev/en/stable/userguide/configuration.html)
- [RabbitMQ — الإصدار الحالي](https://www.rabbitmq.com/docs/download)
- [RabbitMQ — Reliability](https://www.rabbitmq.com/docs/reliability)
- [RabbitMQ — Publisher Confirms and Consumer Acknowledgements](https://www.rabbitmq.com/docs/confirms)
- [RabbitMQ — Quorum Queues](https://www.rabbitmq.com/docs/quorum-queues)

**ما يغطيه:**

- retries وbackoff وجدولة المحاولات.
- فصل Webhooks والدفع والطباعة البعيدة عن طلب المستخدم.
- routing حسب نوع المهمة.
- استعادة العمل بعد توقف العامل.

**قيد التصميم:**

التسليم at-least-once؛ لذلك تظل idempotency والتسجيل النهائي مسؤولية طبقة المجال.

### 6.4 Apache Superset

| البند | التقييم |
|---|---|
| الدور | التحليلات ولوحات الإدارة والتصفية والاستكشاف |
| الإصدار المرجعي | أحدث إصدار GA مدعوم من السلسلة 6.x؛ لا يستخدم RC |
| النضج | 5/5 |
| المساهمة الهامشية | 0.8 نقطة |
| المجال المستفيد | F — التقارير وDashboard |
| تعقيد الدمج | 2/5 |
| أسلوب الربط | قراءة views أو replica للتقارير، مع embedding وRow-Level Security |

جدول إصدار Superset الرسمي يصنف السلسلة 6 مدعومة حتى النصف الأول من 2027. يدعم PostgreSQL، embedding، guest tokens، وRow-Level Security، ما يسمح ببناء لوحات قوية من دون منحه حق الكتابة في بيانات التشغيل.

- [Apache Superset — دعم الإصدارات](https://github.com/apache/superset/wiki/Release-Process)
- [Superset — PostgreSQL](https://superset.apache.org/user-docs/databases/supported/postgresql/)
- [Superset — Embedded Dashboards](https://superset.apache.org/user-docs/using-superset/embedding)
- [Superset — Row-Level Security](https://superset.apache.org/admin-docs/security/)
- [Superset — API](https://superset.apache.org/developer-docs/api/)

**ما يغطيه:**

- لوحات ومخططات وفلاتر وفترات ومقارنات.
- صلاحيات صفوف للمتاجر.
- استكشاف البيانات والتقارير الإدارية.
- embedding في Back Office.

**ما لا يغطيه:**

- تجربة تطبيق Dashboard المتنقل المطابقة بذاتها.
- تعريف مقاييس Loyverse؛ يجب تثبيتها في views مرجعية.
- حالات POS التشغيلية.

### 6.5 Kotlin Multiplatform مع Ktor وSQLDelight

| البند | التقييم |
|---|---|
| الدور | المجال والشبكة والتخزين والمزامنة المشتركة لعملاء Android وiOS |
| الإصدار المرجعي | Kotlin 2.4.10، Ktor 3.5.2، SQLDelight 2.3.2؛ تثبت الإصدارات المتوافقة معاً |
| النضج | 4.5/5 |
| المساهمة الهامشية | 2.8 نقطة |
| المجالات المستفيدة | A وB وD وF وG وI |
| تعقيد الدمج | 4/5 |
| أسلوب الربط | shared domain وSQLite وHTTP client، مع واجهة منصة مستقلة عند الحاجة |

توثق Kotlin أن Android وiOS مستقران في Kotlin Multiplatform، وأن مشاركة منطق الأعمال مع إبقاء الواجهة أصلية خيار رسمي. كما يدعم SQLDelight SQLite على Android وNative وMultiplatform ويتحقق من schema وmigrations أثناء البناء.

- [Kotlin Multiplatform — استقرار المنصات](https://kotlinlang.org/docs/multiplatform/supported-platforms.html)
- [Kotlin Multiplatform — منطق مشترك وواجهة أصلية](https://kotlinlang.org/docs/multiplatform/native-and-cross-platform.html)
- [Kotlin Multiplatform — هيكل المشروع الموصى به](https://kotlinlang.org/docs/multiplatform/multiplatform-project-recommended-structure.html)
- [Kotlin Multiplatform — Ktor للشبكة](https://kotlinlang.org/docs/multiplatform/multiplatform-upgrade-app.html)
- [SQLDelight — المستودع الرسمي](https://github.com/sqldelight/sqldelight)
- [SQLDelight 2.3.2 — المنصات المدعومة](https://sqldelight.github.io/sqldelight/2.3.2/)

### توزيع مساهمته الهامشية

| المجال | النقاط |
|---|---:|
| A — هيكل POS الأصلي المشترك | 0.2 |
| B — أساس KDS وحالات الطلب المحلية | 0.5 |
| D — هوية الجهاز وتدفقات الموظف المحلية | 0.2 |
| F — أساس تطبيق Dashboard المتنقل | 0.2 |
| G — أساس CDS وجسور الأجهزة | 0.2 |
| I — SQLite والمزامنة ودورة تطبيقات Android/iOS | 1.5 |
| **المجموع** | **2.8** |

هذه النقاط تمثل منطقاً وتخزيناً وشبكة قابلة لإعادة الاستخدام، وليست شاشات Loyverse جاهزة. الواجهة والحركات والفروق الدقيقة تظل عملاً مخصصاً.

### 6.6 OpenPrinting CUPS مع python-escpos

| البند | التقييم |
|---|---|
| الدور | بوابة طباعة داخل الفرع للطابعات الشبكية وUSB وESC/POS |
| الإصدار المرجعي | CUPS 2.4.18 وpython-escpos 3.1 |
| النضج | 4/5 |
| المساهمة الهامشية | 0.5 نقطة |
| المجال المستفيد | G — الأجهزة والطباعة وCDS |
| تعقيد الدمج | 3/5 |
| أسلوب الربط | print jobs معيارية من Odoo أو عميل POS إلى Edge Gateway |

CUPS نظام طباعة مفتوح قائم على المعايير ويدعم AirPrint وIPP Everywhere والطابعات الشبكية وUSB. وتوفر python-escpos نصوصاً وصوراً وباركود وQR وcut، مع USB وNetwork وSerial وCUPS.

- [OpenPrinting CUPS — المستودع الرسمي](https://github.com/OpenPrinting/cups)
- [CUPS — الإصدار 2.4.18](https://github.com/OpenPrinting/cups/releases)
- [CUPS — Printer Applications and Drivers](https://openprinting.github.io/cups/drivers.html)
- [python-escpos — المستودع الرسمي](https://github.com/python-escpos/python-escpos)
- [python-escpos — التوثيق](https://python-escpos.readthedocs.io/)
- [python-escpos — الإصدارات](https://github.com/python-escpos/python-escpos/releases)

**ما يغطيه:**

- ESC/POS والنص والصورة والباركود وQR.
- الطابعة الشبكية وUSB وSerial.
- cutter وبعض وظائف العتاد.
- profiles لقدرات الطابعة.

**ما لا يغطيه:**

- SDKs الخاصة بكل طابعة مدمجة على Android أو iOS.
- قيود ExternalAccessory وBluetooth الخاصة بمنصة Apple.
- كل حالات status للطرازات المستهدفة.

## 7. قائمة التركيب المختارة ونسب المساهمة

| الترتيب البنيوي | المصدر | الدور | التغطية المستقلة أو الهامشية | التغطية التراكمية | تعقيد الدمج |
|---:|---|---|---:|---:|---:|
| 1 | **Odoo Community 19.0** | النواة ومصدر الحقيقة | **85.5% مستقلة** | **85.5%** | 1/5 |
| 2 | Kotlin Multiplatform + Ktor + SQLDelight | العملاء المحليون والمزامنة والأسطح الأصلية | **+2.8% هامشية** | 88.3% | 4/5 |
| 3 | FastAPI + Pydantic | عقد REST/OpenAPI | **+0.8%** | 89.1% | 3/5 |
| 4 | Apache Superset | التقارير وDashboard | **+0.8%** | 89.9% | 2/5 |
| 5 | Keycloak | OAuth/OIDC والهوية | **+0.6%** | 90.5% | 3/5 |
| 6 | CUPS + python-escpos | طباعة الفرع وESC/POS | **+0.5%** | 91.0% | 3/5 |
| 7 | Celery + RabbitMQ | Webhooks والمهام والموصلات | **+0.4%** | **91.4%** | 4/5 |
| 8 | طبقة المطابقة المخصصة | السلوك الدقيق والفجوات التي لا يغطيها مصدر مستقر | **+8.6%** | **100% مستهدف** | تُحلل في المرحلة الثانية |

### 7.1 قراءة صحيحة للنسب

- نسبة Odoo هي تغطية وظيفية مستقلة من الدراسة السابقة.
- نسب المكونات الأخرى هامشية وغير متداخلة.
- لا تمثل النسب حجماً زمنياً أو عدد أسطر الكود.
- لا تُمنح أي مكتبة نقاطاً لمجرد أنها تسهل البرمجة.
- طبقة 8.6% ليست مشروعاً مفتوح المصدر جديداً؛ هي التخصيص الضروري فوق المكونات المختارة.

## 8. أثر الهيكل الهجين على المجالات العشرة

| المجال | الحد الأقصى | Odoo وحده | إضافة المصادر الداعمة | بعد التركيب | المتبقي للمطابقة الدقيقة |
|---|---:|---:|---:|---:|---:|
| A — نواة POS | 18.0 | 16.6 | 0.2 | 16.8 | 1.2 |
| B — المطاعم وKDS | 12.0 | 9.1 | 0.5 | 9.6 | 2.4 |
| C — Back Office والمخزون | 15.0 | 14.4 | 0.0 | 14.4 | 0.6 |
| D — المتاجر والموظفون | 10.0 | 8.4 | 0.2 | 8.6 | 1.4 |
| E — العملاء والولاء | 7.0 | 6.0 | 0.0 | 6.0 | 1.0 |
| F — التقارير وDashboard | 8.0 | 6.7 | 1.0 | 7.7 | 0.3 |
| G — الأجهزة والمدفوعات وCDS | 10.0 | 8.4 | 0.7 | 9.1 | 0.9 |
| H — API والتكاملات | 8.0 | 6.1 | 1.8 | 7.9 | 0.1 |
| I — المنصات وOffline | 8.0 | 5.8 | 1.5 | 7.3 | 0.7 |
| J — السعودية وZATCA | 4.0 | 4.0 | 0.0 | 4.0 | 0.0 |
| **المجموع** | **100.0** | **85.5** | **5.9** | **91.4** | **8.6** |

## 9. خريطة المكونات إلى أسطح Loyverse

| سطح Loyverse | المصدر الأساسي | المصدر الداعم | الدور المحدد |
|---|---|---|---|
| POS | Odoo point_of_sale والمطعم والموظفون والولاء | KMP وSQLDelight وKtor | منطق مركزي مع عميل محلي أصلي |
| Back Office | Odoo stock وpurchase وmrp والعملاء والموظفون | Superset للعرض التحليلي | الإدارة والكتالوج والمخزون والتقارير |
| Dashboard | Odoo reporting views | Superset وعميل KMP | المقاييس والفلاتر والوصول المتنقل |
| KDS | Odoo restaurant orders | عميل KMP محلي | تطبيق KDS مخصص فوق أحداث النواة |
| CDS | Odoo customer display data | عميل KMP وقناة محلية | شاشة مستقلة واقتران وحالة دفع |
| API | Odoo domain services | FastAPI وKeycloak | REST versioned وOAuth/OIDC |
| Webhooks | Odoo transaction outbox | Celery وRabbitMQ | تجميع وتوقيع وإعادة محاولة |
| Offline | Odoo sync services | SQLDelight وKMP وKtor | تخزين محلي وOutbox وعودة الاتصال |
| التقارير | Odoo/PostgreSQL reporting views | Superset | لوحات واستكشاف وRLS |
| الطباعة | Odoo print intents | CUPS وpython-escpos | بوابة ESC/POS داخل الفرع |
| الدفع | Odoo POS payment domain | موصلات مزودين مخصصة | لا يوجد مشروع عام واحد يغطي المصفوفة المطلوبة |
| ZATCA | Odoo l10n_sa وl10n_sa_edi | لا مكوّن ثانٍ | الاستفادة من التكامل الموجود وتخصيص تجربة POS |

## 10. تقييم سهولة التركيب والربط

| المكوّن | اتجاه البيانات | اقتران البيانات | سهولة الدمج | التعقيد | سبب الدرجة |
|---|---|---|---:|---:|---|
| Odoo modules الداخلية | داخل النواة | موحد | 5/5 | 1/5 | ORM ومخطط وصلاحيات ضمن منصة واحدة |
| Superset | قراءة من views/replica | منخفض | 4/5 | 2/5 | اتصال PostgreSQL وRLS وembedding موثقة |
| FastAPI | ثنائي عبر خدمات Odoo | متوسط | 3/5 | 3/5 | يلزم mapping للموارد والأخطاء والإصدارات |
| Keycloak | رموز وهوية إلى API/Odoo | متوسط | 3/5 | 3/5 | يلزم mapping للمستخدم والمتجر والجهاز وscopes |
| CUPS/python-escpos | print jobs إلى الفرع | متوسط | 3/5 | 3/5 | البروتوكول واضح؛ تنوع الطرازات يزيد الاختبار |
| Celery/RabbitMQ | أحداث صادرة ونتائج واردة | متوسط إلى مرتفع | 2/5 | 4/5 | يلزم outbox وidempotency وdead-letter ومراقبة |
| KMP/Ktor/SQLDelight | ثنائي مع العملاء | مرتفع | 2/5 | 4/5 | يلزم مزامنة وحل تعارض وواجهات منصة وأجهزة |

### 10.1 متوسط التعقيد

عند وزن تعقيد كل مكوّن بمساهمته الهامشية، يبلغ تعقيد الدمج **3.4 من 5**. السبب الأكبر هو طبقة العملاء المحليين، وليست Superset أو Keycloak.

### 10.2 حدود تمنع تحول التركيب إلى نظام هش

1. Odoo هو الكاتب الوحيد لبيانات الأعمال المركزية.
2. Superset للقراءة فقط.
3. Keycloak يثبت الهوية؛ Odoo يقرر صلاحية السجل والإجراء.
4. FastAPI لا يعيد تنفيذ محرك الضرائب أو المخزون.
5. RabbitMQ لا يصبح السجل النهائي للبيع.
6. SQLDelight يحتفظ بالحالة المحلية والمزامنة، ولا يحل محل PostgreSQL المركزي.
7. CUPS وpython-escpos يستقبلان print jobs ولا يملكان الإيصال المالي.
8. كل مكوّن قابل للاستبدال خلف عقد، باستثناء Odoo بوصفه النواة المختارة.

## 11. فحص النضج والاستقرار للمكونات المختارة

| المكوّن | دليل الاستقرار الحالي | مستوى الثقة |
|---|---|---|
| Odoo Community 19.0 | فرع رسمي نشط، منظومة كبيرة، ووثائق 19.0 كاملة | مرتفع جداً |
| FastAPI | إصدار 0.141.0 موثق في يوليو 2026 ونشاط إصدار مستمر | مرتفع |
| Keycloak | إصدار 26.7.1 في أغسطس 2026 وتحديثات أمنية متتابعة | مرتفع جداً |
| Celery | توثيق stable 5.6.3 وسياسات retry/routing معروفة | مرتفع |
| RabbitMQ | إصدار 4.3.4 ودليل دعم وترقية وموثوقية رسمي | مرتفع جداً |
| Apache Superset | سلسلة 6 مدعومة رسمياً، وPostgreSQL وembedding وRLS موثقة | مرتفع |
| Kotlin Multiplatform | Android وiOS مصنفان Stable؛ مشاركة المنطق مع UI أصلي مسار رسمي | مرتفع |
| Ktor | إصدار مستقر موثق ضمن أمثلة KMP الرسمية | مرتفع |
| SQLDelight | إصدار 2.3.2 ودعم Android وNative وMultiplatform وSQLite | مرتفع |
| CUPS | سلسلة 2.4 مستقرة وإصدار 2.4.18 وصيانة أمنية نشطة | مرتفع جداً |
| python-escpos | إصدار 3.1، أكثر من 900 commit، profiles واختبارات وبروتوكولات متعددة | مرتفع |

## 12. بدائل داعمة فُحصت ولم تُعتمد

| البديل | الوظيفة التي كان يمكن أن يغطيها | سبب عدم إدخاله في الأساس الإلزامي |
|---|---|---|
| OCA base_rest على 19.0 | REST داخل Odoo | انتقال 19.0 كان ما يزال ضمن طلبات migration مفتوحة؛ FastAPI يقدم حداً مستقراً مستقلاً |
| OCA connector على 19.0 | موصلات ومكونات | مسار migration 19.0 أظهر أعمالاً واختبارات غير مكتملة في اللقطة |
| OCA queue_job | مهام Odoo | مشروع ناضج، لكن طبقة Celery/RabbitMQ تفصل العمال الخارجيين وWebhooks عن دورة Odoo وتملك إصداراً مستقراً واضحاً |
| URY/Mosaic | KDS ومطاعم على Frappe | مستودع Mosaic المنفصل لم يعد مصاناً، والنسخة الموحدة تغيّر الحدود؛ ليست إضافة مستقرة لـOdoo |
| OpenKDS | KDS ويب | موصوف WIP/Beta، لا إصدارات مستقرة وتوثيقه غير مكتمل |
| Ditto POS/KDS demo | KDS أصلي ومزامنة جهازية | مستودع Demo وليس منتج KDS مستقلاً، ويعتمد على محرك مزامنة خارجي |
| Floreant KDS المجاني | شاشة مطبخ | التوثيق الرسمي يصفه Experimental مع refresh lag |
| SaleFlex.KITCHEN | KDS | الوظيفة ما تزال في roadmap والمستودع حديث وصغير |
| uniCenta Remote Display | أجهزة وعرض | مزايا أحدث تمر عبر قناة دعم، وAndroid/iPad يعتمدان RDP لا تطبيقاً أصلياً |

أدلة الاستبعاد:

- [OCA rest-framework — انتقال 19.0](https://github.com/OCA/rest-framework/issues/567)
- [OCA connector — انتقال 19.0](https://github.com/OCA/connector/actions/runs/19719623314)
- [URY — المستودع الموحد](https://github.com/ury-erp/ury)
- [OpenKDS](https://github.com/BenClementt/OpenKDS)
- [Ditto POS/KDS Demo](https://github.com/getditto/demoapp-pos-kds)
- [Floreant — حالة KDS المجاني](https://floreant.org/features/take-out/)
- [SaleFlex — حالة وظائف المطاعم](https://saleflex.dev/open-source-restaurant-pos/)
- [uniCenta — FAQ والمنصات والتكامل](https://www.unicenta.com/faqs/)

## 13. لماذا لم تُضف وحدة ولاء أو ERP ثانٍ

### 13.1 الولاء

Odoo pos_loyalty والعملاء والخصومات تغطي القلب. إضافة نظام ولاء مستقل ستنشئ رصيد نقاط ومصدر قواعد ثانياً، بينما المتبقي هو مطابقة دلالة الكسب والاستبدال والعرض داخل POS. لذلك يُخصص فوق نموذج Odoo بدلاً من دمج مشروع كامل.

### 13.2 المخزون والتقارير المالية

ERPNext أقوى قليلاً في بعض أجزاء المخزون وREST، لكنه لا يضيف نقاطاً كافية بعد وصول Odoo إلى 14.4 من 15 في المجال C. الحفاظ على مخزونين وتسويتين لا يبرر مكسباً أقصى قدره 0.6 نقطة.

### 13.3 KDS

لا يوجد بين المرشحين أو البدائل التي اجتازت البحث مشروع KDS مستقل يجمع في وقت واحد:

- إصداراً مستقراً.
- تطبيق Android وiPad أصلياً.
- تشغيل LAN دون إنترنت.
- حالات done وvoid وrecall والتوجيه والتوقيت.
- عقداً يسهل ربطه بـOdoo من دون قاعدة طلبات ثانية.

لذلك يوفّر KMP وSQLDelight الأساس المستقر، ويُبنى KDS كعميل محدود المجال فوق أحداث Odoo. هذا أقل خطراً من تشغيل Floreant أو URY كنظام طلبات ثانٍ.

### 13.4 الدفع

لا يغطي مشروع عام واحد مصفوفة مزودي الدفع والأجهزة والبلدان المستهدفة. تبقى Odoo payment abstractions نقطة البداية، ويكون كل مزود adapter مستقلاً. لا تُمنح نسبة تغطية وهمية لمكتبة دفع لا تدعم الطرفيات المطلوبة.

## 14. الهيكل الهجين النهائي

| الطبقة | المكوّن المختار | المسؤولية |
|---|---|---|
| نظام السجل | Odoo Community 19.0 + PostgreSQL | البيانات والمعاملات وقواعد الأعمال |
| حدود الموارد | FastAPI + Pydantic | REST/OpenAPI والتوافق والتحويل |
| الهوية | Keycloak | OIDC/OAuth والرموز والمفاتيح |
| العمل غير المتزامن | Celery + RabbitMQ | Webhooks والموصلات وإعادة المحاولة |
| التحليلات | Apache Superset | لوحات وتقارير قراءة فقط |
| العملاء المحليون | Kotlin Multiplatform + Ktor + SQLDelight | POS وDashboard وKDS وCDS والمنطق المحلي |
| الطباعة الفرعية | CUPS + python-escpos | IPP وESC/POS والطباعة والأجهزة العامة |
| المطابقة النهائية | وحدات Odoo وعملاء مخصصون | السلوك الدقيق المتبقي بنسبة 8.6% |

### 14.1 مسارات البيانات العليا

| المسار | التسلسل المختار |
|---|---|
| أمر بيع | عميل محلي ← FastAPI ← خدمة Odoo ← PostgreSQL |
| مزامنة | SQLDelight Outbox ← FastAPI ← Odoo domain command ← acknowledgment |
| هوية | العميل ← Keycloak ← token ← FastAPI/Odoo mapping |
| Webhook | Odoo outbox ← RabbitMQ ← Celery ← endpoint خارجي |
| Dashboard | Odoo reporting views ← Superset أو API ← تطبيق الإدارة |
| طباعة | Odoo أو POS print job ← Edge Gateway ← CUPS/python-escpos ← الطابعة |
| KDS/CDS | Odoo/POS events ← قناة العميل ← قواعد SQLDelight المحلية |

## 15. القرار النهائي

| البند | القرار |
|---|---|
| Core System | **Odoo Community 19.0** |
| قاعدة البيانات المركزية | PostgreSQL الخاص بـOdoo |
| API compatibility | FastAPI + Pydantic |
| Identity | Keycloak |
| Async/Webhooks | Celery + RabbitMQ |
| Analytics | Apache Superset |
| Native/offline foundation | Kotlin Multiplatform + Ktor + SQLDelight |
| Printing edge | CUPS + python-escpos |
| دمج ERP/POS ثانٍ | مرفوض |
| تغطية المصادر القابلة لإعادة الاستخدام | **91.4%** |
| المتبقي المخصص | **8.6%** |
| الثقة في الاختيار | مرتفعة |

**الحكم:** هذا التركيب يحقق أعلى قيمة من المصادر المفتوحة المستقرة مع أقل ازدواج ممكن. Odoo يحتفظ بالحقيقة التشغيلية، بينما تضيف المشاريع الداعمة وظائف متخصصة لا تنافسه على ملكية البيانات. الهيكل مناسب للوصول إلى 100% بعد تنفيذ طبقة المطابقة المتبقية، ولا يعتمد على KDS تجريبي أو POS ثانٍ أو مزامنة ثنائية بين نظامي ERP.

## 16. المصادر الأولية

### النواة والمرشحون

- [Odoo — المستودع الرسمي](https://github.com/odoo/odoo)
- [ERPNext — المستودع الرسمي](https://github.com/frappe/erpnext)
- [POS Awesome — المستودع الرسمي](https://github.com/ucraft-com/POS-Awesome)
- [Dolibarr — المستودع الرسمي](https://github.com/Dolibarr/dolibarr)
- [Dolibarr TakePOS](https://wiki.dolibarr.org/index.php/Module_Point_of_sale_%28TakePOS%29)
- [uniCenta oPOS](https://unicenta.com/)
- [FloreantPOS](https://github.com/floreantpos/floreantpos)
- [NexoPOS](https://github.com/Blair2004/NexoPOS)
- [OSPOS](https://github.com/opensourcepos/opensourcepos)

### المكونات الداعمة

- [FastAPI](https://github.com/fastapi/fastapi)
- [Keycloak](https://github.com/keycloak/keycloak)
- [Celery](https://github.com/celery/celery)
- [RabbitMQ](https://github.com/rabbitmq/rabbitmq-server)
- [Apache Superset](https://github.com/apache/superset)
- [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform/get-started.html)
- [Ktor](https://ktor.io/)
- [SQLDelight](https://github.com/sqldelight/sqldelight)
- [OpenPrinting CUPS](https://github.com/OpenPrinting/cups)
- [python-escpos](https://github.com/python-escpos/python-escpos)

---

**نقطة التوقف:** انتهت المرحلة الأولى فقط. لا يتضمن هذا المستند سجل الفجوات التفصيلي بعد الدمج، مخططات العقود والمزامنة الداخلية، أو خطة التنفيذ؛ فتلك عناصر المرحلتين الثانية والثالثة.
