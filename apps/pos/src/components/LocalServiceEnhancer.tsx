import type { LocalServiceFlow } from "../state/useLocalServiceFlow";

type Props = { local: LocalServiceFlow; legacyFixture?: boolean };

/**
 * Local-service feedback is ordinary React output. Structural controls, settings,
 * context labels, and table actions are owned by their parent components.
 */
export function LocalServiceEnhancer({ local, legacyFixture = false }: Props) {
  if (legacyFixture) return null;
  return <>
    {local.localNotice ? <div className="local-service-toast local-service-toast--success" role="status">{local.localNotice}</div> : null}
    {local.localError ? <button type="button" className="local-service-toast local-service-toast--error" onClick={local.clearLocalError} role="alert">{local.localError}</button> : null}
  </>;
}
