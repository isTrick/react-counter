import type { Contact } from '$lib/domain/contact/types';
import type { ContactField, MultiValueField, SingleValueField } from './types';

export interface ContactRows {
	headers: string[];
	rows: string[][];
}

const SINGLE_VALUE_LABELS: Record<SingleValueField, string> = {
	name: 'Nome',
	organization: 'Empresa',
	jobTitle: 'Cargo',
	birthday: 'Aniversário',
	notes: 'Observações'
};

const MULTI_VALUE_LABELS: Record<MultiValueField, string> = {
	phones: 'Telefone',
	emails: 'Email',
	addresses: 'Endereço',
	websites: 'Website'
};

const MULTI_VALUE_FIELDS: readonly MultiValueField[] = [
	'phones',
	'emails',
	'addresses',
	'websites'
];

function isMultiValueField(field: ContactField): field is MultiValueField {
	return (MULTI_VALUE_FIELDS as readonly ContactField[]).includes(field);
}

function singleValue(contact: Contact, field: SingleValueField): string {
	return contact[field] ?? '';
}

function multiValues(contact: Contact, field: MultiValueField): string[] {
	switch (field) {
		case 'phones':
			return contact.phones.map((phone) => phone.value);
		case 'emails':
			return contact.emails.map((email) => email.value);
		case 'addresses':
			return contact.addresses.map((address) => address.value);
		case 'websites':
			return contact.websites;
	}
}

interface Column {
	label: string;
	get: (contact: Contact) => string;
}

/**
 * Converte contatos em linhas de planilha (spec, Etapa 11: "Criar conversor
 * Contact -> Row"). Responsabilidade única: nenhum parsing de VCF,
 * deduplicação ou normalização de telefone acontece aqui.
 *
 * - Campos multi-valor viram colunas numeradas ("Telefone 1", "Telefone 2",
 *   ...), na quantidade do contato com mais valores entre os exportados
 *   (spec, Etapa 8).
 * - Colunas sem nenhum valor preenchido em nenhum contato são descartadas
 *   ("não gerar colunas completamente vazias", spec, Etapa 8).
 * - Todo valor retornado é string — quem grava o XLSX (exporter.ts) nunca
 *   recebe um número, então nunca corre o risco de reformatar telefone
 *   como número (spec, Etapa 11: "telefones como texto").
 */
export function contactsToRows(contacts: Contact[], fields: ContactField[]): ContactRows {
	const columns: Column[] = fields.flatMap((field): Column[] => {
		if (isMultiValueField(field)) {
			const count = contacts.reduce(
				(max, contact) => Math.max(max, multiValues(contact, field).length),
				0
			);
			return Array.from({ length: count }, (_, index) => ({
				label: `${MULTI_VALUE_LABELS[field]} ${index + 1}`,
				get: (contact: Contact) => multiValues(contact, field)[index] ?? ''
			}));
		}
		return [
			{ label: SINGLE_VALUE_LABELS[field], get: (contact: Contact) => singleValue(contact, field) }
		];
	});

	const nonEmptyColumns = columns.filter((column) =>
		contacts.some((contact) => column.get(contact) !== '')
	);

	return {
		headers: nonEmptyColumns.map((column) => column.label),
		rows: contacts.map((contact) => nonEmptyColumns.map((column) => column.get(contact)))
	};
}
