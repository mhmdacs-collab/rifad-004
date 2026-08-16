# المرحلة الثالثة: خطة الهيكلة والتطوير البرمجي لتغطية فجوات Loyverse

| البيان | القيمة |
|---|---|
| المرحلة | الثالثة فقط: الهيكلة وخطة التطوير |
| قاعدة العمل المثبتة | Odoo Community 19.0 |
| مرجع النطاق | سجل الفجوات المكوّن من 51 بنداً في مخرجات المرحلة الثانية |
| نطاق المنتجات | POS، Back Office، Dashboard، KDS، CDS، API، Webhooks، الدفع، الطباعة، الأجهزة، ZATCA |
| معيار النهاية | إغلاق كل بند من البنود الـ51 باختبار قبول مرجعي، دون استثناءات مفتوحة |
| تاريخ الخطة | 2026-08-16 |

## 1. النتيجة التنفيذية

تُنفذ المطابقة عبر أربع طبقات مترابطة، مع إبقاء Odoo Community 19.0 نظام السجل المركزي:

1. **نواة Odoo ووحدات التوافق:** تحفظ الكتالوج، المخزون، المبيعات، الورديات، العملاء، الموظفين، المحاسبة، وبيانات ZATCA.
2. **حدود توافق مستقلة:** تقدم REST API بالإصدار المطلوب، OAuth، Webhooks، المزامنة، معرفات الموارد الثابتة، وأخطاء موحدة من دون كشف نماذج Odoo الداخلية.
3. **عملاء أصليون:** تطبيقات Android وiOS/iPadOS مستقلة لـPOS وDashboard وKDS وCDS، مع قاعدة محلية ومحرك مزامنة مشترك داخل كل منصة.
4. **طبقة تكامل الأجهزة:** موصلات الدفع، الطابعات، قارئات الباركود، الموازين، درج النقد، LAN، وZATCA عبر منافذ موحدة واختبارات عتاد فعلية.

لا يُعد أي تدفق مكتملاً بمجرد عمله على الخادم أو في المتصفح. الإغلاق يتطلب نجاحه على المنصات والأحجام والاتجاهات وحالات الاتصال والصلاحيات والعتاد الداخلة في مصفوفة النطاق.

## 2. القرارات الهيكلية الملزمة

| الرمز | القرار | سبب الإلزام | أثره في التنفيذ |
|---|---|---|---|
| AD-01 | Odoo Community 19.0 وPostgreSQL هما نظام السجل المركزي | الاستفادة من النواة المثبتة للمبيعات والمخزون والمحاسبة والموارد | لا تُنشأ نواة أعمال موازية خارج Odoo |
| AD-02 | تُنشأ طبقة توافق تمنع تسرب عقد Odoo إلى العملاء | عقد Odoo JSON-2 لا يطابق عقد الموارد المطلوب | كل عميل أو تكامل يتصل بعقد الإصدار 1.0 فقط |
| AD-03 | لا يكتب أي عميل مباشرة في PostgreSQL | حماية قواعد الأعمال، التدقيق، والترقيات | الكتابة تمر عبر أوامر API أو بوابة المزامنة |
| AD-04 | واجهات POS وDashboard وKDS وCDS أصلية لكل منصة | مطابقة السلوك، دورة الحياة، التخزين، والعتاد على Android وiOS | Kotlin على Android وSwift على Apple؛ لا WebView كواجهة المنتج الأساسية |
| AD-05 | POS محلي أولاً | البيع والوردية والتذكرة يجب ألا تعتمد على توفر الإنترنت | كل عملية محلية تُحفظ مع عملية Outbox في معاملة واحدة |
| AD-06 | الاستيعاب Idempotent من طرف إلى طرف | منع تكرار البيع والدفع والمخزون عند timeout أو retry | مفتاح فريد لكل أمر، Inbox لمنع التكرار، وإقرار لكل سجل |
| AD-07 | تغييرات الموارد تصدر من Transactional Outbox | ضمان عدم فقد API deltas أو Webhooks بعد نجاح المعاملة | كتابة المجال والحدث في معاملة PostgreSQL واحدة |
| AD-08 | قناة LAN لـKDS وCDS مستقلة عن قناة السحابة | استمرار العرض والتجهيز داخل المتجر دون إنترنت | اكتشاف واقتران مشفر، تسلسل أحداث، إقرار، وإعادة تشغيل |
| AD-09 | الدفع والطباعة والعتاد تعتمد منافذ ومهايئات | اختلاف SDK والبروتوكول حسب البلد والمنصة والموديل | آلة حالة موحدة ومهايئ منفصل لكل مزود أو عائلة أجهزة |
| AD-10 | ZATCA امتداد لوحدات Odoo العامة القائمة | القلب المحاسبي وEDI متاحان بالفعل | تُضاف طوابير وحالات وتجربة POS، ولا يعاد بناء محرك الفوترة |
| AD-11 | تعديلات نواة Odoo تُحصر في رقع معزولة | تقليل كلفة الترقية ومنع تشعب النواة | الأصل مثبت على commit؛ الوظائف الجديدة في custom addons |
| AD-12 | الاختبار المرجعي جزء من التصميم | المطابقة لا تثبت بالانطباع أو العرض اليدوي وحده | لكل Gap ID مجلد حالات وبيانات ولقطات وسجل نجاح |

## 3. الهيكلة المستهدفة

### 3.1 طبقات النظام

| الطبقة | المكونات | المسؤولية | لا يجوز لها |
|---|---|---|---|
| العملاء | POS، Dashboard، KDS، CDS على Android وApple | الواجهة، التخزين المحلي، دورة الحياة، LAN، موصلات المنصة | استخدام Odoo ORM أو معرفة معرفاته الداخلية |
| الحدود | Compatibility API، OAuth، Sync Gateway، Webhooks | تثبيت العقود والإصدارات والسياسات والتكرار والمزامنة | احتواء منطق محاسبي مكرر عن Odoo |
| وحدات التوافق | إضافات Odoo للمبيعات والموارد والتقارير والأجهزة | ترجمة الموارد، قواعد التدفق، الامتدادات، والتدقيق | تغيير نواة Odoo بلا رقعة موثقة |
| النواة | Odoo Community 19.0 وPostgreSQL | الحقيقة المركزية للبيانات والمعاملات | تقديم عقد العملاء مباشرة |
| التكاملات | الدفع، الطابعات، ZATCA، البريد، Push، Webhook targets | الاتصال بالأنظمة الخارجية وإرجاع حالة موحدة | تعديل الإيصال أو الدفع خارج معاملة المجال |

### 3.2 مسارات البيانات

| المسار | التسلسل |
|---|---|
| بيع Online | POS محلي ← حفظ المعاملة وOutbox ← Sync Gateway ← تحقق وتكرار آمن ← Odoo POS ← إقرار ← تحديث السجل المحلي |
| بيع Offline | POS محلي ← حفظ نهائي محلي ← انتظار الاتصال ← إرسال بالترتيب ← استيعاب Idempotent ← مصالحة الإيصال والمخزون |
| KDS دون إنترنت | POS ← قناة LAN مقترنة ← KDS SQLite ← إقرار متسلسل ← مزامنة لاحقة مع الخادم |
| CDS دون إنترنت | POS ← snapshot ثم deltas عبر LAN ← CDS ← حالة الدفع/الباقي ← إنهاء العرض |
| Webhook | معاملة Odoo ← Event Outbox ← تجميع ← توقيع ← HTTPS POST ← retry أو تعطيل |
| دفع متكامل | POS ← Payment Port ← SDK/طرفية ← تحقق من الحالة ← تثبيت الدفع محلياً ومركزياً ← reconciliation |
| ZATCA | إغلاق الإيصال ← إنشاء UBL/QR والتوقيع ← Submission Outbox ← قبول/تحذير/رفض ← تحديث حالة مرئية |

## 4. هيكل المستودع

يُحفظ Odoo المثبت منفصلاً عن الوحدات والعملاء والعقود. الهيكل المقترح:

    root/
      upstream/
        odoo/
      patches/
        odoo-19/
      server/
        addons/
          compat_core/
          compat_catalog/
          compat_pos/
          compat_inventory/
          compat_reports/
          compat_backoffice/
          compat_api/
          compat_identity/
          compat_sync/
          compat_webhooks/
          compat_kds/
          compat_cds/
          compat_devices/
          compat_payments/
          compat_sa_pos/
      clients/
        android/
          core-domain/
          core-data/
          core-network/
          core-sync/
          core-ui/
          feature-pos/
          feature-dashboard/
          feature-kds/
          feature-cds/
          hardware/
          payments/
        apple/
          SharedDomain/
          SharedData/
          SharedNetwork/
          SharedSync/
          SharedUI/
          POS/
          Dashboard/
          KDS/
          CDS/
          Hardware/
          Payments/
      contracts/
        openapi/
        oauth/
        resources/
        events/
        sync/
        lan/
        errors/
      fixtures/
        canonical/
        money-tax/
        offline/
        reports/
        zatca/
      tests/
        conformance/
        contract/
        integration/
        visual/
        offline/
        lan/
        payments/
        hardware/
        zatca/
        performance/
        security/
      infra/
        local/
        ci/
        integration/
        staging/
        production/
      docs/
        decisions/
        runbooks/
        release-evidence/

### 4.1 سياسة نواة Odoo

