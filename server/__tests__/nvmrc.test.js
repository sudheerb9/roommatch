const fs = require("fs");
const path = require("path");

// The pinned Node.js runtime must be at least the patched release that fixes
// Node2Shell (Node.js Brotli RCE, CVE-2026-111497) and the October security
// releases. Comparing numerically keeps the guard correct across 24.x.
function versionAtLeast(actual, minimum) {
  const a = actual.split(".").map(Number);
  const m = minimum.split(".").map(Number);
  for (let i = 0; i < m.length; i++) {
    if ((a[i] || 0) > m[i]) return true;
    if ((a[i] || 0) < m[i]) return false;
  }
  return true;
}

describe(".nvmrc Node runtime pin", () => {
  it("pins Node.js to at least the patched 24.22.1 release", () => {
    const nvmrcPath = path.resolve(__dirname, "..", "..", ".nvmrc");
    const pinned = fs.readFileSync(nvmrcPath, "utf8").trim();
    expect(versionAtLeast(pinned, "24.22.1")).toBe(true);
  });
});
