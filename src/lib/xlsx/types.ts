/** Como os contatos são distribuídos entre planilhas/arquivos (spec, Etapa 10). */
export type ExportMode =
	/** Modo A: todos os contatos únicos consolidados em uma única sheet. */
	| 'single-sheet'
	/** Modo B: um workbook, uma worksheet por arquivo VCF de origem. */
	| 'sheet-per-file'
	/** Modo C: um XLSX por arquivo VCF de origem (agrupados em .zip se houver mais de um). */
	| 'workbook-per-file';

/** Campos de valor único por contato. */
export type SingleValueField = 'name' | 'organization' | 'jobTitle' | 'birthday' | 'notes';

/** Campos que podem ter múltiplos valores (viram colunas numeradas: "Telefone 1", "Telefone 2", ...). */
export type MultiValueField = 'phones' | 'emails' | 'addresses' | 'websites';

export type ContactField = SingleValueField | MultiValueField;

/** Seleção padrão até a Etapa 8 (ColumnSelector) existir na interface. */
export const ALL_CONTACT_FIELDS: ContactField[] = [
	'name',
	'phones',
	'emails',
	'organization',
	'jobTitle',
	'addresses',
	'birthday',
	'websites',
	'notes'
];
