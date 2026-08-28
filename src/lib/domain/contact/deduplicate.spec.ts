import { describe, expect, it } from 'vitest';
import { deduplicateContacts } from './deduplicate';
import type { Contact } from './types';

let nextId = 0;

function makeContact(
	overrides: Omit<Partial<Contact>, 'phones'> & { phones?: string[] } = {}
): Contact {
	nextId += 1;
	const { phones, ...rest } = overrides;
	return {
		id: `contact-${nextId}`,
		phones: (phones ?? []).map((value) => ({ value, normalized: value.replace(/\D/g, '') })),
		emails: [],
		addresses: [],
		websites: [],
		source: { fileId: 'file-1', fileName: 'a.vcf' },
		...rest
	};
}

describe('deduplicateContacts', () => {
	it('detects the same normalized phone within the same file', () => {
		const a = makeContact({ name: 'A', phones: ['47999999999'] });
		const b = makeContact({ name: 'B', phones: ['47999999999'] });

		const { unique, duplicates } = deduplicateContacts([a, b]);

		expect(unique).toEqual([a]);
		expect(duplicates).toEqual([{ kept: a, removed: b, matchedPhone: '47999999999' }]);
	});

	it('detects the same normalized phone across different files', () => {
		const a = makeContact({
			name: 'A',
			phones: ['+55 47 99999-9999'],
			source: { fileId: 'file-1', fileName: 'clientes.vcf' }
		});
		const b = makeContact({
			name: 'B',
			phones: ['5547999999999'],
			source: { fileId: 'file-2', fileName: 'fornecedores.vcf' }
		});

		const { unique, duplicates } = deduplicateContacts([a, b]);

		expect(unique).toEqual([a]);
		expect(duplicates).toHaveLength(1);
		expect(duplicates[0].kept.source.fileName).toBe('clientes.vcf');
		expect(duplicates[0].removed.source.fileName).toBe('fornecedores.vcf');
	});

	it('matches when contacts share only one of multiple phones', () => {
		const a = makeContact({ name: 'A', phones: ['47999999999', '4733333333'] });
		const b = makeContact({ name: 'B', phones: ['4733333333'] });

		const { unique, duplicates } = deduplicateContacts([a, b]);

		expect(unique).toEqual([a]);
		expect(duplicates).toEqual([{ kept: a, removed: b, matchedPhone: '4733333333' }]);
	});

	it('never removes contacts without a phone', () => {
		const a = makeContact({ name: 'Sem telefone A' });
		const b = makeContact({ name: 'Sem telefone B' });

		const { unique, duplicates } = deduplicateContacts([a, b]);

		expect(unique).toEqual([a, b]);
		expect(duplicates).toEqual([]);
	});

	it('ignores phones that normalize to an empty string', () => {
		const a = makeContact({ name: 'A', phones: ['n/a'] });
		const b = makeContact({ name: 'B', phones: ['n/a'] });

		const { unique, duplicates } = deduplicateContacts([a, b]);

		expect(unique).toEqual([a, b]);
		expect(duplicates).toEqual([]);
	});

	it('removes a contact even when its other fields differ, as long as a phone matches', () => {
		const a = makeContact({ name: 'Nome A', organization: 'Empresa A', phones: ['47999999999'] });
		const b = makeContact({ name: 'Nome B completamente diferente', phones: ['47999999999'] });

		const { unique, duplicates } = deduplicateContacts([a, b]);

		expect(unique).toEqual([a]);
		expect(duplicates[0].removed.name).toBe('Nome B completamente diferente');
	});

	it('keeps the first occurrence when the same contact repeats across three files', () => {
		const a = makeContact({ name: 'A', phones: ['47999999999'] });
		const b = makeContact({ name: 'B', phones: ['47999999999'] });
		const c = makeContact({ name: 'C', phones: ['47999999999'] });

		const { unique, duplicates } = deduplicateContacts([a, b, c]);

		expect(unique).toEqual([a]);
		expect(duplicates).toEqual([
			{ kept: a, removed: b, matchedPhone: '47999999999' },
			{ kept: a, removed: c, matchedPhone: '47999999999' }
		]);
	});
});
