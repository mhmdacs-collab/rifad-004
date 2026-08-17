import { createMockPosRuntime } from "../adapters/mockPos";
import type { PosRuntimeContract } from "../contracts/pos";

export type PosRuntimeAdapterInfo = Readonly<{
  id: string;
  contractVersion: 1;
  transport: "local" | "remote-api" | "hybrid";
  implementation: "mock" | "external" | "rifad-native";
}>;

/**
 * Single composition point for the general POS runtime.
 *
 * A future production adapter replaces the factory result here. UI/state code
 * must not import concrete POS implementations directly.
 */
export const POS_RUNTIME_ADAPTER_INFO: PosRuntimeAdapterInfo = {
  id: "rifad-mock-pos",
  contractVersion: 1,
  transport: "local",
  implementation: "mock",
};

export const createPosRuntimeAdapter = (): PosRuntimeContract => {
  return createMockPosRuntime();
};
