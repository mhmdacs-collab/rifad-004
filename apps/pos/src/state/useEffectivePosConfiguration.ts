import { useEffect, useState } from "react";
import type { EffectivePosConfiguration } from "../../../../contracts/posConfiguration";
import type { PosRuntimeContract } from "../contracts/pos";
import type { DeviceSession } from "../domain/models";

export const useEffectivePosConfiguration = (
  runtime: PosRuntimeContract,
  device: DeviceSession | null,
) => {
  const [configuration, setConfiguration] = useState<EffectivePosConfiguration | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!device) {
      setConfiguration(null);
      setErrorMessage(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setErrorMessage(null);
    runtime.effectiveConfiguration.read()
      .then((effective) => {
        if (!active) return;
        setConfiguration(effective);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setConfiguration(null);
        setErrorMessage(error instanceof Error ? error.message : "تعذر تحميل إعدادات نقطة البيع المحلية.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [device, runtime]);

  return { configuration, loading, errorMessage };
};
