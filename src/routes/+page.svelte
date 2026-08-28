<script lang="ts">
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import DuplicateList from '$lib/components/DuplicateList.svelte';
	import ProcessingSummary from '$lib/components/ProcessingSummary.svelte';
	import { processFiles, type FileInput, type ProcessFilesResult } from '$lib/vcard/process-files';
	import { buildExport, downloadBlob } from '$lib/xlsx/exporter';
	import { ALL_CONTACT_FIELDS } from '$lib/xlsx/types';

	interface SelectedFile {
		id: string;
		file: File;
	}

	interface FileReadError {
		name: string;
		message: string;
	}

	type RejectionReason = 'invalid-extension' | 'empty-file';

	interface RejectedFile {
		name: string;
		reason: RejectionReason;
	}

	const REJECTION_LABELS: Record<RejectionReason, string> = {
		'invalid-extension': 'extensão inválida (somente .vcf é aceito)',
		'empty-file': 'arquivo vazio'
	};

	let selectedFiles = $state<SelectedFile[]>([]);
	let rejectedFiles = $state<RejectedFile[]>([]);
	let fileInput = $state<HTMLInputElement>();

	let processing = $state(false);
	let result = $state<ProcessFilesResult | null>(null);
	let readErrors = $state<FileReadError[]>([]);
	let showDuplicates = $state(false);
	let exporting = $state(false);

	// Um arquivo inválido não impede o processamento dos demais: cada
	// arquivo é aceito/rejeitado de forma independente.
	let duplicateFileNames = $derived.by(() => {
		const names = selectedFiles.map(({ file }) => file.name);
		const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
		return [...new Set(duplicates)];
	});

	function isVcfFile(file: File) {
		return file.name.toLowerCase().endsWith('.vcf');
	}

	function addFiles(fileList: FileList | null) {
		if (!fileList) return;

		const accepted: SelectedFile[] = [];
		const newlyRejected: RejectedFile[] = [];

		for (const file of Array.from(fileList)) {
			if (!isVcfFile(file)) {
				newlyRejected.push({ name: file.name, reason: 'invalid-extension' });
				continue;
			}
			if (file.size === 0) {
				newlyRejected.push({ name: file.name, reason: 'empty-file' });
				continue;
			}
			accepted.push({ id: crypto.randomUUID(), file });
		}

		// Nomes duplicados não são bloqueados aqui: cada arquivo já tem um
		// id próprio (independente do nome) e o aviso abaixo torna o usuário
		// ciente sem descartar nada silenciosamente.
		selectedFiles = [...selectedFiles, ...accepted];
		rejectedFiles = [...rejectedFiles, ...newlyRejected];
		clearResult();

		if (fileInput) fileInput.value = '';
	}

	function removeFile(id: string) {
		selectedFiles = selectedFiles.filter((selectedFile) => selectedFile.id !== id);
		clearResult();
	}

	function clearResult() {
		result = null;
		readErrors = [];
		showDuplicates = false;
	}

	type ReadOutcome = { ok: true; input: FileInput } | ({ ok: false } & FileReadError);

	function isOk(outcome: ReadOutcome): outcome is { ok: true; input: FileInput } {
		return outcome.ok;
	}

	async function readFile({ id, file }: SelectedFile): Promise<ReadOutcome> {
		try {
			const text = await file.text();
			return { ok: true, input: { id, name: file.name, text } };
		} catch (error) {
			return {
				ok: false,
				name: file.name,
				message: error instanceof Error ? error.message : String(error)
			};
		}
	}

	async function handleProcess() {
		if (selectedFiles.length === 0 || processing) return;

		processing = true;
		clearResult();

		// Promise.all preserva a correspondência de índice com selectedFiles
		// mesmo que as leituras terminem fora de ordem — importante porque a
		// deduplicação depende da ordem em que os contatos chegam (primeira
		// ocorrência é a mantida).
		const settled = await Promise.all(selectedFiles.map(readFile));

		const inputs: FileInput[] = [];
		const failures: FileReadError[] = [];
		for (const entry of settled) {
			if (isOk(entry)) inputs.push(entry.input);
			else failures.push(entry);
		}

		readErrors = failures;
		result = processFiles(inputs);
		processing = false;
	}

	// Sem seletor de colunas/modo ainda (Etapas 8-10): exporta todos os
	// campos consolidados em uma única sheet até essa UI existir.
	async function handleExport() {
		if (!result || result.contacts.length === 0 || exporting) return;

		exporting = true;
		try {
			const exportResult = await buildExport(result.contacts, ALL_CONTACT_FIELDS, 'single-sheet');
			downloadBlob(exportResult);
		} finally {
			exporting = false;
		}
	}

	function dismissRejected() {
		rejectedFiles = [];
	}

	function formatFileSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<svelte:head>
	<title>VCF to XLSX Converter</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-zinc-950 text-white">
	<header
		class="m-1 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4"
	>
		<h1 class="text-lg font-semibold tracking-tight">VCF to XLSX Converter</h1>
		<a
			href="https://github.com/trickgirardi/web-vcf-2-xlsx"
			aria-label="Star trickgirardi/web-vcf-2-xlsx on GitHub"
			class="rounded-md p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
		>
			<SiGithub size={20} />
		</a>
	</header>

	<main
		class="m-1 flex flex-1 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-6 sm:p-10"
	>
		<div class="w-full max-w-2xl space-y-8">
			<section class="space-y-3 text-center">
				<p class="text-sm font-medium text-emerald-400">Processamento 100% local</p>
				<h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Converta VCF para XLSX</h2>
				<p class="mx-auto max-w-xl leading-7 text-balance text-zinc-400">
					Importe um ou mais arquivos VCF. Seus contatos permanecem no navegador durante todo
					processo.
				</p>
			</section>

			<section aria-labelledby="upload-title" class="space-y-4">
				<div class="flex items-baseline justify-between">
					<h3 id="upload-title" class="font-semibold">Importar arquivos</h3>
					<p class="text-sm text-zinc-400">Somente .vcf</p>
				</div>

				<div class="rounded-lg border border-dashed border-zinc-600 bg-zinc-950/40 p-8 text-center">
					<p class="font-medium">Selecione seus arquivos VCF</p>
					<p class="mt-2 text-sm text-zinc-400">Você pode adicionar vários arquivos de uma vez.</p>

					<input
						bind:this={fileInput}
						id="vcf-files"
						type="file"
						accept=".vcf,text/vcard"
						multiple
						class="sr-only"
						onchange={(event) => addFiles(event.currentTarget.files)}
					/>
					<label
						for="vcf-files"
						class="mt-5 inline-flex cursor-pointer rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
					>
						Selecionar arquivos VCF
					</label>
				</div>

				{#if rejectedFiles.length > 0}
					<div
						class="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
					>
						<div class="flex items-start justify-between gap-4">
							<p class="font-medium">Arquivos ignorados</p>
							<button
								type="button"
								class="shrink-0 text-xs font-medium underline underline-offset-4 hover:text-amber-100"
								onclick={dismissRejected}
							>
								Limpar
							</button>
						</div>
						<ul class="space-y-0.5">
							{#each rejectedFiles as rejected (rejected.name + rejected.reason)}
								<li>{rejected.name} — {REJECTION_LABELS[rejected.reason]}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if duplicateFileNames.length > 0}
					<p
						class="rounded-md border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200"
					>
						Nomes de arquivo duplicados: {duplicateFileNames.join(', ')}. Todos serão processados
						normalmente, mas confira se não é o mesmo arquivo selecionado por engano.
					</p>
				{/if}

				{#if selectedFiles.length === 0}
					<p class="text-center text-sm text-zinc-400">Nenhum arquivo selecionado.</p>
				{:else}
					<div class="space-y-2">
						<p class="text-sm font-medium">
							{selectedFiles.length}
							{selectedFiles.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
						</p>
						<ul class="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-800">
							{#each selectedFiles as selectedFile (selectedFile.id)}
								<li class="flex items-center justify-between gap-4 px-4 py-3">
									<div class="min-w-0">
										<p class="truncate font-medium">{selectedFile.file.name}</p>
										<p class="text-sm text-zinc-400">{formatFileSize(selectedFile.file.size)}</p>
									</div>
									<button
										type="button"
										class="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
										onclick={() => removeFile(selectedFile.id)}
									>
										Remover
									</button>
								</li>
							{/each}
						</ul>
					</div>

					<button
						type="button"
						class="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={processing}
						onclick={handleProcess}
					>
						{processing ? 'Processando…' : 'Processar arquivos'}
					</button>
				{/if}
			</section>

			{#if readErrors.length > 0}
				<p class="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
					Não foi possível ler {readErrors.length === 1 ? 'o arquivo' : 'os arquivos'}: {readErrors
						.map((error) => error.name)
						.join(', ')}.
					{readErrors.length === 1 ? 'Os demais foram' : 'Os demais arquivos foram'} processados normalmente.
				</p>
			{/if}

			{#if result}
				<section aria-labelledby="summary-title" class="space-y-4 border-t border-zinc-800 pt-6">
					<h3 id="summary-title" class="font-semibold">Resumo do processamento</h3>

					<ProcessingSummary
						filesProcessed={result.filesProcessed}
						totalContactsFound={result.totalContactsFound}
						uniqueContactsCount={result.contacts.length}
						duplicatesRemovedCount={result.duplicates.length}
						filesWithErrorsCount={result.filesWithNoContacts.length + readErrors.length}
					/>

					{#if result.filesWithNoContacts.length > 0}
						<p
							class="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
						>
							Nenhum vCard válido encontrado em: {result.filesWithNoContacts.join(', ')}.
						</p>
					{/if}

					{#if result.cardErrors.length > 0}
						<p
							class="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
						>
							{result.cardErrors.length}
							{result.cardErrors.length === 1
								? 'contato inválido foi ignorado'
								: 'contatos inválidos foram ignorados'}
							dentro de arquivos processados com sucesso.
						</p>
					{/if}

					{#if result.duplicates.length > 0}
						<div>
							<button
								type="button"
								class="text-sm font-medium text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
								onclick={() => (showDuplicates = !showDuplicates)}
							>
								{showDuplicates
									? 'Ocultar duplicatas'
									: `Ver duplicatas (${result.duplicates.length})`}
							</button>

							{#if showDuplicates}
								<div class="mt-3">
									<DuplicateList duplicates={result.duplicates} />
								</div>
							{/if}
						</div>
					{/if}

					<button
						type="button"
						class="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={exporting || result.contacts.length === 0}
						onclick={handleExport}
					>
						{exporting ? 'Gerando XLSX…' : 'Baixar XLSX'}
					</button>
					<p class="text-center text-xs text-zinc-500">
						Exporta todos os campos em uma única planilha. Seleção de colunas e modos de exportação
						chegam nas próximas etapas.
					</p>
				</section>
			{/if}

			<ol class="grid gap-3 border-t border-zinc-800 pt-6 text-sm text-zinc-400 sm:grid-cols-3">
				<li><span class="mr-2 font-semibold text-zinc-200">1.</span>Importar arquivos</li>
				<li><span class="mr-2 font-semibold text-zinc-200">2.</span>Revisar duplicatas</li>
				<li><span class="mr-2 font-semibold text-zinc-200">3.</span>Exportar XLSX</li>
			</ol>
		</div>
	</main>

	<footer
		class="m-1 flex flex-col items-center justify-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400"
	>
		<p>
			Made with Svelte by <a
				href="https://github.com/trickgirardi"
				target="_blank"
				rel="noopener noreferrer"
				class="text-zinc-200 underline underline-offset-4 hover:text-white">trickgirardi</a
			>
		</p>
		<p>License: MIT</p>
	</footer>
</div>
