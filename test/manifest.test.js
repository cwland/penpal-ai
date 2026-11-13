const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("../manifest.json");

test("manifest grants declarativeNetRequestWithHostAccess for the local-server header rules", () => {
  assert.ok(manifest.permissions.includes("declarativeNetRequestWithHostAccess"));
});

test("manifest does not request the broader declarativeNetRequest permission (it adds an install warning)", () => {
  assert.ok(!manifest.permissions.includes("declarativeNetRequest"));
});
