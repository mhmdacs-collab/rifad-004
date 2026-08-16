import { useState } from "react";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { InlineNotice } from "../components/InlineNotice";

type SignInScreenProps = {
  busy: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
};

export function SignInScreen({ busy, errorMessage, onDismissError, onSubmit }: SignInScreenProps) {
  const [email, setEmail] = useState("demo@rifad.sa");
  const [password, setPassword] = useState("rifad");

  return (
    <main className="auth-screen" data-screen-id="POS-SCREEN-001">
      <section className="auth-form-pane" aria-labelledby="sign-in-title">
        <div className="auth-form-wrap">
          <Brand className="auth-logo" />
          <div className="auth-copy">
            <span className="eyebrow">جهاز نقطة البيع</span>
            <h1 id="sign-in-title">ربط الجهاز بحساب رفاد</h1>
            <p>سجّل الدخول مرة واحدة لربط هذا الجهاز بالمنشأة والفرع.</p>
          </div>

          <InlineNotice message={errorMessage} onDismiss={onDismissError} />

          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(email, password);
            }}
          >
            <label>
              <span>البريد الإلكتروني</span>
              <input
                dir="ltr"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.sa"
                required
              />
            </label>
            <label>
              <span>كلمة المرور</span>
              <input
                dir="ltr"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={4}
                required
              />
            </label>
            <button className="primary-button auth-submit" type="submit" disabled={busy}>
              {busy ? <span className="button-spinner" aria-hidden="true" /> : <Icon name="lock" size={20} />}
              <span>{busy ? "جارٍ ربط الجهاز…" : "تسجيل الدخول"}</span>
            </button>
          </form>

          <p className="demo-hint">نسخة العرض جاهزة بالبيانات المكتوبة، والرقم السري للموظف هو 1234.</p>
        </div>
      </section>

      <aside className="auth-brand-pane" aria-label="مزايا رفاد">
        <div className="brand-pane-content">
          <div className="brand-pane-mark"><Brand compact /></div>
          <span className="eyebrow eyebrow--light">Rifad POS</span>
          <h2>نقطة بيع واضحة، سريعة، ومصممة للعمل.</h2>
          <p>تجربة تطبيق حقيقية للموظف، مع تشغيل محلي وعقود مستقلة لكل قدرة.</p>
          <ul>
            <li><Icon name="check" size={19} /> واجهة عربية RTL من البداية</li>
            <li><Icon name="check" size={19} /> جاهز للمس والكيبورد</li>
            <li><Icon name="check" size={19} /> بيع نقدي محلي دون اعتماد على السحابة</li>
          </ul>
        </div>
        <div className="brand-pane-footer"><span className="status-dot" /> بيئة العرض المحلية جاهزة</div>
      </aside>
    </main>
  );
}
