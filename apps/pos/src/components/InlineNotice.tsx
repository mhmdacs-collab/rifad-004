type InlineNoticeProps = {
  message: string | null;
  onDismiss?: () => void;
};

export function InlineNotice({ message, onDismiss }: InlineNoticeProps) {
  if (!message) return null;
  return (
    <div className="inline-notice" role="alert">
      <span>{message}</span>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label="إغلاق الرسالة">
          ×
        </button>
      ) : null}
    </div>
  );
}
