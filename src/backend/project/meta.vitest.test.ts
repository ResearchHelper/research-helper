import { describe, it, expect } from "vitest";
import { getMeta } from "src/backend/project/meta";

describe("meta.ts", () => {
  it("getMeta", async () => {
    let DOI = "10.1063/5.0050226";
    let metas = await getMeta(DOI);
    expect(metas.length).toBe(1);
    expect(metas[0].title).toBe(
      "On quasineutral plasma flow in the magnetic nozzle"
    );
  });
});
