/**
 * Normaliza um telefone para fins de comparação/deduplicação (Etapa 5).
 *
 * Versão conservadora: remove tudo que não for dígito. Não infere nem
 * adiciona código de país — "47999999999" e "5547999999999" permanecem
 * diferentes propositalmente, para evitar inferência incorreta de país
 * ou região.
 *
 * O valor original do telefone nunca é descartado: esta função só produz
 * a chave normalizada, guardada separadamente em `Phone.normalized`.
 */
export function normalizePhone(rawPhone: string): string {
	return rawPhone.replace(/\D+/g, '');
}
