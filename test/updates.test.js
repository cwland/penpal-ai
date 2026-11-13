const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts, plain } = require("./helpers/load-background");

const u = () => loadScripts(["penpal-updates.js"]);
const avail = (version) => ({ available: true, version });

test("update button shows only when a newer version is available", () => {
  const c = u();
  assert.equal(c.updateIsAvailable(avail("1.6.1"), "1.6.0"), true);
  assert.equal(c.updateIsAvailable(avail("1.6.0"), "1.6.0"), false);
  assert.equal(c.updateIsAvailable({ available: false }, "1.6.0"), false);
  assert.equal(c.updateIsAvailable(null, "1.6.0"), false);
});

test("Settings banner hides once that version is dismissed, and returns for the next one", () => {
  const c = u();
  assert.equal(c.shouldShowUpdateBanner(avail("1.6.1"), null, "1.6.0"), true);
  assert.equal(c.shouldShowUpdateBanner(avail("1.6.1"), "1.6.1", "1.6.0"), false);
  assert.equal(c.shouldShowUpdateBanner(avail("1.7.0"), "1.6.1", "1.6.0"), true);
});

const LOG = [
  { version: "1.6.0", date: "2026-11-13", notes: ["c"] },
  { version: "1.5.1", date: "2026-11-13", notes: ["b"] },
  { version: "1.5.0", date: "2026-11-13", notes: ["a"] },
  { version: "1.4.0", date: "2026-11-13", notes: ["z"] }
];

test("What's New: versions newer than the one you updated from are expanded, older ones collapsed", () => {
  const s = plain(u().whatsNewSections(LOG, "1.5.0"));
  assert.deepEqual(s.map(x => [x.version, x.expanded]), [["1.6.0", true], ["1.5.1", true], ["1.5.0", false], ["1.4.0", false]]);
});

test("What's New: with no previous version, only the newest is expanded", () => {
  const s = plain(u().whatsNewSections(LOG, null));
  assert.deepEqual(s.map(x => x.expanded), [true, false, false, false]);
});

test("What's New: sorts newest first even if the file isn't", () => {
  const s = plain(u().whatsNewSections([LOG[2], LOG[0], LOG[3], LOG[1]], null));
  assert.deepEqual(s.map(x => x.version), ["1.6.0", "1.5.1", "1.5.0", "1.4.0"]);
});
