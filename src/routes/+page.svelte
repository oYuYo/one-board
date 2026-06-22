<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { db } from '$lib/db';

	let isLoading = $state(true);

	let title = $state('');
	let content = $state('');
	let timerId: ReturnType<typeof setInterval> | undefined = undefined;

	onMount(async () => {
		try {
			const savedBoard = await db.boards.get(1);
			if (savedBoard) {
				title = savedBoard.title;
				content = savedBoard.content;
			}
		} catch (error) {
			console.error('データの読み込みに失敗しました:', error);
		} finally {
			isLoading = false;
		}
		timerId = setInterval(saveBoard, 60000);
	});

	onDestroy(() => {
		if (timerId) {
			clearInterval(timerId);
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		//MacのCommandキー(metaKey)またはWindows/LinuxのCtrlキー(ctrlKey)が押されていて、かつ「S」キーの場合
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault(); //ブラウザ標準の「名前を付けて保存」を禁止
			saveBoard();
		}
	}

	async function saveBoard() {
		try {
			await db.boards.put({
				id: 1,
				title,
				content
			});
			console.log('データが保存されました');
		} catch (error) {
			console.error('データの保存に失敗しました:', error);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<h1>One Board</h1>
{#if isLoading}
	<p>Loading...</p>
{:else}
	<main class="word-container">
		<input type="text" bind:value={title} placeholder="無題のドキュメント" class="word-title" />

		<hr class="word-divider" />

		<textarea bind:value={content} placeholder="ここに入力..." class="word-body"> </textarea>
	</main>
{/if}

<style>
	:global(body) {
		background-color: #f3f3f3;
		margin: 0;
		font-family: sans-serif;
	}
	.word-container {
		background-color: #ffffff;
		max-width: 800px;
		min-height: 100vh;
		margin: 0 auto;
		padding: 40px 60px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
	}
	.word-title {
		font-size: 24px;
		font-weight: bold;
		border: none;
		outline: none;
		width: 100%;
		margin-bottom: 10px;
	}
	.word-divider {
		border: 0;
		border-top: 1px solid #e0e0e0;
		margin-bottom: 20px;
	}
	.word-body {
		flex: 1;
		font-size: 16px;
		line-height: 1.6;
		border: none;
		outline: none;
		resize: none;
		width: 100%;
	}
	h1 {
		text-align: center;
		margin-top: 20px;
	}
</style>
