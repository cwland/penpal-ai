// After an update, the background opens Settings and flags the What's New pop-up.
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBackground, plain } = require("./helpers/load-background");

function fireInstalled(details, version = "1.6.0") {
  const local = {};
  let optionsOpened = 0;
  const { chromeCalls } = loadBackground({
    fetchImpl: async () => ({ ok: false }),
    chromeOverrides: {
      "chrome.runtime.getManifest": () => ({ version }),
      "chrome.runtime.openOptionsPage": () => { optionsOpened++; },
      "chrome.storage.local.set": async (o) => { Object.assign(local, o); },
      "chrome.storage.local.get": async () => ({}),
      "chrome.storage.sync.get": async () => ({ aiModels: [] }),
      "chrome.storage.sync.set": async () => {}
    }
  });
  const reg = chromeCalls.find(c => c.api === "chrome.runtime.onInstalled.addListener");
  reg.args[0](details);
  return { local, optionsOpened: () => optionsOpened };
}

test("an update to a new version opens Settings with What's New", async () => {
  const { local, optionsOpened } = fireInstalled({ reason: "update", previousVersion: "1.5.1" });
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(plain(local.penpalWhatsNew), { from: "1.5.1", to: "1.6.0" });
  assert.equal(optionsOpened(), 1);
});

test("reloading the same version (unpacked reload) doesn't show What's New", async () => {
  const { local, optionsOpened } = fireInstalled({ reason: "update", previousVersion: "1.6.0" });
  await new Promise(r => setTimeout(r, 5));
  assert.equal(local.penpalWhatsNew, undefined);
  assert.equal(optionsOpened(), 0);
});

test("a first install opens Settings for setup but not What's New", async () => {
  const { local, optionsOpened } = fireInstalled({ reason: "install" });
  await new Promise(r => setTimeout(r, 5));
  assert.equal(local.penpalWhatsNew, undefined);
  assert.equal(optionsOpened(), 1);
});