1. تثبيت فرع 19.0 على commit معلوم، وعدم التتبع العائم للفرع.
2. تنفيذ الوظائف في server/addons كلما أمكن.
3. تسجيل كل حاجة إلى تعديل النواة في قرار هندسي مستقل.
4. وضع التعديل الحتمي في patches/odoo-19 برقعة صغيرة واختبار انحدار.
5. تشغيل مجموعة المطابقة كاملة قبل نقل commit الأساس أو دمج إصلاح upstream.
6. منع استيراد وحدات Enterprise أو الاعتماد عليها في مسار المنتج.

## 5. تقسيم وحدات الخادم

| الوحدة | المسؤوليات | تعتمد على | الفجوات الأساسية |
|---|---|---|---|
| compat_core | هوية التاجر والمتجر والجهاز، UUID، revisions، audit، إعدادات السلوك | base، mail | DATA-01، SEC-01 |
| compat_catalog | Items، variants، modifiers، taxes، discounts، customers، loyalty | product، account، loyalty | CAT-01، CRM-01، POS-04، POS-05 |
| compat_pos | tickets، receipts، shifts، refunds، cash movements، permissions | point_of_sale، pos_hr، pos_restaurant | POS-01، POS-06 إلى POS-10، EMP-01 |
| compat_inventory | الموردون، الشراء، التحويل، العد، الإنتاج، التفكيك، الملصقات | stock، purchase، mrp | INV-01 إلى INV-05 |
| compat_reports | تعريف المقاييس، aggregates، exports، Dashboard projections | point_of_sale، stock، hr | REP-01، APP-02 |
| compat_backoffice | قوائم ونماذج وحالات ورسائل Back Office المختصرة | web ووحدات المجال | BO-01 |
| compat_identity | PAT، OAuth 2.0/OIDC، scopes، refresh، revoke، JWKS | auth، compat_core | API-02، SEC-01 |
| compat_api | REST resources، pagination، errors، images، rate policy | وحدات المجال والهوية | API-01، API-03 |
| compat_sync | command inbox، event outbox، cursors، tombstones، conflicts | compat_core ووحدات المجال | OFF-02 إلى OFF-05 |
| compat_webhooks | subscriptions، batches، signatures، deliveries، retries | compat_sync | WH-01، WH-02 |
| compat_kds | stations، routes، ticket projections، timers، recall | compat_pos، compat_sync | KDS-01 إلى KDS-03 |
| compat_cds | pairing metadata، display snapshots، session state | compat_pos، compat_sync | CDS-01، CDS-02 |
| compat_devices | printer profiles/jobs، routing، capability registry | compat_pos، compat_kds | PRN-01 إلى PRN-03، HW-01 |
| compat_payments | payment intents، attempts، reconciliation، provider config | point_of_sale، compat_sync | PAY-01 إلى PAY-03 |
| compat_sa_pos | POS EDI states، submission queue، QR وfailure UX | l10n_sa_pos، l10n_sa_edi_pos | SA-01، SA-02 |

## 6. بنية العملاء الأصليين

### 6.1 طبقات مشتركة داخل كل منصة

| المكون | Android | Apple | المسؤولية |
|---|---|---|---|
| Domain | Kotlin modules | Swift packages | الكيانات، قواعد الحالة، العملات، القيود، وأوامر المجال |
| Local Data | Room/SQLite | SQLite مع طبقة Swift مناسبة | الجداول، المعاملات، migrations، التشفير، والبحث المحلي |
| Network | HTTPS client | URLSession/Network.framework | REST، OAuth، retry المصنف، رفع الصور، والقياس |
| Sync | WorkManager | BackgroundTasks | Outbox، pull cursors، acknowledgements، tombstones، manual sync |
| UI System | Compose | SwiftUI مع UIKit عند الحاجة | tokens، RTL، dark theme، الأحجام، الحركات، وإتاحة الاختبار |
| LAN | NSD/mDNS وWebSocket/TLS | Bonjour/Network.framework | discovery، pairing، replay، heartbeat، وresync |
| Hardware | Android USB/Bluetooth/CameraX/NFC | ExternalAccessory/AVFoundation/Network/NFC | الطابعات والقارئات والموازين والدرج |
| Payments | Kotlin وJava bridges | Swift وObjective-C bridges | توحيد SDKs خلف Payment Port |

### 6.2 قاعدة الفصل بين التطبيقات

تُبنى POS وDashboard وKDS وCDS كتطبيقات قابلة للتثبيت مستقلاً. يجوز لها مشاركة حزم المجال والشبكة والهوية والتصميم، لكنها لا تشترك في قاعدة بيانات واحدة ولا تعتمد على تشغيل تطبيق آخر، باستثناء قناة الاقتران المقصودة بين POS وKDS/CDS.

## 7. نموذج البيانات الإضافي

### 7.1 الجداول والنماذج الجديدة

| النموذج | الحقول الجوهرية | القيود والفهارس | الغرض |
|---|---|---|---|
| compat.resource.identity | merchant، resource_type، external_uuid، model، record_id، revision، deleted_at | external_uuid فريد داخل التاجر والنوع | ثبات معرفات API وعدم كشف معرف Odoo |
| compat.device | uuid، store، platform، app، version، public_key، revoked_at | uuid فريد؛ فهرس store/status | هوية الجهاز والإبطال والصلاحيات |
| compat.device.session | device، employee، opened_at، last_seen، capabilities | جلسة فعالة واحدة وفق قاعدة المنتج | تتبع الدخول والقفل والتبديل |
| compat.command.inbox | tenant، device، idempotency_key، hash، result، status | مفتاح مركب فريد | منع استيعاب الأمر مرتين |
| compat.event.outbox | aggregate، event_type، sequence، payload، created_at، published_at | تسلسل فريد لكل aggregate؛ فهرس pending | تغذية المزامنة وWebhooks بأمان |
| compat.sync.cursor | consumer، stream، last_sequence، updated_at | consumer/stream فريد | مزامنة تفاضلية قابلة للاستئناف |
| compat.tombstone | resource_type، uuid، revision، deleted_at | uuid/revision مفهرسان | منع عودة السجل المحذوف |
| compat.ticket.metadata | order، sync_uuid، name، comment، revision، origin_device | sync_uuid فريد؛ فهرس store/state | تذاكر مفتوحة متزامنة |
| compat.kds.station | store، name، category_routes، warning_thresholds، key | فريد داخل المتجر | إعداد محطة KDS |
| compat.kds.event | station، ticket، sequence، event، payload، acked_at | station/sequence فريد | replay وإقرار أحداث المطبخ |
| compat.cds.pairing | pos_device، cds_device، key_version، state، last_seen | زوج نشط فريد | الاقتران وإلغاء الربط |
| compat.webhook.subscription | merchant، event_types، url، secret، status، api_version | فهرس status/event | إدارة الاشتراك |
| compat.webhook.delivery | subscription، batch، attempt، next_attempt، response | فهرس due/status | آلة التسليم وإعادة المحاولة |
| compat.payment.transaction | receipt، provider، external_ref، state، amount، currency | idempotency/provider ref فريدان | الحالة المالية الموحدة |
| compat.payment.attempt | transaction، attempt_no، request_hash، result، checked_at | transaction/attempt فريد | timeout وcheck-status والمصالحة |
| compat.print.profile | store، role، interface، model، routing، options | فهرس store/role | تعريف الطابعة والتوجيه |
| compat.print.job | source، profile، payload_hash، state، attempts | dedup key وفهرس pending | طباعة موثوقة وإعادة الطباعة |
| compat.zatca.submission | move/order، document_hash، chain_index، state، response، attempts | hash وchain index فريدان | تتبع الإرسال والفشل دون كسر السلسلة |
| compat.audit.event | actor، device، action، target، before، after، occurred_at | فهارس actor/target/time | تجاوز PIN، الإلغاء، الاسترداد، والتعديلات الحساسة |

### 7.2 ثوابت البيانات

1. يُنشأ UUID محلياً قبل أي اتصال، ولا يتغير بعد المزامنة.
2. تُحفظ الأموال بوحدة العملة ودقتها؛ لا تستخدم أعداد floating point في الحساب.
3. ترتيب الضرائب والخصومات والتقريب عقد ثابت تقيسه fixtures مشتركة.
4. الإيصال المدفوع غير قابل للتعديل؛ التصحيح يكون Refund أو Cancel وفق الصلاحية والحالة.
5. حركة المخزون الناتجة من بيع Offline delta غير قابلة للتكرار، وليست كتابة قيمة كمية مطلقة.
6. لكل aggregate revision تصاعدي؛ كل تحديث مشروط بالنسخة المتوقعة.
7. الحذف ينتج tombstone ويرفع revision بدلاً من حذف أثر المزامنة فوراً.
8. إقرار المزامنة يكون لكل عملية؛ نجاح دفعة جزئية لا يحذف العمليات غير المقبولة.
9. event outbox وسجل المجال يكتبان في معاملة PostgreSQL واحدة.
10. مفاتيح الجهاز والاقتران والرموز لا تحفظ كنص مكشوف.
11. مستند ZATCA الموقّع وhash الخاص به غير قابلين لإعادة التوليد بعد قبوله.
12. كل تحويل بين المورد الخارجي ونموذج Odoo له round-trip test يمنع فقد الحقول.

## 8. آلات الحالة

### 8.1 التذكرة والإيصال

