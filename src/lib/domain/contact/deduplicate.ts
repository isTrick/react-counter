import type { Contact } from './types';

export interface DuplicateContact {
	kept: Contact;
	removed: Contact;
	matchedPhone: string;
}

export interface DeduplicateResult {
	unique: Contact[];
	duplicates: DuplicateContact[];
}

/**
 * Deduplica contatos por telefone normalizado (spec, Etapa 6).
 *
 * Regras:
 * - dois contatos são duplicados quando compartilham ao menos um
 *   `Phone.normalized`;
 * - a primeira ocorrência é mantida, as seguintes são removidas — mas
 *   sempre registradas em `duplicates`, nunca descartadas silenciosamente;
 * - contatos sem telefone (ou só com telefones que normalizam para string
 *   vazia) nunca são removidos e nunca participam da comparação;
 * - não faz merge de dados entre duplicados — isso é "merge inteligente",
 *   explicitamente fora de escopo do MVP (spec, seção 20).
 *
 * O(n): um único passe usando `Map<telefone normalizado, contato mantido>`,
 * sem comparação contato-a-contato.
 */
export function deduplicateContacts(contacts: Contact[]): DeduplicateResult {
	const phoneIndex = new Map<string, Contact>();
	const unique: Contact[] = [];
	const duplicates: DuplicateContact[] = [];

	for (const contact of contacts) {
		const normalizedPhones = [
			...new Set(
				contact.phones
					.map((phone) => phone.normalized)
					.filter((normalized) => normalized.length > 0)
			)
		];

		if (normalizedPhones.length === 0) {
			unique.push(contact);
			continue;
		}

		const matchedPhone = normalizedPhones.find((phone) => phoneIndex.has(phone));
		const kept = matchedPhone ? phoneIndex.get(matchedPhone) : undefined;

		if (matchedPhone && kept) {
			duplicates.push({ kept, removed: contact, matchedPhone });
			continue;
		}

		for (const phone of normalizedPhones) phoneIndex.set(phone, contact);
		unique.push(contact);
	}

	return { unique, duplicates };
}
