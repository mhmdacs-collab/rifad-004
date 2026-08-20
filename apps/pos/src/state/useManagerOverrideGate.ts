import { useCallback, useRef, useState } from "react";
import type { PosPermissionKey } from "../../../../contracts/posConfiguration";
import type { PosRuntimeContract } from "../contracts/pos";
import type { DeviceSession, EmployeeSession } from "../domain/models";

export type ManagerOverrideRequest = Readonly<{
  actorEmployeeId: string;
  capability: PosPermissionKey;
  branchId: string;
  commandId: string;
  targetType: string | null;
  targetId: string | null;
  title: string;
}>;

type RequirePermissionInput = Readonly<{
  capability: PosPermissionKey;
  commandId: string;
  title: string;
  targetType?: string | null;
  targetId?: string | null;
}>;

export const useManagerOverrideGate = (
  runtime: PosRuntimeContract,
  employee: EmployeeSession | null,
  device: DeviceSession | null,
) => {
  const [request, setRequest] = useState<ManagerOverrideRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resolver = useRef<((approved: boolean) => void) | null>(null);

  const finish = useCallback((approved: boolean) => {
    resolver.current?.(approved);
    resolver.current = null;
    setRequest(null);
    setBusy(false);
    setErrorMessage(null);
  }, []);

  const requirePermission = useCallback(async (input: RequirePermissionInput): Promise<boolean> => {
    if (!employee || !device) return false;

    const decision = await runtime.authorization.evaluate({
      employeeId: employee.employeeId,
      capability: input.capability,
      branchId: device.branchId,
    });
    if (decision.allowed) return true;

    // Invalid/inactive/out-of-branch identity is not a normal manager-override
    // case. Only a valid employee missing the concrete permission may request
    // one-action approval.
    if (decision.denyReason !== "permission-missing") return false;

    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setErrorMessage(null);
      setRequest({
        actorEmployeeId: employee.employeeId,
        capability: input.capability,
        branchId: device.branchId,
        commandId: input.commandId,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        title: input.title,
      });
    });
  }, [device, employee, runtime]);

  const approve = useCallback(async (pin: string) => {
    if (!request || busy) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await runtime.managerOverride.approveOnce({
        actorEmployeeId: request.actorEmployeeId,
        approverPin: pin,
        capability: request.capability,
        branchId: request.branchId,
        commandId: request.commandId,
        targetType: request.targetType,
        targetId: request.targetId,
      });
      finish(true);
    } catch (error) {
      setBusy(false);
      setErrorMessage(error instanceof Error ? error.message : "تعذر اعتماد العملية.");
      throw error;
    }
  }, [busy, finish, request, runtime]);

  const cancel = useCallback(() => finish(false), [finish]);

  return {
    request,
    busy,
    errorMessage,
    requirePermission,
    approve,
    cancel,
    clearError: () => setErrorMessage(null),
  };
};
