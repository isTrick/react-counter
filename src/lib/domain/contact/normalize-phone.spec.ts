import { describe, expect, it } from 'vitest';
import { normalizePhone } from './normalize-phone';

describe('normalizePhone', () => {
	it('removes spaces, +, -, ( and )', () => {
		expect(normalizePhone('+55 (47) 99999-9999')).toBe('5547999999999');
	});

	it('does not add a country code', () => {
		expect(normalizePhone('47999999999')).toBe('47999999999');
		expect(normalizePhone('47999999999')).not.toBe(normalizePhone('5547999999999'));
	});

	it('returns an empty string for input with no digits', () => {
		expect(normalizePhone('n/a')).toBe('');
	});
});
