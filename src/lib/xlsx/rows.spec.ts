import { describe, expect, it } from 'vitest';
import { contactsToRows } from './rows';
import type { Contact } from '$lib/domain/contact/types';

let nextId = 0;

function makeContact(overrides: Partial<Contact> = {}): Contact {
	nextId += 1;
	return {
		id: `contact-${nextId}`,
		phones: [],
		emails: [],
		addresses: [],
		websites: [],
		source: { fileId: 'file-1', fileName: 'a.vcf' },
		...overrides
	};
}

describe('contactsToRows', () => {
	it('builds a header + one row per contact for single-value fields', () => {
		const a = makeContact({ name: 'Ana', organization: 'Empresa A' });
		const b = makeContact({ name: 'Bruno', organization: 'Empresa B' });

		const { headers, rows } = contactsToRows([a, b], ['name', 'organization']);

		expect(headers).toEqual(['Nome', 'Empresa']);
		expect(rows).toEqual([
			['Ana', 'Empresa A'],
			['Bruno', 'Empresa B']
		]);
	});

	it('numbers multi-value columns up to the contact with the most values', () => {
		const a = makeContact({ phones: [{ value: '111', normalized: '111' }] });
		const b = makeContact({
			phones: [
				{ value: '222', normalized: '222' },
				{ value: '333', normalized: '333' }
			]
		});

		const { headers, rows } = contactsToRows([a, b], ['phones']);

		expect(headers).toEqual(['Telefone 1', 'Telefone 2']);
		expect(rows).toEqual([
			['111', ''],
			['222', '333']
		]);
	});

	it('drops columns that are empty across every exported contact', () => {
		const a = makeContact({ name: 'Ana' });
		const b = makeContact({ name: 'Bruno' });

		const { headers, rows } = contactsToRows([a, b], ['name', 'organization', 'phones']);

		expect(headers).toEqual(['Nome']);
		expect(rows).toEqual([['Ana'], ['Bruno']]);
	});

	it('every cell is a string, even for values that look numeric', () => {
		const a = makeContact({ phones: [{ value: '047999999999', normalized: '047999999999' }] });

		const { rows } = contactsToRows([a], ['phones']);

		expect(typeof rows[0][0]).toBe('string');
		expect(rows[0][0]).toBe('047999999999');
	});

	it('reads websites directly as strings, unlike phones/emails/addresses', () => {
		const a = makeContact({ websites: ['https://a.example', 'https://b.example'] });

		const { headers, rows } = contactsToRows([a], ['websites']);

		expect(headers).toEqual(['Website 1', 'Website 2']);
		expect(rows).toEqual([['https://a.example', 'https://b.example']]);
	});
});