| الحالة | الحدث المسموح | الحالة التالية | شرط الحماية |
|---|---|---|---|
| Draft Local | إضافة أو تعديل أو تعليق | Draft Local | معاملة محلية ناجحة |
| Draft Local | حفظ كتذكرة مفتوحة | Open | اسم صالح وrevision جديد |
| Open | تعديل من جهاز | Open | expected revision يطابق أو تُحل العملية |
| Open | بدء الدفع | Payment Pending | قفل مؤقت يمنع دفعين |
| Payment Pending | نجاح نقدي أو طرفية | Paid Local | مجموع الدفعات يساوي المستحق بعد التقريب |
| Payment Pending | رفض أو إلغاء | Open | لا أثر مالي معلق |
| Paid Local | إرسال | Syncing | idempotency key ثابت |
| Syncing | إقرار | Synced | receipt UUID نفسه مع server revision |
| Syncing | خطأ قابل للإعادة | Paid Local | لا إنشاء إيصال بديل |
| Synced | استرداد مصرح | Refunded Partially أو Refunded | مستند استرداد مستقل |
| Open | حذف مصرح | Voided | tombstone وaudit event |

### 8.2 عملية المزامنة

| الحالة | الإجراء | الانتقال |
|---|---|---|
| New | اختيار العملية حسب التبعية والتسلسل | Sending |
| Sending | نجاح مع إقرار مطابق | Acknowledged |
| Sending | timeout أو خطأ مؤقت | Retry Scheduled |
| Sending | conflict قابل للحل | Conflict Resolution |
| Sending | خطأ عقد دائم | Blocked |
| Retry Scheduled | بلوغ موعد backoff أو Manual Sync | Sending |
| Conflict Resolution | تطبيق السياسة أو تدخل المستخدم | New أو Blocked |
| Acknowledged | تنظيف آمن بعد retention | Archived |

### 8.3 الدفع

| الحالة | الأحداث | قاعدة الخروج |
|---|---|---|
| Created | اختيار مزود وطرفية | يثبت المبلغ والعملة والمرجع المحلي |
| Presented | بدء SDK أو إرسال الطرفية | لا يسمح بمحاولة متوازية لنفس المبلغ |
| Processing | approve، decline، cancel، timeout | timeout لا يعني decline |
| Unknown | check status ثم reconciliation | يمنع إعادة التحصيل قبل معرفة النتيجة |
| Approved | capture/complete | يسجل الدفع مرة واحدة |
| Declined | retry جديد بمعرف محاولة جديد | لا يسجل دفعاً |
| Cancelled | العودة لشاشة الدفع | يثبت سبب الإلغاء |
| Refunded | تأكيد المزود وإيصال الاسترداد | يرتبط بالمعاملة الأصلية |

### 8.4 ZATCA

| الحالة | الانتقال | القاعدة |
|---|---|---|
| Local Final | Signed | بيانات الإيصال نهائية |
| Signed | Queued | hash وQR وchain index محفوظة |
| Queued | Submitted | idempotency ثابت |
| Submitted | Accepted أو Warning أو Rejected أو Retry | حفظ الاستجابة كاملة |
| Retry | Submitted | إعادة إرسال المستند نفسه، لا مستند جديد |
| Accepted | Closed | منع تعديل المستند أو hash |

## 9. عقد API والهوية وWebhooks

### 9.1 قواعد عقد الإصدار 1.0

| الجانب | القاعدة |
|---|---|
| المسار | جميع الموارد العامة تحت /v1.0 |
| الوصف | OpenAPI 3.0 هو المصدر القابل للتنفيذ للعقد |
| الهوية | PAT وOAuth 2.0/OIDC مع Authorization Code، refresh، revoke، UserInfo، وJWKS |
| التوقيع | JWT بمفاتيح غير متماثلة وتدوير موثق |
| الصلاحيات | READ وWRITE على مستوى المورد، مع تحقق التاجر والمتجر |
| المعرف | UUID التوافقي فقط؛ لا يظهر record_id الداخلي |
| الوقت | UTC في النقل، مع timezone المتجر في العرض والتقارير |
| الصفحة | cursor مع الحدين 50 افتراضياً و250 أقصى |
| الحذف | soft delete وtombstone وفق المورد |
| الأخطاء | envelope ثابت يحوي code وmessage وdetails وrequest_id |
| تحديد المعدل | 300 طلب في 300 ثانية وفق العقد المرجعي |
| التكرار | Idempotency-Key إلزامي لكل أمر قابل لتكرار الأثر |
| الصور | endpoint صورة PNG وفق contract وcontent type واختبار bytes |
| التوافق | لا تُغيّر حقول الإصدار 1.0 أو دلالاته دون إصدار جديد |

### 9.2 ترتيب بناء API

1. تثبيت schemas المشتركة: UUID، timestamps، money، pagination، errors.
2. بناء merchant، stores، employees، payment types والبيانات المرجعية.
3. بناء categories، taxes، discounts، modifiers.
4. بناء items، variants، images، والمخزون.
5. بناء customers والولاء.
6. بناء receipts، payments، refunds، وshifts.
7. بناء webhooks.
8. تشغيل اختبارات جميع المسارات الـ34 والعمليات الـ57.
9. تجميد الإصدار 1.0 ونشر حزمة SDK داخلية مولدة للاختبارات والعملاء.

### 9.3 مسار Webhook

1. تكتب معاملة المجال حدثاً معيارياً في event outbox.
2. يقرأ العامل الأحداث غير المنشورة بترتيب sequence.
3. يحوّلها إلى أحد الأنواع الخمسة المطلوبة.
4. يجمع حتى 100 حدث في delivery batch.
5. يضيف API version header ويحسب HMAC-SHA1 عندما يقتضيه عقد OAuth.
6. يرسل HTTPS POST ويحفظ status وheaders وlatency وresponse excerpt المنقح.
7. يعتبر أي 2xx نجاحاً ويثبت الإقرار.
8. يصنف timeout و5xx و429 أخطاء قابلة للإعادة.
9. يطبق backoff حتى 200 محاولة ضمن النافذة المرجعية.
10. ينقل الاشتراك إلى DISABLED عند استنفاد المحاولات ويرسل الإشعار.
11. يمنع العاملان من إرسال delivery نفسه بقفل صف أو lease.
12. تثبت اختبارات fault injection التوقيع والترتيب والتجميع والتعطيل.

## 10. محرك Offline والمزامنة

### 10.1 خوارزمية الدفع المحلي والمزامنة

1. يبدأ العميل معاملة SQLite.
2. يطبق أمر المجال محلياً ويولد UUID وrevision.
3. يضيف Outbox operation تحمل idempotency key والتبعيات وhash.
4. ينهي المعاملة؛ عند الفشل لا يظهر التغيير ولا توجد عملية يتيمة.
5. يختار عامل المزامنة العمليات الجاهزة مع احترام ترتيب الوردية والتذكرة والإيصال.
6. يرسل دفعة محدودة مع device identity وآخر cursor معروف.
7. يتحقق الخادم من OAuth والجهاز والمتجر وschema وidempotency.
8. إذا سبق تنفيذ المفتاح يعيد النتيجة الأصلية ولا يعيد الأثر.
9. إذا كان جديداً يطبق الأمر ويكتب event outbox في معاملة واحدة.
10. يعيد الخادم إقراراً منفصلاً لكل عملية مع UUID وrevision أو خطأ مصنف.
11. يعلّم العميل العمليات المقبولة فقط ويحتفظ بالبقية.
12. يسحب العميل deltas بعد cursor الحالي، بما فيها tombstones.
13. يطبق الدفعة الواردة في معاملة محلية واحدة ثم يحرك cursor.
14. يعيد تشغيل العملية بعد الانقطاع من آخر إقرار، لا من بداية البيع.
15. تعرض الواجهة Unsynced count والحالة وآخر نجاح وManual Sync.

### 10.2 سياسات التعارض

| المورد | السياسة |
|---|---|
| الإيصال المدفوع | immutable؛ التكرار يعيد المورد نفسه، والاختلاف تحت UUID نفسه خطأ دائم |
| دفعة الدفع | idempotency حسب transaction/provider؛ الحالة Unknown تُصالح قبل إعادة المحاولة |
| التذكرة المفتوحة | optimistic revision؛ العمليات على أسطر مختلفة تدمج، والحذف يغلب تحديث السطر نفسه، وتعارض الحقل نفسه يعرض قراراً محدداً |
| الوردية | أحداث نقدية غير قابلة للتعديل؛ الإغلاق مشروط بآخر revision وبعدم وجود دفع محلي غير محسوب |
| المخزون | الخادم مرجع الكمية؛ البيع Offline يرسل delta ثابتاً، ولا يرسل رصيداً مطلقاً |
| الكتالوج | الخادم مرجع النسخة؛ لا يسمح للـPOS بتعديل الكتالوج Offline |
| العميل والولاء | القيود Offline تطبق قبل الأمر؛ النقاط تُحتسب مركزياً ثم تُصالح |
| KDS | station sequence؛ الحدث المكرر يعاد إقراره، والفجوة في التسلسل تطلب replay |
| CDS | snapshot كامل عند الاقتران ثم deltas؛ عند فقد sequence يطلب snapshot جديداً |
| الحذف | tombstone ذو revision أعلى يمنع resurrection |

### 10.3 مصفوفة السلوك Offline

