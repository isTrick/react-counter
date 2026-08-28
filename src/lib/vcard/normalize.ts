import type VCard from 'vcf';
import type { Address, Contact, ContactSource, Email, Phone } from '$lib/domain/contact/types';
import { normalizePhone } from '$lib/domain/contact/normalize-phone';

/**
 * Converte um vCard já parseado (biblioteca `vcf`) para o modelo interno
 * `Contact`. Único ponto do projeto que traduz o formato da lib de parsing
 * para o domínio — o resto da aplicação não conhece `VCard`/`VCard.Property`.
 */
export function vcardToContact(card: VCard, source: ContactSource): Contact {
	const data = card.data;

	const fullName = valueOf(first(data.fn));
	const { firstName, middleName, lastName } = splitName(valueOf(first(data.n)));

	const phones: Phone[] = toArray(data.tel)
		.map((prop) => {
			const value = valueOf(prop);
			return value ? { value, normalized: normalizePhone(value), type: typeOf(prop) } : undefined;
		})
		.filter(isDefined);

	const emails: Email[] = toArray(data.email)
		.map((prop) => {
			const value = valueOf(prop);
			return value ? { value, type: typeOf(prop) } : undefined;
		})
		.filter(isDefined);

	const addresses: Address[] = toArray(data.adr)
		.map((prop) => {
			const value = valueOf(prop);
			return value ? { value, type: typeOf(prop) } : undefined;
		})
		.filter(isDefined);

	const websites = toArray(data.url).map(valueOf).filter(isDefined);

	return {
		id: crypto.randomUUID(),
		name: fullName ?? composeName(firstName, lastName),
		firstName,
		middleName,
		lastName,
		phones,
		emails,
		organization: valueOf(first(data.org)),
		jobTitle: valueOf(first(data.title)),
		addresses,
		birthday: valueOf(first(data.bday)),
		websites,
		notes: valueOf(first(data.note)),
		source
	};
}

type VcfPropertyValue = VCard.Property | VCard.Property[] | undefined;

/** Params dinâmicos (TYPE, GROUP, ...) não fazem parte do .d.ts oficial. */
type VcfPropertyWithParams = VCard.Property & {
	type?: string | string[];
};

function toArray(value: VcfPropertyValue): VCard.Property[] {
	if (value == null) return [];
	return Array.isArray(value) ? value : [value];
}

function first(value: VcfPropertyValue): VCard.Property | undefined {
	return toArray(value)[0];
}

/** Extrai o valor bruto de uma propriedade. NUNCA usar `${prop}`/String(prop)
 * diretamente: o `toString()` da lib formata a propriedade inteira como
 * linha VCF (nome + params), não só o valor. */
function valueOf(prop: VCard.Property | undefined): string | undefined {
	if (!prop) return undefined;
	const raw = prop.valueOf();
	const trimmed = typeof raw === 'string' ? raw.trim() : '';
	return trimmed.length > 0 ? trimmed : undefined;
}

function typeOf(prop: VCard.Property): string | undefined {
	const type = (prop as VcfPropertyWithParams).type;
	if (!type) return undefined;
	return Array.isArray(type) ? type.join(', ') : type;
}

/** Campo N: "Sobrenome;Nome;Nomes do meio;Prefixo;Sufixo" (RFC 6350 §6.2.2). */
function splitName(raw: string | undefined) {
	if (!raw) return { firstName: undefined, middleName: undefined, lastName: undefined };
	const [lastName, firstName, middleName] = raw.split(';').map((part) => part.trim() || undefined);
	return { firstName, middleName, lastName };
}

function composeName(firstName: string | undefined, lastName: string | undefined) {
	const composed = [firstName, lastName].filter(isDefined).join(' ');
	return composed.length > 0 ? composed : undefined;
}

function isDefined<T>(value: T | undefined): value is T {
	return value !== undefined;
}
