<script lang="ts">
	import type { DuplicateContact } from '$lib/domain/contact/deduplicate';

	let { duplicates }: { duplicates: DuplicateContact[] } = $props();

	function displayName(duplicate: DuplicateContact['kept']) {
		return duplicate.name?.trim() || '(sem nome)';
	}
</script>

<div class="overflow-x-auto rounded-lg border border-zinc-800">
	<table class="w-full text-left text-sm">
		<thead class="bg-zinc-900 text-xs tracking-wide text-zinc-400 uppercase">
			<tr>
				<th scope="col" class="px-4 py-2 font-medium">Mantido</th>
				<th scope="col" class="px-4 py-2 font-medium">Removido</th>
				<th scope="col" class="px-4 py-2 font-medium">Telefone correspondente</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-800">
			{#each duplicates as duplicate (duplicate.removed.id)}
				<tr>
					<td class="px-4 py-2">
						<p class="font-medium">{displayName(duplicate.kept)}</p>
						<p class="text-xs text-zinc-400">{duplicate.kept.source.fileName}</p>
					</td>
					<td class="px-4 py-2">
						<p class="font-medium">{displayName(duplicate.removed)}</p>
						<p class="text-xs text-zinc-400">{duplicate.removed.source.fileName}</p>
					</td>
					<td class="px-4 py-2 whitespace-nowrap">{duplicate.matchedPhone}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