| الوظيفة | Offline | عند عودة الاتصال |
|---|---|---|
| فتح/متابعة وردية | متاح وفق القاعدة المرجعية | مزامنة أحداث البداية والحركات والإغلاق بالترتيب |
| بيع نقدي | متاح | استيعاب إيصال واحد وتحديث المخزون |
| حفظ وتعديل تذكرة | متاح محلياً وداخل LAN | مصالحة revisions بين الأجهزة والخادم |
| طباعة إيصال محلي | متاح إذا كان الجهاز متصلاً | رفع حالة print job عند الحاجة |
| KDS/CDS داخل LAN | متاح | replay إلى الخادم دون تكرار |
| دفع متكامل | مقيد حسب المزود؛ الحارس يعرض الرسالة المطابقة | لا يعاد التحصيل تلقائياً |
| Refund | مقيد وفق المصفوفة المرجعية | يفتح بعد تحقق السجل والصلاحية |
| إنشاء/تعديل عميل | مقيد وفق المصفوفة المرجعية | تحديث القوائم والرسالة |
| بحث ومخزون حي | يعرض cache مع دلالة عدم الحداثة أو يُمنع وفق المرجع | refresh تفاضلي |
| إيصال بالبريد | يُصفّ محلياً إذا كان ذلك مسموحاً | إرسال واحد مع حالة نجاح أو فشل |
| Sign out | ممنوع عند وجود عمليات Unsynced | يسمح بعد الإقرار أو مسار استرداد إداري |

## 11. قناة LAN لـKDS وCDS

### 11.1 الاكتشاف والاقتران

1. ينشر التطبيق المستقبل خدمة محلية versioned عبر mDNS/Bonjour.
2. يحصر POS النتائج في الشبكة والمتجر ونوع التطبيق.
3. يدعم الإدخال اليدوي للعنوان عند فشل الاكتشاف.
4. يعرض المستقبل طلب Pair واضحاً؛ لا يقبل بصمت.
5. يتبادل الطرفان مفتاح جلسة أو شهادات جهاز قصيرة السلسلة عبر رمز مرئي.
6. يحفظ المفتاح في Keystore أو Keychain.
7. ينشئ POS قائمة الأجهزة المقترنة وحالتها ووقت آخر اتصال.
8. يدعم Unpair من الطرفين ويبطل المفتاح فوراً.
9. يرفض أي رسالة لا تطابق store وdevice وprotocol version.

### 11.2 بروتوكول التسليم

| الرسالة | الاستخدام | شرط الموثوقية |
|---|---|---|
| Snapshot | أول اقتران أو recovery | يحمل الحالة الكاملة وآخر sequence |
| Ticket Created | إنشاء بطاقة KDS | sequence فريد وإقرار |
| Ticket Updated | إضافات، تعليقات، نقل، void | delta مبني على revision |
| Item Done | إنهاء عنصر | idempotent |
| Order Done | إنهاء طلب | قابل للاستدعاء وفق نافذة المرجع |
| Recall | إعادة البطاقة | event جديد، لا عكس صامت |
| Display State | تحديث CDS | يحوي subtotal، discounts، taxes، customer، payment |
| Heartbeat | صحة الاتصال | لا يغير المجال |
| Replay Request | طلب فجوة تسلسل | من sequence معلوم |
| Unpair | إبطال العلاقة | موقّع بالمفتاح الحالي |

## 12. مسارات العمل

| المسار | الملكية الرئيسية | المخرجات |
|---|---|---|
| WS-A النواة والبيانات | Odoo/Python/PostgreSQL | addons، migrations، resource mapping، domain rules |
| WS-B العقود والهوية | API/Security | OpenAPI، OAuth، scopes، errors، rate limits |
| WS-C Offline والمزامنة | Backend + Android + Apple | local DB، outbox/inbox، cursors، conflict engine |
| WS-D POS الأصلي | Android وApple | تدفقات البيع والتذاكر والدفع والوردية والإيصالات |
| WS-E KDS وCDS | Android وApple + LAN | تطبيقات مستقلة، pairing، routing، replay |
| WS-F Back Office والتقارير | Odoo Web + Data | shell، catalog، inventory، CRM، reports |
| WS-G Dashboard | Android وApple + Reports | KPI، filters، receipts، stock alerts |
| WS-H الأجهزة والدفع | Integration engineers | printer/hardware ports، provider adapters، lab matrix |
| WS-I ZATCA وRTL | Odoo EDI + Client UI | onboarding، QR، queue، Arabic، RTL، receipts |
| WS-J الجودة والتشغيل | QA automation + DevOps/SRE | conformance suites، CI/CD، telemetry، release evidence |

## 13. تسلسل التنفيذ وبوابات الاعتماد

| المرحلة | تبدأ بعد | يمكن تنفيذها بالتوازي مع | بوابة الخروج |
|---|---|---|---|
| P00 مرجع المطابقة | لا شيء | لا شيء | G00 |
| P01 أساس المستودع والمنصات | P00 | إعداد مختبر العتاد | G01 |
| P02 الهوية المعيارية ونموذج البيانات | P01 | بدايات Design tokens | G02 |
| P03 API وOAuth وWebhooks | P02 | واجهات Back Office الأولية | G03 |
| P04 Offline والمزامنة وLAN core | P02 وP03 الأساسية | Webhooks workers | G04 |
| P05 مجال POS وBack Office التشغيلي | P02 وP04 | تقارير البيانات | G05 |
| P06 POS على Android | P04 وP05 | P07 | G06 |
| P07 POS على Apple | P04 وP05 | P06 | G07 |
| P08 KDS وCDS | P04 وP05 | P09 | G08 |
| P09 المخزون والتقارير وDashboard | P02 وP03؛ وحزم العملاء من P06/P07 | P08 | G09 |
| P10 الطباعة والعتاد | P06 وP07؛ وKDS الأساسي | P09 | G10 |
| P11 الدفع المتكامل | P05 وP06 وP07 وطبقة العتاد | موصلات الطباعة المتبقية | G11 |
| P12 ZATCA | P03 وP04 وP05 | P10 وP11 | G12 |
| P13 RTL والمطابقة البصرية النهائية | شاشات P06 إلى P12 | مستمر منذ P01 | G13 |
| P14 الصلابة والأمن والأداء | P03 إلى P13 | لا شيء عند بوابة القطع | G14 |
| P15 شهادة المطابقة والإطلاق | P14 | لا شيء | G15 |

## 14. الخطة التفصيلية خطوة بخطوة

### P00 — تثبيت مرجع المطابقة

**الهدف:** تحويل نتائج التحليل إلى مواصفة قبول قابلة لإعادة التشغيل.

1. تثبيت مصفوفة نسخ Android وiOS/iPadOS وأحجام الهاتف واللوحي والاتجاهات.
2. تثبيت الأدوار والصلاحيات والمتاجر والعملات والضرائب واللغتين العربية والإنجليزية.
3. إنشاء فهرس واحد لكل شاشة وحالة ورسالة وخطأ وربطه بـGap ID.
4. بناء dataset مرجعي يشمل عناصر بسيطة ومتغيرات ومركبة وموزونة وضرائب وخصومات ونقاط.
5. بناء سيناريوهات بيع واسترداد وورديات وتذاكر وجهازين وتعارضات.
6. حفظ القيم المرجعية للتقارير والتقريب والمخزون.
7. تثبيت API fixtures والمسارات الـ34 والعمليات الـ57 وأنواع Webhook الخمسة.
8. تثبيت مصفوفة الدفع والطابعات والعتاد والبلدان والمنصات.
9. إنشاء هيكل tests/conformance بحيث يملك كل Gap ID ملف متطلبات وfixtures وأدلة.
10. تصنيف الأدلة إلى آلية، بصرية، عتاد فعلي، وحالة خارجية.

**المخرجات:** baseline manifest، golden dataset، screen-state catalog، contract fixtures، hardware matrix.

**G00:** لا يوجد Gap ID بلا حالة قبول قابلة للقياس، ولا نتيجة مالية أو تقرير بلا قيمة مرجعية.

### P01 — تأسيس المستودع والبناء والبيئات

**الهدف:** جعل كل طبقة قابلة للبناء والاختبار من commit واحد.

1. تثبيت Odoo 19.0 على commit وتسجيل checksum.
2. إنشاء addons والclients والcontracts والtests وفق الهيكل المحدد.
3. ضبط Python lint/type checks واختبارات Odoo وmigrations.
4. ضبط Gradle وبناء Android للوحدات والتطبيقات الأربعة.
5. ضبط Swift packages وXcode projects وبناء تطبيقات Apple الأربعة على runners macOS.
6. إضافة lint لعقد OpenAPI وevent schemas وLAN schemas.
7. إنشاء بيئة محلية وCI مؤقتة وIntegration وHardware Lab وStaging.
8. إنشاء سجل قرارات architecture decisions وسجل تغييرات العقود.
9. إضافة إدارة الأسرار والتوقيع وSBOM وفحص التبعيات.
10. إضافة request correlation وسجلات منظمة ومقاييس أولية.

**المخرجات:** builds مكررة، صور خادم مثبتة، تطبيقات shell، CI pipelines، environment manifests.

**G01:** بناء نظيف للخادم وكل تطبيق، تشغيل smoke test، وإنشاء بيئة Integration آلياً دون خطوة يدوية خفية.

### P02 — نموذج الموارد والمعرفات وقواعد البيانات

**الهدف:** تثبيت اللغة المعيارية بين Odoo والعقود والعملاء قبل بناء الواجهات.

