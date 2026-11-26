import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCollection } from '../.test-build/geojson.js';
const feature = id => ({ type: 'Feature', ...(id === undefined ? {} : { id }), properties: { name: 'Point' }, geometry: { type: 'Point', coordinates: [121, 31] } });
test('generated IDs do not collide with explicit IDs later in the imported collection', () => {
  const input = { type: 'FeatureCollection', features: [feature(), feature('import-1')] };
  const output = validateCollection(input);
  assert.equal(output.features[1].id, 'import-1');
  assert.notEqual(output.features[0].id, 'import-1');
  assert.equal(new Set(output.features.map(item => item.id)).size, 2);
  assert.equal(input.features[0].id, undefined);
});

test('generated IDs skip reserved suffixes and remain stable on round trips', () => {
  const input = { type: 'FeatureCollection', features: [feature(), feature('import-1'), feature('import-1-1'), feature()] };
  const first = validateCollection(input);
  assert.equal(first.features[0].id, 'import-1-2');
  assert.equal(first.features[1].id, 'import-1');
  assert.equal(first.features[2].id, 'import-1-1');
  assert.equal(first.features[3].id, 'import-4');
  assert.deepEqual(validateCollection(JSON.parse(JSON.stringify(first))), first);
});
test('explicit duplicate IDs are still rejected, including numeric/string equivalents', () => {
  for (const ids of [['same', 'same'], [1, '1']]) {
    assert.throws(() => validateCollection({ type: 'FeatureCollection', features: ids.map(feature) }), /重复/);
  }
});
