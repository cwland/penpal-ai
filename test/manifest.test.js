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

test("CHANGELOG.json's newest entry matches the manifest version", () => {
  const log = require("../CHANGELOG.json");
  assert.equal(log[0].version, manifest.version);
});

test("CHANGELOG.json entries are newest first, dated, and have notes", () => {
  const log = require("../CHANGELOG.json");
  const num = (v) => v.split(".").map(Number);
  for (let i = 1; i < log.length; i++) {
    const [a, b] = [num(log[i - 1].version), num(log[i].version)];
    assert.ok(a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] > b[2]))), `${log[i - 1].version} should be newer than ${log[i].version}`);
  }
  for (const e of log) {
    assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Array.isArray(e.notes) && e.notes.length > 0, `${e.version} needs notes`);
  }
});
