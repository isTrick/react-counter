import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ContactSource } from '$lib/domain/contact/types';
import { parseVcfFile } from './parser';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');

function readFixture(name: string) {
	return readFileSync(join(fixturesDir, name), 'utf-8');
}

function sourceFor(fileName: string): ContactSource {
	return { fileId: 'file-1', fileName };
}

describe('parseVcfFile', () => {
	it('parses vCard 2.1, including bare TYPE params without "TYPE="', () => {
		const source = sourceFor('v21.vcf');
		const { contacts, errors } = parseVcfFile(source, readFixture('v21.vcf'));

		expect(errors).toEqual([]);
		expect(contacts).toHaveLength(1);

		const [contact] = contacts;
		expect(contact.name).toBe('João Silva');
		expect(contact.firstName).toBe('João');
		expect(contact.lastName).toBe('Silva');
		expect(contact.organization).toBe('Acme Ltda');
		expect(contact.source).toEqual(source);

		expect(contact.phones).toHaveLength(2);
		expect(contact.phones[0]).toEqual({
			value: '+55 47 99999-9999',
			normalized: '5547999999999',
			type: 'home, cell'
		});
		expect(contact.phones[1].type).toBe('work');

		expect(contact.emails).toEqual([{ value: 'joao@example.com', type: 'home' }]);
	});

	it('parses vCard 3.0, including TYPE=... params and BDAY', () => {
		const { contacts, errors } = parseVcfFile(sourceFor('v30.vcf'), readFixture('v30.vcf'));

		expect(errors).toEqual([]);
		expect(contacts).toHaveLength(1);

		const [contact] = contacts;
		expect(contact.name).toBe('Maria Souza');
		expect(contact.jobTitle).toBe('Gerente');
		expect(contact.birthday).toBe('1990-05-10');
		expect(contact.phones[0].normalized).toBe('5521988887777');
		expect(contact.emails[0]).toEqual({ value: 'maria@example.com', type: 'internet' });
	});

	it('parses vCard 4.0, including multiple TEL with multi-value TYPE and URL', () => {
		const { contacts, errors } = parseVcfFile(sourceFor('v40.vcf'), readFixture('v40.vcf'));

		expect(errors).toEqual([]);
		expect(contacts).toHaveLength(1);

		const [contact] = contacts;
		expect(contact.name).toBe('Forrest Gump');
		expect(contact.phones).toHaveLength(2);
		expect(contact.phones[0].type).toBe('work, voice');
		expect(contact.phones[0].normalized).toBe('11115551212');
		expect(contact.websites).toEqual(['https://example.com/forrest']);
	});

	it('parses multiple contacts per file, unfolds long lines and preserves Unicode', () => {
		const { contacts, errors } = parseVcfFile(sourceFor('multi.vcf'), readFixture('multi.vcf'));

		expect(errors).toEqual([]);
		expect(contacts).toHaveLength(2);

		const [francois, tanaka] = contacts;

		expect(francois.name).toBe('François Müller');
		expect(francois.phones).toHaveLength(2);
		expect(francois.emails).toHaveLength(2);
		expect(francois.notes).toBe(
			'Uma nota bem longa que precisa ser dobrada em múltiplas linhas para testar o unfolding corretamente segundo a RFC 5322.'
		);

		expect(tanaka.name).toBe('田中 太郎 😀');
		expect(tanaka.phones[0].normalized).toBe('81312345678');
	});

	it('keeps processing remaining vCards when one card in the file is malformed', () => {
		const { contacts, errors } = parseVcfFile(
			sourceFor('partial-invalid.vcf'),
			readFixture('partial-invalid.vcf')
		);

		expect(errors).toHaveLength(1);
		expect(errors[0].index).toBe(0);
		expect(errors[0].message).toMatch(/END:VCARD/);

		expect(contacts).toHaveLength(1);
		expect(contacts[0].name).toBe('Ana Costa');
	});

	it('ignores unknown/unused properties without failing the contact', () => {
		const text = [
			'BEGIN:VCARD',
			'VERSION:3.0',
			'FN:Contato Genérico',
			'X-CUSTOM-FIELD:algo que não mapeamos',
			'END:VCARD'
		].join('\r\n');

		const { contacts, errors } = parseVcfFile(sourceFor('inline.vcf'), text);

		expect(errors).toEqual([]);
		expect(contacts).toHaveLength(1);
		expect(contacts[0].name).toBe('Contato Genérico');
		expect(contacts[0].phones).toEqual([]);
	});
});
