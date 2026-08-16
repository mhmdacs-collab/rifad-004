import { useCallback, useEffect, useRef, useState } from "react";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { InlineNotice } from "../components/InlineNotice";
import type { DeviceSession } from "../domain/models";

type PinScreenProps = {
  device: DeviceSession | null;
  busy: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onSubmit: (pin: string) => Promise<void>;
};

const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export function PinScreen({ device, busy, errorMessage, onDismissError, onSubmit }: PinScreenProps) {
  const [pin, setPin] = useState("");
  const submitting = useRef(false);

  const submitPin = useCallback(async (next: string) => {
    if (submitting.current || next.length !== 4) return;
    submitting.current = true;
    try {
      await onSubmit(next);
    } catch {
      setPin("");
    } finally {
      submitting.current = false;
    }
  }, [onSubmit]);

  useEffect(() => {
    if (pin.length === 4) void submitPin(pin);
  }, [pin, submitPin]);

  const press = (key: (typeof keypad)[number]) => {
    if (busy) return;
    if (key === "clear") {
      setPin("");
      return;
    }
    if (key === "back") {
      setPin((current) => current.slice(0, -1));
      return;
    }
    setPin((current) => {
      if (current.length >= 4) return current;
      return `${current}${key}`;
    });
  };

  return (
    <main
      className="pin-screen"
      data-screen-id="POS-SCREEN-002"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (/^\d$/.test(event.key)) press(event.key as (typeof keypad)[number]);
        if (event.key === "Backspace") press("back");
        if (event.key === "Escape") press("clear");
      }}
    >
      <header className="pin-header">
        <Brand compact />
        <div>
          <strong>{device?.branchName ?? "فرع رفاد"}</strong>
          <span>{device?.deviceName ?? "جهاز نقطة البيع"}</span>
        </div>
        <div className="connection-pill"><span /> متصل</div>
      </header>

      <section className="pin-content" aria-labelledby="pin-title">
        <div className="employee-avatar"><Icon name="user" size={34} /></div>
        <span className="eyebrow">تسجيل دخول الموظف</span>
        <h1 id="pin-title">أدخل الرقم السري</h1>
        <p>استخدم رقمك المكون من أربعة أرقام لفتح نقطة البيع.</p>

        <div className="pin-dots" aria-label={`تم إدخال ${pin.length} من 4 أرقام`}>
          {[0, 1, 2, 3].map((index) => <span key={index} className={index < pin.length ? "filled" : ""} />)}
        </div>

        <InlineNotice message={errorMessage} onDismiss={onDismissError} />

        <div className="keypad" aria-label="لوحة الرقم السري">
          {keypad.map((key) => (
            <button
              type="button"
              key={key}
              className={key === "clear" || key === "back" ? "keypad-action" : ""}
              onClick={() => press(key)}
              disabled={busy}
              aria-label={key === "clear" ? "مسح الرقم" : key === "back" ? "حذف آخر رقم" : `رقم ${key}`}
            >
              {key === "clear" ? "مسح" : key === "back" ? "⌫" : key}
            </button>
          ))}
        </div>
        <div className="pin-help"><Icon name="lock" size={16} /> الرقم التجريبي: 1234</div>
      </section>
    </main>
  );
}