1. إنشاء قاموس موارد يربط Merchant وStore وEmployee وDevice وItem وVariant وReceipt وShift بنماذج Odoo.
2. تنفيذ compat.resource.identity وUUID mapping وrevision وtombstone.
3. تنفيذ هوية الجهاز والمتجر وعلاقة المستخدم والصلاحيات الأساسية.
4. توسيع product.template وproduct.product لعقد الخيارات الثلاثة والمتاجر والمعدلات والمخزون الأمثل.
5. تثبيت نماذج modifiers وdining options وdiscount/tax projections.
6. إضافة ticket metadata وshift projections وreceipt/payment projections.
7. إنشاء models الخاصة بـKDS وCDS وWebhooks والدفع والطباعة وZATCA.
8. كتابة migrations قابلة للتكرار وقيود uniqueness والفهارس.
9. إنشاء محولات ثنائية الاتجاه بين JSON resource ونماذج Odoo.
10. تشغيل round-trip وproperty tests للمال والوقت والضرائب والخصومات.
11. تحميل golden dataset وإثبات أن Odoo ينتج القيم المرجعية.

**المخرجات:** schema، migrations، resource mappers، seed data، data dictionary.

**G02:** ثبات UUID عبر create/update/delete/upgrade، نجاح round-trip دون فقد، وتطابق الحسابات المرجعية.

### P03 — API والهوية وWebhooks

**الهدف:** تقديم حد خارجي ثابت لا يعتمد على تفاصيل Odoo.

1. كتابة OpenAPI 3.0 الكامل للإصدار 1.0 قبل controllers.
2. تنفيذ PAT ثم OAuth Authorization Code وrefresh وrevoke وUserInfo وJWKS.
3. تطبيق scopes على مستوى المورد وREAD/WRITE والمتجر والتاجر.
4. تنفيذ request ID وerror envelope وUTC وcursor pagination.
5. تنفيذ rate limit واختبارات نافذة 300/300.
6. بناء الموارد على الدفعات المحددة في القسم 9.2.
7. تنفيذ endpoint الصور واختبار نوع ومحتوى PNG.
8. إنشاء command inbox لدعم Idempotency-Key.
9. إنشاء event outbox واشتراكات Webhooks.
10. تنفيذ العامل والتجميع والتوقيع وإعادة المحاولة والتعطيل.
11. توليد contract clients للاختبارات فقط، ومنع تعديل العقد من كود العميل.
12. تشغيل اختبارات المسارات الـ34 والعمليات الـ57 وحالات الخطأ والصلاحيات.

**المخرجات:** OpenAPI frozen، OAuth provider، REST controllers، webhook service، contract report.

**G03:** نجاح عقد API كاملاً، عدم ظهور معرف Odoo، وفشل كل محاولة خارج scope بالرمز المرجعي الصحيح.

### P04 — Local-first والمزامنة ولب LAN

**الهدف:** إثبات عدم فقد أو تكرار أي عملية تحت الانقطاع.

1. تصميم schema محلي موحد دلالياً على Android وApple.
2. تنفيذ migrations وencryption وtransaction boundaries.
3. تنفيذ local UUID وOutbox وdependency graph وmanual sync.
4. تنفيذ server command inbox وإقرار السجل الجزئي.
5. تنفيذ delta pull وcursor وtombstone وretention.
6. تنفيذ سياسات تعارض التذاكر والورديات والمخزون.
7. تنفيذ WorkManager وBackgroundTasks ودورة lifecycle.
8. تنفيذ منع Sign out وحماية kill/restart وstorage failure recovery.
9. تنفيذ Online/Offline guards والرسائل لكل وظيفة.
10. بناء LAN transport: discovery، manual IP، pairing، TLS، sequence، ack، replay.
11. إضافة Network fault proxy لاختبارات timeout وduplicate وreorder وpacket loss.
12. تشغيل اختبارات انقطاع عند كل نقطة قبل وبعد commit والإرسال والإقرار.

**المخرجات:** local databases، sync engine، LAN core، conflict resolver، fault-injection suite.

**G04:** صفر فقد وصفر تكرار وصفر resurrection في جميع سيناريوهات kill/retry/device conflict، مع بقاء البيانات بعد migration.

### P05 — مجال POS وBack Office التشغيلي

**الهدف:** إكمال منطق البيع المركزي والتدفقات قبل الإنهاء البصري.

1. تنفيذ device login وPIN والقفل والتبديل والتجاوز مع audit.
2. تنفيذ سلة البيع: الكمية والوزن والسعر المتغير والملاحظات وmodifiers وdining options.
3. تنفيذ الضرائب والخصومات على السطر والتذكرة والتقريب.
4. تنفيذ customer selection والنقاط والاستبدال وسجل الشراء.
5. تنفيذ open tickets والأسماء المسبقة والتعليقات والبحث والفرز والrevision.
6. تنفيذ split وmerge وmove وpartial quantities وprint bill.
7. تنفيذ cash charge وsplit tender وtips وcash rounding.
8. تنفيذ receipts وrefund وcancel والصلاحيات وتحديث المخزون.
9. تنفيذ shifts وopening cash وPay In/Out وexpected/actual والإغلاق.
10. تنفيذ Time Clock وTimecards وdecimal hours وسجل التعديل.
11. إنشاء Back Office views الأساسية لإعداد هذه الموارد وإدارتها.
12. تشغيل golden tests لجميع الحسابات والحالات والرسائل.

**المخرجات:** compat_pos وcompat_catalog الأساسية، POS command handlers، audit trail، Back Office operational views.

**G05:** ينجح مسار بيع نقدي كامل وOffline ثم Sync، وتطابق التذكرة والإيصال والمخزون والوردية والتقرير المالي المرجعي.

### P06 — تطبيق POS الأصلي على Android

**الهدف:** إغلاق تدفق POS على Android هاتفاً ولوحياً.

1. تنفيذ onboarding واختيار الجهاز والمتجر ودخول الموظف.
2. تنفيذ شاشة الهاتف مع Favorites وتدفق البحث والتصنيفات.
3. تنفيذ تخطيط اللوحي ثنائي اللوحة وCustom Pages/Grid والتحرير والحفظ.
4. تنفيذ حوارات العنصر والعميل والخصم والضريبة وmodifiers والملاحظات.
5. تنفيذ open tickets وsplit/merge/move وreceipts وrefunds.
6. تنفيذ Charge وsplit payment وcash/tip/rounding والنجاح.
7. تنفيذ shift وPay In/Out والإغلاق وsync status.
8. ربط Room وWorkManager ومحرك المزامنة.
9. تنفيذ phone/tablet وportrait/landscape وdark mode وRTL hooks.
10. إضافة semantics واختبارات Compose/Espresso وgolden screenshots.
11. ربط hardware/payment ports بمهايئات وهمية قابلة للاختبار قبل SDKs.

**المخرجات:** Android POS قابل للتثبيت، اختبارات UI، قاعدة محلية، وsync telemetry.

**G06:** نجاح جميع تدفقات POS المرجعية على أجهزة Android المحددة Online وOffline وبعد kill/restart.

### P07 — تطبيق POS الأصلي على iOS وiPadOS

**الهدف:** إغلاق تدفق POS على iPhone وiPad مع سلوك المنصة.

1. تنفيذ onboarding والجهاز والمتجر ودخول الموظف.
2. تنفيذ تخطيط iPhone وFavorites.
3. تنفيذ تخطيط iPad ثنائي اللوحة وCustom Pages/Grid والإيماءات.
4. تنفيذ حوارات العنصر والعميل والخصم والضريبة وmodifiers.
5. تنفيذ tickets وsplit/merge/move وreceipts وrefunds.
6. تنفيذ Charge وsplit payment وcash/tip/rounding والنجاح.
7. تنفيذ shift وPay In/Out والإغلاق وsync status.
8. ربط SQLite وBackgroundTasks وKeychain ودورة foreground/background.
9. تنفيذ portrait/landscape وdark mode وRTL hooks ودعم safe areas.
10. إضافة XCUITest واختبارات snapshots والحالة بعد memory pressure/relaunch.
11. ربط hardware/payment ports بمهايئات وهمية قبل SDKs.

**المخرجات:** Apple POS قابل للتثبيت، اختبارات UI، local-first storage، وsync telemetry.

**G07:** نجاح جميع تدفقات POS المرجعية على iPhone وiPad المحددين Online وOffline وبعد termination/relaunch.

### P08 — KDS وCDS المستقلان

**الهدف:** تشغيل المطبخ وشاشة العميل داخل المتجر حتى مع انقطاع الإنترنت.

1. بناء تطبيق KDS مستقل على Android وiPadOS.
2. تنفيذ stations وcategory routing وticket cards والوقت والخادم والتعليقات.
3. تنفيذ green/yellow/red عند العتبات المرجعية وdark mode والصوت.
4. تنفيذ item done وorder done وvoid وrecall وclear.
5. حفظ KDS state في SQLite وتنفيذ replay بعد الانقطاع.
6. بناء تطبيق CDS مستقل على Android وiOS/iPadOS.
7. تنفيذ discovery وmanual IP وPair/Unpair وعدة شاشات لكل POS وفق المرجع.
8. تنفيذ empty state وticket lines وmodifiers وdiscounts وtaxes والعميل والنقاط.
9. تنفيذ payment in progress وpaid/change وdisconnect/reconnect.
10. اختبار POS→KDS وPOS→CDS مع قطع الإنترنت وإعادة ترتيب رزم LAN.
11. اختبار عدة POS وعدة شاشات ومنع عبور بيانات متجر إلى آخر.

