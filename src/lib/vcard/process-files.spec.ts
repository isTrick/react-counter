import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { processFiles } from './process-files';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');

function readFixture(name: string) {
	return readFileSync(join(fixturesDir, name), 'utf-8');
}

describe('processFiles', () => {
	it('aggregates contacts from multiple files and deduplicates across them', () => {
		const result = processFiles([
			{ id: 'file-1', name: 'v21.vcf', text: readFixture('v21.vcf') },
			{ id: 'file-2', name: 'v30.vcf', text: readFixture('v30.vcf') },
			{ id: 'file-3', name: 'v21-repetido.vcf', text: readFixture('v21.vcf') }
		]);

		expect(result.filesProcessed).toBe(3);
		expect(result.totalContactsFound).toBe(3);
		expect(result.contacts).toHaveLength(2);
		expect(result.duplicates).toHaveLength(1);
		expect(result.duplicates[0].kept.source.fileName).toBe('v21.vcf');
		expect(result.duplicates[0].removed.source.fileName).toBe('v21-repetido.vcf');
		expect(result.filesWithNoContacts).toEqual([]);
		expect(result.cardErrors).toEqual([]);
	});

	it('reports files with no valid vCard and keeps processing the rest', () => {
		const result = processFiles([
			{ id: 'file-1', name: 'vazio.vcf', text: 'isto não é um vCard' },
			{ id: 'file-2', name: 'v40.vcf', text: readFixture('v40.vcf') }
		]);

		expect(result.filesWithNoContacts).toEqual(['vazio.vcf']);
		expect(result.contacts).toHaveLength(1);
		expect(result.contacts[0].name).toBe('Forrest Gump');
	});

	it('records malformed vCards with their originating file, without dropping valid ones', () => {
		const result = processFiles([
			{ id: 'file-1', name: 'partial-invalid.vcf', text: readFixture('partial-invalid.vcf') }
		]);

		expect(result.cardErrors).toHaveLength(1);
		expect(result.cardErrors[0]).toMatchObject({
			fileId: 'file-1',
			fileName: 'partial-invalid.vcf'
		});
		expect(result.contacts).toHaveLength(1);
		expect(result.contacts[0].name).toBe('Ana Costa');
	});
});
