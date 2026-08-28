/**
 * Modelo interno de contato.
 *
 * Dados provenientes do VCF nunca devem ser usados diretamente pela
 * interface ou pelo exportador — todo vCard deve ser convertido para
 * esta representação normalizada antes de seguir no fluxo.
 */
export interface Contact {
	id: string;

	name?: string;
	firstName?: string;
	middleName?: string;
	lastName?: string;

	phones: Phone[];
	emails: Email[];

	organization?: string;
	jobTitle?: string;

	addresses: Address[];

	birthday?: string;
	websites: string[];
	notes?: string;

	source: ContactSource;
}

export interface Phone {
	value: string;
	normalized: string;
	type?: string;
}

export interface Email {
	value: string;
	type?: string;
}

export interface Address {
	value: string;
	type?: string;
}

/**
 * Identifica o arquivo VCF de origem de um contato.
 * Deve ser preservado mesmo após deduplicação/exportação.
 */
export interface ContactSource {
	fileId: string;
	fileName: string;
}