**المخرجات:** أربعة تطبيقات مستقلة بحسب المنصات المستهدفة، LAN protocol، station configuration، replay tests.

**G08:** لا تضيع بطاقة أو تحديث أو حالة دفع في اختبارات LAN، وتطابق كل حالات KDS/CDS البصرية والوظيفية.

### P09 — المخزون وBack Office والتقارير وDashboard

**الهدف:** إغلاق وظائف الإدارة والتحليل وسلسلة المخزون.

1. بناء Back Office shell والقائمة المختصرة وحالات Save/Cancel/Delete والأخطاء.
2. إكمال Item/Variant وStore price/availability وmodifiers وlow/optimal stock.
3. تنفيذ import/export round-trip مع تقرير أخطاء صفوف.
4. تنفيذ Suppliers وPurchase Orders وAutofill والاستلام الجزئي والتكاليف الإضافية.
5. تنفيذ Transfer Orders وStock Adjustments وHistory وValuation.
6. تنفيذ Inventory Count الكامل والجزئي وExpected/Actual وshortage/surplus.
7. تنفيذ Production وDisassembly وتكلفة المكونات.
8. تنفيذ label templates والأحجام والباركود والمعاينة.
9. تثبيت تعريفات Sales Summary وبقية التقارير والفلاتر والتصدير.
10. بناء report projections محسنة ومثبتة بـgolden dataset.
11. بناء Dashboard مستقل على Android وiOS.
12. تنفيذ Receipts وNet Sales وAverage Ticket والمقارنة وdrill-down وItems وstock alerts.
13. اختبار صلاحيات المدير وتعدد المتاجر والفترات الزمنية.

**المخرجات:** Back Office مطابق، inventory workflows، report views، Android/iOS Dashboard.

**G09:** تطابق أرقام كل تقرير ووثيقة مخزون على dataset المرجعي، وتنجح تدفقات Dashboard على المنصتين.

### P10 — الطباعة والأجهزة

**الهدف:** تحويل كل تكامل عتاد إلى capability معلنة وقابلة للاختبار.

1. تعريف Printer Port وScanner Port وScale Port وDrawer Port وDisplay Port.
2. إنشاء capability registry حسب platform/model/interface/firmware.
3. تنفيذ Android TCP 9100 وBluetooth RFCOMM وUSB Host وESC/POS.
4. تنفيذ SDKs للطابعات المدمجة Sunmi وiMin الداخلة في النطاق.
5. تنفيذ Apple Ethernet وBluetooth وExternalAccessory وStarPRNT/Epson adapters.
6. تنفيذ print profiles وtest print وstatus وretry وdedup.
7. تنفيذ receipt وQR وcut وdrawer وbuzzer.
8. تنفيذ kitchen category routing وadditions وvoids وsingle item وreprint mark.
9. تنفيذ HID scanner والكاميرا وembedded-weight barcode والميزان.
10. معالجة permissions وdisconnect/reconnect وpaper out والغطاء والطابعة غير المتاحة.
11. تشغيل Hardware-in-the-Loop على كل خلية في مصفوفة العتاد.

**المخرجات:** device ports، adapters، print jobs، capability matrix، تقارير مختبر العتاد.

**G10:** نجاح Test Print والإيصال والمطبخ وQR والحالة لكل جهاز وواجهة مستهدفين، بلا طباعة مكررة عند retry.

### P11 — بوابات الدفع

**الهدف:** تغطية مصفوفة مزودي Loyverse بآلة حالة موحدة ومن دون حالات مالية مجهولة.

1. تثبيت Payment Port وPayment Transaction schema.
2. تنفيذ initiate وcancel وcheck status وrefund وreconciliation.
3. تنفيذ قفل محاولة الدفع وidempotency وقاعدة Unknown.
4. بناء محاكي مزود يحقن approve وdecline وtimeout وlate response وduplicate callback.
5. دمج كل مزود في adapter مستقل على الخادم والمنصة التي يتطلبها.
6. دمج pairing الطرفية وBluetooth/network readers وفق مصفوفة المزود.
7. دمج Tap to Pay on iPhone حيث يدخل في المصفوفة.
8. تطبيق قيود Online/Offline والبلد والمنصة قبل عرض وسيلة الدفع.
9. تنفيذ sale وrefund وcancel وreversal وreconciliation لكل مزود.
10. تشغيل اختبارات قطع الشبكة عند كل انتقال في آلة الحالة.
11. تشغيل اختبارات الطرفيات الفعلية واعتماد كل خلية provider×country×platform×terminal.

**المخرجات:** payment core، provider adapters، terminal pairing، reconciliation jobs، certification evidence.

**G11:** لا بيع مكرر، لا تحصيل مكرر، ولا حالة Unknown غير قابلة للمصالحة في جميع خلايا المصفوفة المستهدفة.

### P12 — ZATCA

**الهدف:** إغلاق الفاتورة المبسطة لـPOS وحالات الإرسال والفشل والاسترداد.

1. تثبيت واعتماد l10n_sa_pos وl10n_sa_edi_pos كأساس.
2. تنفيذ onboarding وCSID وإدارة الشهادات والصلاحيات.
3. تثبيت تحويل الإيصال والاسترداد إلى UBL 2.1.
4. اختبار QR والتوقيع وhash chain وinvoice counter.
5. إضافة compat.zatca.submission وsubmission outbox.
6. عرض success وwarning وerror وpending في POS وBack Office.
7. منع إنشاء رقمين أو مستندين عند timeout.
8. تنفيذ retry للمستند نفسه وإظهار سبب الرفض والإجراء المسموح.
9. ربط إغلاق الإيصال بالسياسة المطلوبة لكل حالة.
10. اختبار البيع والاسترداد والانقطاع قبل الإرسال وبعده وبعد قبول بعيد.
11. تشغيل عينات conformance وبيئة ZATCA الاختبارية وحفظ الأدلة.

**المخرجات:** ZATCA workflow، submission queue، UI states، XML/QR fixtures، acceptance report.

**G12:** قبول عينات البيع والاسترداد، سلامة hash chain، وعدم تكرار المستند تحت الانقطاع أو retry.

### P13 — RTL والمطابقة البصرية والسلوكية

**الهدف:** إغلاق الفروق الدقيقة بعد استقرار الوظائف.

1. تثبيت design tokens للألوان والخطوط والمسافات والحواف والظلال والحركة.
2. ربط tokens بـOwl/SCSS وCompose وSwiftUI/UIKit.
3. مطابقة كل شاشة وحوار وحالة فارغة وتحميل وخطأ ونجاح.
4. مطابقة phone/tablet وportrait/landscape وفروق Android/Apple.
5. تنفيذ RTL باستخدام logical properties واتجاهات المنصة.
6. اختبار مزج العربية واللاتينية والأرقام والعملات والنسب والباركود.
7. مطابقة dark theme في الأسطح التي تدعمه.
8. مطابقة gestures وlong-press وdrag وkeyboard/focus ودورة القفل.
9. مطابقة الإيصالات العربية نصياً وraster حسب قدرة الطابعة.
10. تشغيل visual diff لكل screen-state ID على الأجهزة المرجعية.
11. إصلاح كل pixel drift خارج الهامش الصفري المتفق عليه.

**المخرجات:** token packages، RTL suites، visual baselines، interaction reports.

**G13:** نجاح جميع اللقطات والحركات والحالات واتجاه RTL على كل منصة وحجم داخل النطاق.

### P14 — الصلابة والأمن والأداء والتشغيل

**الهدف:** إثبات قدرة النظام على العمل المستمر والترقية الآمنة.

1. إكمال threat model للخادم والعملاء وLAN والدفع والعتاد.
2. اختبار revocation وre-pairing وtoken rotation وkey rotation.
3. اختبار TLS وMITM والمفاتيح المخزنة وredaction ومنع الأسرار في logs.
4. تشغيل static analysis وdependency scanning وSBOM ومراجعة صلاحيات التطبيقات.
5. اختبار schema migrations من كل نسخة مدعومة مع بيانات Unsynced.
6. اختبار ترقية الخادم قبل العملاء والعملاء قبل الخادم ضمن نافذة التوافق.
7. تشغيل load tests على API وsync وWebhooks والتقارير.
8. قياس p50/p95/p99 ومقارنته بالمرجع على نفس الجهاز والبيانات والشبكة.
9. تنفيذ backup وrestore وpoint-in-time recovery واختبارها.
10. إنشاء dashboards وتنبيهات لـsync backlog وwebhook failure وpayment unknown وZATCA pending.
11. إنشاء runbooks للانقطاع والمصالحة والطابعة والطرفية والشهادة.
12. تشغيل chaos tests على workers وقاعدة البيانات والشبكة وإعادة التشغيل.

**المخرجات:** security report، performance report، migration matrix، recovery evidence، runbooks.

**G14:** لا ثغرة حرجة أو عالية مفتوحة، نجاح الاستعادة والترقية، وعدم فقد/تكرار البيانات تحت اختبارات الأعطال.

### P15 — شهادة المطابقة والإطلاق

**الهدف:** تحويل اكتمال التطوير إلى قرار إصدار قائم على أدلة.

