import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import * as vue from 'vue';

const policy = await import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync(new URL('../45drives-system/src/firmware-policy.js', import.meta.url))).toString('base64')}`);
const qualified = {
  type: 'nic', model: 'E810', bus_info: '0000:41:00.0', cache_index: 0,
  current_firmware: '4.80', latest_firmware: '5.10', release_revision: 'revision',
  qualification_policy_version: 1, eligible: true, flashable: true,
  update_available: 'outdated', tool_package: 'intel.tar.gz',
};

const tick = () => new Promise(resolve => setImmediate(resolve));

function setupSection(device, preflightFails = false, cacheChanges = {}) {
  const source = fs.readFileSync(new URL('../45drives-system/src/components/SectionFirmware.vue', import.meta.url), 'utf8');
  const script = source.split('<script>')[1].split('</script>')[0].replace(/^import .*;\s*$/gm, '').replace('export default', 'return');
  let flashes = 0;
  const commands = [];
  const server = {
    execute: async command => {
      commands.push(command.argv);
      let output;
      if (command.argv[0] === 'cat') output = {qualification_policy_version: 1, manifest_source: 'remote', devices: [device], ...cacheChanges};
      else if (command.argv.includes('--preflight')) {
        if (preflightFails) throw new Error('preflight unavailable');
        output = {blocked: false, actions: [], downloads: []};
      } else output = {state: 'missing', pending: []};
      return {exitStatus: 0, getStdout: () => JSON.stringify(output)};
    },
    spawnProcess: () => { flashes++; throw new Error('must not flash in UI test'); },
  };
  const factory = new Function('vue', 'server', 'Command', 'unwrap', 'policy', `
    const {ref, computed, inject, watch, nextTick} = vue;
    const {isCard, isQualifiedCard, hasAvailableUpdate, catalogIsCurrent} = policy;
    const RefreshIconOutline = {}, InformationCircleIcon = {}, DownloadIcon = {};
    ${script}`);
  const component = factory({...vue, inject: (_key, fallback) => fallback}, server,
    class { constructor(argv) { this.argv = argv; } }, async value => value, policy);
  return {state: component.setup(), flashes: () => flashes, commands};
}

test('only qualified actionable card updates produce notifications', () => {
  assert.equal(policy.hasAvailableUpdate(qualified), true);
  for (const changes of [{eligible: false}, {eligible: undefined}, {qualification_policy_version: undefined},
    {blocked_reason: 'os_unvalidated'}, {flashable: false}, {update_available: 'current'}, {type: 'hba', eligible: false}]) {
    assert.equal(policy.hasAvailableUpdate({...qualified, ...changes}), false);
  }
  assert.equal(policy.catalogIsCurrent({qualification_policy_version: 1, manifest_source: 'unavailable'}), false);
});

test('unqualified and legacy cached cards are omitted from firmware updates', async () => {
  for (const changes of [{eligible: false}, {qualification_policy_version: undefined}]) {
    const device = {...qualified, ...changes};
    const {state} = setupSection(device);
    await tick();
    assert.equal(state.outdatedDevices.value.length, 0);
    assert.equal(state.devices.value.length, 1);
    assert.equal(state.canFlash(device), false);
  }
});

test('catalog retrieval failure disables an otherwise qualified update', async () => {
  const {state} = setupSection(qualified, false, {manifest_source: 'unavailable'});
  await tick();
  assert.equal(state.canFlash(qualified), false);
  assert.equal(state.outdatedDevices.value.length, 0);
});

test('failed preflight cannot be bypassed by entering confirmation text', async () => {
  const {state, flashes} = setupSection(qualified, true);
  await tick();
  assert.equal(state.canFlash(qualified), true);
  await state.startFlash(qualified);
  assert.equal(state.confirmBlocked.value, true);
  state.confirmInput.value = 'confirm flash';
  state.proceedSingleFlash();
  assert.equal(flashes(), 0);
});

test('successful preflight carries stable adapter identity and explicit confirmation is required', async () => {
  const {state, flashes, commands} = setupSection(qualified);
  await tick();
  await state.startFlash(qualified);
  assert.equal(state.confirmBlocked.value, false);
  const args = commands.find(argv => argv.includes('--preflight'));
  assert.equal(args[args.indexOf('--device-pci') + 1], qualified.bus_info);
  assert.equal(args[args.indexOf('--release-revision') + 1], qualified.release_revision);
  state.proceedSingleFlash();
  assert.equal(flashes(), 0);
});
