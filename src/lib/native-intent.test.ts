import { expect, test } from '@jest/globals';

import { redirectSystemPath } from '../app/+native-intent';

test('maps the App Link from admin emails to the booking screen', () => {
  const link = 'https://xn--80aaahbqf6ald0daf5a8cwh.xn--p1ai/app/booking/6d2e7df0-8a5c';
  expect(redirectSystemPath({ path: link, initial: true })).toBe('/booking/6d2e7df0-8a5c');
});

test('leaves other links alone', () => {
  expect(redirectSystemPath({ path: '/booking/abc', initial: false })).toBe('/booking/abc');
  expect(redirectSystemPath({ path: 'massageappointments://calendar', initial: false })).toBe('massageappointments://calendar');
});