1. تجميد المرشّح وإصدارات العقود وcommit نواة Odoo.
2. تشغيل مجموعة البنود الـ51 كاملة من بيئة نظيفة.
3. تشغيل المنصات والأجهزة والاتجاهات واللغات والأدوار والمتاجر.
4. تشغيل API operations الـ57 وWebhooks failure suite.
5. تشغيل Offline/kill/retry/conflict وLAN replay.
6. تشغيل مصفوفة الدفع والطباعة والعتاد الفعلية.
7. تشغيل ZATCA conformance والبيع والاسترداد.
8. مراجعة visual evidence وfinancial golden outputs.
9. التأكد من صفر استثناءات P0 وP1 وP2 وصفر اختبارات quarantined.
10. إنشاء release evidence index يربط كل Gap ID بنتيجة وartifact.
11. تنفيذ pilot مضبوط مع telemetry وخطة rollback.
12. إعادة الاختبارات بعد pilot ثم توسيع الإطلاق على دفعات.

**المخرجات:** parity certificate، signed artifacts، release notes، rollback package، evidence index.

**G15:** كل Gap ID مغلق بأدلة، وجميع بوابات G00 إلى G14 ناجحة على المرشّح نفسه.

## 15. مصفوفة تتبع الفجوات إلى التنفيذ

| Gap ID | مرحلة الإغلاق | الوحدة أو السطح | دليل القبول الرئيسي |
|---|---|---|---|
| POS-01 | P05 وP06 وP07 | compat_pos وPOS clients | مصفوفة PIN والقفل والتبديل والتجاوز |
| POS-02 | P06 وP07 وP13 | POS UI | visual matrix للهاتف واللوحي والاتجاه |
| POS-03 | P06 وP07 | POS layout | حفظ Favorites وCustom Grid والإيماءات |
| POS-04 | P05 وP06 وP07 | compat_catalog وcart UI | golden tax/discount/modifier calculations |
| POS-05 | P05 وP06 وP07 | loyalty/customer | رصيد واستبدال وسجل شراء مطابق |
| POS-06 | P04 وP05 وP06 وP07 | tickets وsync | جهازان، تعارض، بحث، واسم مشغول |
| POS-07 | P05 وP06 وP07 | restaurant flows | split/merge/move/partial/bill cases |
| POS-08 | P05 وP11 | charge/payment | state machine والتقريب والتعافي |
| POS-09 | P04 وP05 | receipts/refunds | visibility/refund/cancel/inventory/audit |
| POS-10 | P04 وP05 | shifts | opening/expected/actual/Pay In-Out Offline |
| APP-01 | P09 | Android وApple Dashboard | تثبيت مستقل ودخول وصلاحيات |
| APP-02 | P09 | compat_reports وDashboard | KPI والفلاتر والمقارنة وdrill-down |
| KDS-01 | P08 | Android/iPad KDS | تشغيل مستقل وعرض حي |
| KDS-02 | P08 وP13 | KDS state/UI | timers والألوان وdone/void/recall/dark |
| KDS-03 | P04 وP08 | LAN وKDS persistence | Offline LAN وreplay بلا فقد |
| CDS-01 | P04 وP08 | CDS pairing | discovery/manual IP/Pair/Unpair/multi-CDS |
| CDS-02 | P08 وP13 | CDS state/UI | empty/long/payment/disconnect/dark |
| BO-01 | P09 وP13 | compat_backoffice | navigation/forms/messages/visual cases |
| REP-01 | P09 | compat_reports | أرقام وفلاتر وتصدير على golden dataset |
| CAT-01 | P02 وP09 | compat_catalog | create/import/export round-trip |
| INV-01 | P09 | compat_inventory | PO states/autofill/partial receipt/cost |
| INV-02 | P09 | compat_inventory | transfer/adjust/history/valuation |
| INV-03 | P09 | compat_inventory | full/partial count ونتيجة الحركة |
| INV-04 | P09 | compat_inventory | production/disassembly/cost |
| INV-05 | P09 وP10 | labels/printing | dimensions/fields/barcode/quantity |
| EMP-01 | P05 | compat_pos وhr | rights/time clock/decimal hours/audit |
| CRM-01 | P05 وP09 | compat_catalog وBack Office | visits/spend/history/points/import |
| OFF-01 | P04 | Android/Apple local data | kill/restart/migration بلا فقد |
| OFF-02 | P04 | sync outbox/inbox | timeout/retry/partial ack بلا تكرار |
| OFF-03 | P04 | delta/conflict engine | concurrent update/delete بلا resurrection |
| OFF-04 | P04 وP06 وP07 | feature guards/UI | كل خلية Online/Offline ورسالتها |
| OFF-05 | P04 | lifecycle/recovery | منع خروج واسترداد storage/schema failure |
| DATA-01 | P02 | compat_core | UUID ثابت وعلاقات بلا internal IDs |
| API-01 | P03 | compat_api | 34 routes و57 operations contract suite |
| API-02 | P03 | compat_identity | authorization/refresh/revoke/scopes/JWKS |
| API-03 | P03 | compat_api | cursor/errors/delete/rate limits |
| WH-01 | P03 | compat_webhooks | CRUD subscription وأنواع الأحداث الخمسة |
| WH-02 | P03 وP14 | delivery worker | batch/sign/retry/disable/fault injection |
| PAY-01 | P11 | provider adapters | كل مزود وبلد ومنصة وطرفية مستهدفة |
| PAY-02 | P11 | payment core | transition fault tests وreconciliation |
| PAY-03 | P11 | native payment adapters | pairing/Tap to Pay/readers/offline matrix |
| PRN-01 | P10 | Android printers | TCP/Bluetooth/USB/embedded models |
| PRN-02 | P10 | Apple printers | Ethernet/Bluetooth/ExternalAccessory models |
| PRN-03 | P10 | kitchen printing | route/add/void/single/reprint/drawer |
| HW-01 | P10 | hardware ports | HID/camera/weight/scale/drawer/disconnect |
| SA-01 | P12 | compat_sa_pos | accepted sale/refund XML/QR/states |
| SA-02 | P12 وP14 | ZATCA outbox | disconnect/retry/no duplicate/hash safety |
| RTL-01 | P13 | جميع الواجهات والطباعة | Arabic bidi/currency/barcode visual suite |
| UI-01 | P00 وP13 | design systems | screen-state visual and motion diff |
| SEC-01 | P01 وP04 وP14 | الهوية والعملاء وLAN | secrets/revocation/MITM/permissions |
| QA-01 | P00 وP15 | tests/conformance | evidence index لكل البنود الـ51 |

## 16. استراتيجية الاختبار

### 16.1 طبقات الاختبار

| الطبقة | الأدوات والنطاق | ماذا تمنع |
|---|---|---|
| وحدات الخادم | Odoo unittest وPython tests | أخطاء قواعد المجال والتحويل |
| واجهة Odoo | HOOT وtours واختبارات XML/Owl | انحدار Back Office |
| العقود | OpenAPI schema وnegative tests وOAuth suite | تغير API أو الأخطاء أو الصلاحيات |
| قواعد المال | property tests وgolden fixtures | فروق التقريب والضرائب والخصومات |
| Android | JVM وRoom migration وCompose/Espresso | أخطاء lifecycle وUI وOffline |
| Apple | Swift tests وSQLite migration وXCUITest | أخطاء background/relaunch وUI |
| المزامنة | model-based وfault injection | فقد وتكرار وتعارض وresurrection |
| LAN | packet loss/reorder/duplicate/replay | فقد KDS/CDS أو عبور متجر |
| بصري | golden screenshots لكل screen-state | اختلاف القياس واللون وRTL |
| دفع | provider simulator ثم terminals فعلية | التحصيل المكرر والحالة المجهولة |
| عتاد | Hardware-in-the-Loop | اختلاف firmware/interface/status |
| ZATCA | fixtures وبيئة الاختبار | XML/QR/hash/submission errors |
| أداء | load وsoak وprofiling | backlog أو بطء أو تسرب ذاكرة |
| أمن | SAST/DAST/dependency/MITM/secret scans | تسريب أو تجاوز صلاحية |

### 16.2 أبعاد مصفوفة المطابقة

تُولد الحالات من حاصل ضرب الأبعاد ذات الصلة، لا من اختبار مسار سعيد واحد:

- المنصة: Android، iOS، iPadOS، Back Office web.
- الشكل: هاتف، لوحي، شاشة KDS، شاشة CDS.
- الاتجاه: عمودي وأفقي.
- اللغة: العربية RTL والإنجليزية LTR.
- السمة: فاتحة وداكنة حيث تدعمها الشاشة.
- الاتصال: Online، Offline، بطيء، timeout، packet loss، إعادة اتصال.
- الدور: كاشير، مدير، صلاحية محدودة، تجاوز PIN.
- البيانات: متجر واحد ومتاجر متعددة، عملات وضرائب وتقريبات مختلفة.
- الحالة: جديد، فارغ، ممتلئ، طويل، خطأ، retry، conflict، deleted.
- العتاد: كل موديل وواجهة وfirmware في المصفوفة.

### 16.3 بنية دليل القبول

لكل Gap ID:

    tests/conformance/GAP-ID/
      requirement.md
      cases.yaml
      fixtures/
      expected/
      automation/
      hardware-evidence/
      result.json

يحتوي result.json على commit، إصدار الخادم والتطبيق، الجهاز، نظام التشغيل، dataset hash، وقت التشغيل، النتيجة، وروابط artifacts. لا يعتمد الإغلاق على لقطة أو فيديو بلا ربط بالنسخة والبيانات.

## 17. CI/CD والإصدارات

### 17.1 خطوط البناء

