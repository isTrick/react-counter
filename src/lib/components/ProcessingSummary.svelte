<script lang="ts">
	let {
		filesProcessed,
		totalContactsFound,
		uniqueContactsCount,
		duplicatesRemovedCount,
		filesWithErrorsCount
	}: {
		filesProcessed: number;
		totalContactsFound: number;
		uniqueContactsCount: number;
		duplicatesRemovedCount: number;
		filesWithErrorsCount: number;
	} = $props();

	const numberFormat = new Intl.NumberFormat('pt-BR');

	const stats = $derived([
		{
			label: filesProcessed === 1 ? 'arquivo processado' : 'arquivos processados',
			value: filesProcessed
		},
		{ label: 'contatos encontrados', value: totalContactsFound },
		{ label: 'contatos únicos', value: uniqueContactsCount },
		{ label: 'duplicados removidos', value: duplicatesRemovedCount }
	]);
</script>

<div class="space-y-3">
	<dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		{#each stats as stat (stat.label)}
			<div class="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-center">
				<dd class="text-2xl font-bold tracking-tight">{numberFormat.format(stat.value)}</dd>
				<dt class="mt-1 text-xs text-zinc-400">{stat.label}</dt>
			</div>
		{/each}
	</dl>

	{#if filesWithErrorsCount > 0}
		<p
			class="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
		>
			{filesWithErrorsCount}
			{filesWithErrorsCount === 1 ? 'arquivo apresentou erro' : 'arquivos apresentaram erro'} e não
			{filesWithErrorsCount === 1 ? 'foi incluído' : 'foram incluídos'} no resultado.
		</p>
	{/if}
</div>
