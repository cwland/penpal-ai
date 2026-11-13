const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("../manifest.json");

test("manifest grants declarativeNetRequestWithHostAccess for the local-server header rules", () => {
  assert.ok(manifest.permissions.includes("declarativeNetRequestWithHostAccess"));
});

test("version.json matches the manifest version (the update checker compares them)", () => {
  assert.equal(require("../version.json").version, manifest.version);
});

test("manifest does not request the broader declarativeNetRequest permission (it adds an install warning)", () => {
  assert.ok(!manifest.permissions.includes("declarativeNetRequest"));
});
