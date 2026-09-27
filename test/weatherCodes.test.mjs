import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeWeather, KNOWN_WEATHER_CODES } from '../src/weatherCodes.mjs';

// The 29 codes in the Open-Meteo docs table.
const DOCUMENTED_CODES = [
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77,
  80, 81, 82, 85, 86, 95, 96, 97, 99,
];

// Icons that show the sun, which should never appear at night.
const SUN_ICONS = ['☀️', '🌤️', '⛅', '🌦️'];

test('knows every documented code and no others', () => {
  assert.deepEqual(KNOWN_WEATHER_CODES, DOCUMENTED_CODES);
});

test('every code has a description and an icon, day and night', () => {
  for (const code of DOCUMENTED_CODES) {
    for (const isDay of [1, 0]) {
      const { text, icon } = describeWeather(code, isDay);
      assert.ok(text.length > 0, `code ${code} has no description`);
      assert.ok(icon.length > 0, `code ${code} has no icon`);
    }
  }
});

test('never shows the sun at night', () => {
  for (const code of DOCUMENTED_CODES) {
    const { icon } = describeWeather(code, 0);
    assert.ok(!SUN_ICONS.includes(icon), `code ${code} shows ${icon} at night`);
  }
});

test('maps real examples', () => {
  assert.deepEqual(describeWeather(61, 1), { text: 'Slight rain', icon: '🌦️' });
  assert.deepEqual(describeWeather(61, 0), { text: 'Slight rain', icon: '🌧️' });
  assert.deepEqual(describeWeather(0, 1), { text: 'Clear sky', icon: '☀️' });
  assert.deepEqual(describeWeather(0, 0), { text: 'Clear sky', icon: '🌙' });
  assert.deepEqual(describeWeather(97, 1), {
    text: 'Heavy thunderstorm',
    icon: '⛈️',
  });
});

test('treats a missing is_day as daytime', () => {
  assert.equal(describeWeather(0).icon, '☀️');
});

test('falls back for unknown or missing codes', () => {
  const unknown = { text: 'Unknown conditions', icon: '🌡️' };
  assert.deepEqual(describeWeather(42), unknown);
  assert.deepEqual(describeWeather(undefined), unknown);
  assert.deepEqual(describeWeather(null), unknown);
  assert.deepEqual(describeWeather('toString'), unknown);
});
