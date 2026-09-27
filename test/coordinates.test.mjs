import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCoordinates, roundCoordinate } from '../src/coordinates.mjs';

test('reads latitude and longitude with a comma, spaces, or both', () => {
  const agbor = { lat: 6.25, lon: 6.19 };
  assert.deepEqual(parseCoordinates('6.25,6.19'), agbor);
  assert.deepEqual(parseCoordinates('6.25, 6.19'), agbor);
  assert.deepEqual(parseCoordinates('  6.25 ,  6.19  '), agbor);
  assert.deepEqual(parseCoordinates('6.25 6.19'), agbor);
});

test('reads signs and whole numbers', () => {
  assert.deepEqual(parseCoordinates('-33.87, 151.21'), { lat: -33.87, lon: 151.21 });
  assert.deepEqual(parseCoordinates('+51.5, -0.13'), { lat: 51.5, lon: -0.13 });
  assert.deepEqual(parseCoordinates('6, 3'), { lat: 6, lon: 3 });
});

test('accepts the edges of the valid range and rejects anything beyond', () => {
  assert.deepEqual(parseCoordinates('-90, -180'), { lat: -90, lon: -180 });
  assert.deepEqual(parseCoordinates('90, 180'), { lat: 90, lon: 180 });
  assert.equal(parseCoordinates('90.1, 10'), null);
  assert.equal(parseCoordinates('10, 180.5'), null);
  assert.equal(parseCoordinates('-91, 0'), null);
});

test('leaves place names and other text for the place search', () => {
  for (const text of [
    'Lagos',
    'London, UK',
    'Agbor, Delta State, Nigeria',
    '10001',
    '6.25',
    '6.25,',
    ', 6.19',
    '6.25, 6.19, 7',
    '6.25, abc',
    '1e3, 5',
    '',
  ]) {
    assert.equal(parseCoordinates(text), null, `"${text}" should not be coordinates`);
  }
});

test('rounds coordinates to 3 decimals', () => {
  assert.equal(roundCoordinate(6.25375123), 6.254);
  assert.equal(roundCoordinate(6.19421987), 6.194);
  assert.equal(roundCoordinate(-33.86785), -33.868);
  assert.equal(roundCoordinate(6.25), 6.25);
});
