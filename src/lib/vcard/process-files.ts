import { deduplicateContacts, type DuplicateContact } from '$lib/domain/contact/deduplicate';
import type { Contact } from '$lib/domain/contact/types';
import { parseVcfFile, type VcfParseError } from './parser';

/**
 * Arquivo já lido (texto puro). Ler o `File` (I/O do browser) é
 * responsabilidade de quem chama `processFiles` — esta função não toca em
 * APIs de DOM/File, só em strings, para poder rodar sem alteração dentro de
 * um Web Worker mais adiante (spec, Etapa 12).
 */
export interface FileInput {
	id: string;
	name: string;
	text: string;
}

export interface CardParseError extends VcfParseError {
	fileId: string;
	fileName: string;
}

export interface ProcessFilesResult {
	/** Contatos únicos, após deduplicação. */
	contacts: Contact[];
	duplicates: DuplicateContact[];
	/** vCards individuais que falharam ao parsear, sem derrubar o arquivo. */
	cardErrors: CardParseError[];
	/** Arquivos que não continham nenhum vCard válido. */
	filesWithNoContacts: string[];
	filesProcessed: number;
	totalContactsFound: number;
}

/**
 * Pipeline completo: VCF (texto) -> vCards -> Contact[] -> deduplicação.
 * (spec, fluxo principal / Etapa 7).
 */
export function processFiles(files: FileInput[]): ProcessFilesResult {
	const allContacts: Contact[] = [];
	const cardErrors: CardParseError[] = [];
	const filesWithNoContacts: string[] = [];

	for (const file of files) {
		const { contacts, errors } = parseVcfFile({ fileId: file.id, fileName: file.name }, file.text);

		for (const error of errors) {
			cardErrors.push({ ...error, fileId: file.id, fileName: file.name });
		}

		if (contacts.length === 0) filesWithNoContacts.push(file.name);

		allContacts.push(...contacts);
	}

	const { unique, duplicates } = deduplicateContacts(allContacts);

	return {
		contacts: unique,
		duplicates,
		cardErrors,
		filesWithNoContacts,
		filesProcessed: files.length,
		totalContactsFound: allContacts.length
	};
}