1. **عند كل Pull Request:** lint، unit tests، schema checks، migrations، contract subset، secret scan.
2. **عند دمج الفرع الرئيسي:** بناء Odoo image، Android artifacts، Apple artifacts، وتشغيل integration suite.
3. **ليلياً:** full API، offline fault suite، visual matrix، Webhooks، وتقارير الأداء القصيرة.
4. **في مختبر العتاد:** printer/payment/device tests على queue مخصصة مع حجز الجهاز.
5. **مرشح الإصدار:** full conformance، ZATCA، soak، security، migration، backup/restore.

### 17.2 قواعد التوافق والترقية

| المجال | القاعدة |
|---|---|
| API | الإصدار 1.0 ثابت؛ التغيير الكاسر يحتاج إصداراً جديداً |
| Sync | تفاوض protocol version، ودعم النسخة الحالية والسابقة خلال rollout |
| LAN | رفض واضح للنسخة غير المدعومة مع مسار ترقية |
| قاعدة العميل | migrations أمامية واختبار من كل إصدار مدعوم مع Outbox غير فارغ |
| Odoo | ترقية commit الأساس لا تمر قبل full server وcontract وfinancial suite |
| النشر | الخادم يدعم العميل السابق قبل نشر العميل الجديد |
| rollback | لا يعتمد على خفض schema؛ تستخدم تغييرات expand ثم migrate ثم contract |
| Feature flags | تستخدم لعزل adapter أو تدفق جديد، ولا تعد قبولاً دائماً لفجوة مفتوحة |

## 18. الرصد والتشغيل

### 18.1 المقاييس الإلزامية

| المجال | المقاييس |
|---|---|
| Sync | backlog count/age، ack latency، retries، conflicts، blocked operations |
| API | latency، status/error code، rate-limit hits، auth failures |
| Webhooks | pending، attempts، delivery latency، disabled subscriptions |
| POS | local commit latency، crash-free sessions، unsynced receipts، shift close failures |
| LAN | paired devices، disconnects، sequence gaps، replay count |
| الدفع | state counts، unknown age، reconciliation outcomes، duplicate prevention hits |
| الطباعة | queued/failed/retried، model/interface، paper/status errors |
| ZATCA | pending age، accepted/warning/rejected، retry، chain validation |
| البيانات | tombstone backlog، mapper failures، migration version |

### 18.2 قواعد التسجيل

1. استخدام correlation ID موحد من العميل إلى Odoo والعامل الخارجي.
2. تسجيل UUID التوافقي لا payload الشخصي الكامل.
3. تنقيح tokens والأسرار وبيانات البطاقة والشهادات والبريد والهاتف.
4. فصل audit events عن diagnostic logs.
5. الاحتفاظ بسجل كل تجاوز وإلغاء واسترداد وتعديل وقت أو مخزون.
6. ربط التنبيه بـrunbook واضح وإجراء استرداد آمن.

## 19. المخاطر وضوابطها

| الخطر | الأثر | الضابط |
|---|---|---|
| تغير Odoo 19 أثناء التطوير | انحدار أو صعوبة ترقية | commit مثبت، رقع معزولة، واختبار upstream update مستقل |
| اختلاف SDK مزود الدفع حسب البلد | فجوة في خلية من المصفوفة | capability matrix، adapter مستقل، طرفية فعلية، وبوابة G11 لكل خلية |
| قيود iOS على Bluetooth/USB | عدم دعم موديل أو واجهة | إثبات مبكر في Hardware Lab قبل اعتماد الخلية |
| سلوك firmware للطابعة | قص أو QR أو status غير متوقع | fixtures ثنائية وHardware-in-the-Loop حسب firmware |
| تعارض تذاكر بين جهازين | فقد سطر أو إرجاع محذوف | revisions وoperation merge وtombstones واختبارات model-based |
| timeout بعد نجاح دفع خارجي | تحصيل مكرر | Unknown state وcheck-status وreconciliation ومنع retry العمياء |
| backlog بعد انقطاع طويل | بطء أو ضغط على الخادم | batches، cursors، backpressure، ومراقبة العمر والحجم |
| فشل migration مع Outbox غير فارغ | فقد بيع محلي | نسخ احتياطي محلي، transactional migration، واختبار كل مسار ترقية |
| تأخر أو رفض ZATCA | تعطيل الإغلاق أو كسر السلسلة | submission outbox، مستند immutable، retry نفسه، وحالة مرئية |
| انحراف الواجهة بعد تعديل مشترك | فقد المطابقة البصرية | tokens مركزية وvisual tests على كل Pull Request ذي صلة |
| تغير المرجع الوظيفي أثناء التنفيذ | نهاية غير ثابتة | baseline versioned؛ التغيير يدخل كمتطلب جديد ولا يعدل نتيجة قديمة بصمت |
| اتساع السطح الأمني عبر LAN والعملاء | سرقة رموز أو حقن رسالة | device identity، pairing keys، TLS، revocation، وMITM tests |

## 20. تعريف الاكتمال

### 20.1 اكتمال مهمة برمجية

لا تُغلق المهمة إلا إذا:

- نُفذ الكود في الوحدة الصحيحة من دون تجاوز الحدود.
- أضيفت unit وintegration tests.
- أضيف migration أو ثبت عدم الحاجة إليه.
- حدث contract أو بقي متوافقاً وثبت ذلك آلياً.
- أضيفت telemetry ورسالة خطأ قابلة للتشخيص.
- اختبرت العربية وRTL وOffline إذا كانا ذوي صلة.
- وثق القرار أو سلوك التشغيل إن كان جديداً.
- لم تضف اعتماداً مغلقاً إلى مسار Community.

### 20.2 اكتمال Gap ID

لا يُغلق بند الفجوة إلا إذا:

1. نجحت كل الحالات في requirement.md.
2. نجحت المنصات والأجهزة والحالات الداخلة في نطاق البند.
3. تطابقت النتيجة المالية والبيانية مع golden fixture.
4. نجحت الحالة Online وOffline والانقطاع إذا كان ذلك من سلوكها.
5. نجحت الصلاحيات والرسائل والحالات السلبية.
6. نجح visual diff إن كان للبند واجهة.
7. نجح العتاد الفعلي إن كان للبند جهاز أو دفع.
8. حُفظ result.json وartifact وربطا بالمرشّح نفسه.
9. لا يوجد استثناء مؤقت أو اختبار معطّل أو نتيجة يدوية غير قابلة للتكرار.

### 20.3 اكتمال المطابقة بنسبة 100%

تتحقق النهاية فقط عندما:

- تكون البنود الـ51 جميعها في حالة Passed.
- تنجح المسارات الـ34 والعمليات الـ57 كاملة.
- تنجح أنواع Webhook الخمسة والتجميع والتوقيع وإعادة المحاولة.
- تنجح جميع خلايا الدفع والطباعة والعتاد المحددة في baseline.
- تنجح مصفوفة Android وiPhone وiPad والاتجاهات وRTL.
- يثبت fault injection عدم فقد أو تكرار بيع أو دفع أو حدث مخزون.
- تنجح عينات ZATCA للبيع والاسترداد وسلامة hash chain.
- لا توجد فجوة P0 أو P1 أو P2 مؤجلة.
- تنجح الترقية والاستعادة والrollback التشغيلي على مرشح الإصدار.

## 21. ترتيب التنفيذ الحرج

المسار الذي لا يجوز اختصاره هو:

1. مرجع قبول ثابت.
2. بنية بناء قابلة للتكرار.
3. نموذج موارد ومعرفات ثابت.
4. API وهوية وعقود.
5. Local-first ومزامنة وتكرار آمن.
6. مجال POS وتدفق نقدي كامل.
7. POS أصلي على Android وApple.
8. KDS/CDS وLAN.
9. المخزون والتقارير وDashboard.
10. العتاد والطباعة.
11. الدفع المتكامل.
12. ZATCA.
13. RTL والمطابقة البصرية.
14. الصلابة والأمن والترقية.
15. شهادة البنود الـ51 على مرشح واحد.

أي بناء للواجهات قبل تثبيت نموذج الموارد والعقد، أو أي دمج دفع قبل إثبات idempotency وUnknown reconciliation، سيعيد العمل ويمنع إثبات المطابقة. لذلك تعمل المسارات بالتوازي فقط ضمن تبعيات الجدول، ولا تتجاوز بوابات الخروج.

## 22. قائمة بدء التنفيذ

أول حزمة عمل قابلة للسحب بعد اعتماد هذه الخطة:

1. إنشاء baseline manifest وقوالب Gap ID.
2. تثبيت Odoo 19.0 commit وبيئة PostgreSQL.
3. إنشاء هيكل المستودع وخطوط البناء الأربعة.
4. بناء golden dataset للحسابات والتقارير.
5. كتابة resource dictionary وUUID mapping migration.
6. كتابة OpenAPI skeleton للإصدار 1.0.
7. إنشاء local database schema المتناظر على Android وApple.
8. إنشاء command inbox وevent outbox proof.
9. تنفيذ بيع نقدي vertical slice: سلة محلية ← إيصال ← sync ← Odoo ← إقرار.
10. تشغيل أول اختبار kill-after-local-commit ثم retry وإثبات إيصال واحد.

هذه الحزمة لا تتجاوز P00 إلى P04؛ وهي تؤسس المسار الحرج الذي تعتمد عليه بقية وظائف POS وKDS/CDS والدفع وZATCA.
