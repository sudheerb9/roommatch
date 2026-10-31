const fs = require("fs");
const path = require("path");

// node-forge is a transitive dependency of the client build (via selfsigned,
// used by react-scripts for the HTTPS dev server). The pinned version must be
// at least 1.4.1, which fixes multiple CVEs (GHSA-hqq3-7jhf-c5jx,
// GHSA-jc66-7q78-782g, GHSA-7wch-p9px-956x, GHSA-5x38-2vff-x55p,
// GHSA-8hrf-8g6f-7xwp). Comparing numerically keeps the guard correct across
// future 1.4.x releases.
function versionAtLeast(actual, minimum) {
  const a = actual.split(".").map(Number);
  const m = minimum.split(".").map(Number);
  for (let i = 0; i < m.length; i++) {
    if ((a[i] || 0) > m[i]) return true;
    if ((a[i] || 0) < m[i]) return false;
  }
  return true;
}

describe("node-forge dependency security", () => {
  it("pins node-forge to at least the patched 1.4.1 release", () => {
    const lockfilePath = path.resolve(__dirname, "..", "package-lock.json");
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, "utf8"));
    const forge = lockfile.packages["node_modules/node-forge"];
    expect(forge).toBeDefined();
    expect(versionAtLeast(forge.version, "1.4.1")).toBe(true);
  });
});
