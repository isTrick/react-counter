<script lang="ts">
	import { SiGithub } from '@icons-pack/svelte-simple-icons';

	interface SelectedFile {
		id: string;
		file: File;
	}

	let selectedFiles = $state<SelectedFile[]>([]);
	let rejectedFiles = $state<string[]>([]);
	let fileInput = $state<HTMLInputElement>();

	function isVcfFile(file: File) {
		return file.name.toLowerCase().endsWith('.vcf');
	}

	function addFiles(fileList: FileList | null) {
		if (!fileList) return;

		const newFiles = Array.from(fileList);
		const validFiles = newFiles.filter(isVcfFile);
		const invalidFiles = newFiles.filter((file) => !isVcfFile(file));

		selectedFiles = [
			...selectedFiles,
			...validFiles.map((file) => ({ id: crypto.randomUUID(), file }))
		];
		rejectedFiles = invalidFiles.map((file) => file.name);

		if (fileInput) fileInput.value = '';
	}

	function removeFile(id: string) {
		selectedFiles = selectedFiles.filter((selectedFile) => selectedFile.id !== id);
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
					<p
						class="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
					>
						Arquivos ignorados: {rejectedFiles.join(', ')}. Selecione apenas arquivos .vcf.
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
				{/if}
			</section>

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
