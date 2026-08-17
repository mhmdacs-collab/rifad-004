import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PosRuntimeContract } from "./contracts/pos";
import { createPosRuntimeAdapter, POS_RUNTIME_ADAPTER_INFO } from "./runtime/posRuntimeAdapter";
import { usePosFlow } from "./state/usePosFlow";

function RuntimeProbe({ runtime }: { runtime: PosRuntimeContract }) {
  const flow = usePosFlow(runtime);
  return <div data-testid="runtime-categories">{flow.categories.map((category) => category.name).join("|")}</div>;
}

describe("POS runtime adapter boundary", () => {
  it("declares one Rifad-owned runtime composition point", () => {
    const runtime: PosRuntimeContract = createPosRuntimeAdapter();

    expect(POS_RUNTIME_ADAPTER_INFO).toEqual({
      id: "rifad-mock-pos",
      contractVersion: 1,
      transport: "local",
      implementation: "mock",
    });
    expect(typeof runtime.restore).toBe("function");
    expect(typeof runtime.catalog.search).toBe("function");
    expect(typeof runtime.sales.startTicket).toBe("function");
    expect(typeof runtime.checkout.begin).toBe("function");
    expect(typeof runtime.printing.submit).toBe("function");
  });

  it("lets usePosFlow consume an injected runtime instead of constructing the mock internally", async () => {
    const base = createPosRuntimeAdapter();
    const injected: PosRuntimeContract = {
      ...base,
      catalog: {
        ...base.catalog,
        categories: async () => [{ id: "adapter-proof", name: "مصدر خارجي تجريبي" }],
        search: async () => [],
      },
      saleLayout: {
        ...base.saleLayout,
        listPages: async () => [],
      },
    };

    render(<RuntimeProbe runtime={injected} />);

    await waitFor(() => {
      expect(screen.getByTestId("runtime-categories")).toHaveTextContent("مصدر خارجي تجريبي");
    });
  });
});
