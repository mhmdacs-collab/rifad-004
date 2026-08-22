import { describe, expect, it } from "vitest";
import { LOCAL_PERSISTENCE_ADAPTER_INFO } from "./localPersistenceAdapter";

describe("production local persistence selection", () => {
  it("selects the Rifad-native SQLite production adapter", () => {
    expect(LOCAL_PERSISTENCE_ADAPTER_INFO.transport).toBe("sqlite");
    expect(LOCAL_PERSISTENCE_ADAPTER_INFO.implementation).toBe("rifad-native");
  });
});
