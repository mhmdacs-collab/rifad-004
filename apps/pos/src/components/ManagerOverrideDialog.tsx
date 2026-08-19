import { useCallback, useEffect, useRef, useState } from "react";
import type { ManagerOverrideRequest } from "../state/useManagerOverrideGate";
import { Icon } from "./Icon";
import { InlineNotice } from "./InlineNotice";

type ManagerOverrideDialogProps = {
  request: ManagerOverrideRequest;
  busy: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onApprove: (pin: string) => Promise<void>;
  onCancel: () => void;
};

const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export function ManagerOverrideDialog({
  request,
  busy,
  errorMessage,
  onDismissError,
  onApprove,
  onCancel,
}: ManagerOverrideDialogProps) {
  const [pin, setPin] = useState("");
  const submitting = useRef(false);

  const submitPin = useCallback(async (next: string) => {
    if (submitting.current || next.length !== 4) return;
    submitting.current = true;
    try {
      await onApprove(next);
    } catch {
      setPin("");
    } finally {
      submitting.current = false;
    }
  }, [onApprove]);

  useEffect(() => {
    setPin("");
  }, [request.commandId]);

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
    setPin((current) => current.length >= 4 ? current : `${current}${key}`);
  };

  return (
    <div
      className="manager-override-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !busy) onCancel();
      }}
    >
      <section
        className="manager-override-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-override-title"
        data-screen-id="POS-SCREEN-002"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (/^\d$/.test(event.key)) press(event.key as (typeof keypad)[number]);
          if (event.key === "Backspace") press("back");
          if (event.key === "Escape" && !busy) onCancel();
        }}
      >
        <header className="manager-override-head">
          <div className="manager-override-lock"><Icon name="lock" size={22} /></div>
          <div>
            <span>اعتماد مدير لمرة واحدة</span>
            <strong id="manager-override-title">{request.title}</strong>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="إلغاء الاعتماد">×</button>
        </header>

        <div className="manager-override-body">
          <p>هذه العملية غير مسموحة للموظف الحالي. أدخل رقم موظف مخول لاعتماد هذه العملية فقط.</p>

          <div className="pin-dots manager-override-dots" aria-label={`تم إدخال ${pin.length} من 4 أرقام`}>
            {[0, 1, 2, 3].map((index) => <span key={index} className={index < pin.length ? "filled" : ""} />)}
          </div>

          <InlineNotice message={errorMessage} onDismiss={onDismissError} />

          <div className="keypad manager-override-keypad" aria-label="لوحة رقم اعتماد المدير">
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

          <small className="manager-override-note">لن يتم تبديل الموظف الحالي أو فتح صلاحية مستمرة بعد الاعتماد.</small>
        </div>
      </section>
    </div>
  );
}
