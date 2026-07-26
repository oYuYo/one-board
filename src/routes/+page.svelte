<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { db } from '$lib/db';

	let activeTab = $state<'text' | 'canvas'>('text');
	let isLoading = $state(true);
	
	let title = $state('');
	let content = $state('');
	let timerId: ReturnType<typeof setInterval> | undefined = undefined;

	let canvas = $state<HTMLCanvasElement | null>(null);
	let ctx : CanvasRenderingContext2D | null = null;
	let isDrawing = false;

	onMount(async () => {
		try {
			const savedMemo = await db.memos.get(1);
			if (savedMemo) {
				title = savedMemo.title;
				content = savedMemo.content;
			}
			timerId = setInterval(saveMemo, 60000);
		} catch (error) {
			console.error('データの読み込みに失敗しました:', error);
		} finally {
			isLoading = false;
		}
	});

	onDestroy(() => {
		if (timerId !== undefined) {
			clearInterval(timerId);
		}
	});

	$effect(() => {
		if (activeTab === 'canvas' && canvas){
			ctx = canvas.getContext('2d');
			if (ctx){
				ctx.strokeStyle = '#000000';
				ctx.lineWidth = 3;
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
			}
			db.drawings.get(1).then((savedCanvas) => {
				if (savedCanvas && savedCanvas.canvasData && ctx) {
					const img = new Image();
					img.src = savedCanvas.canvasData;
					img.onload = () => ctx?.drawImage(img, 0, 0);
				}
			});
		}
	});


	function handleKeydown(event: KeyboardEvent) {
		//MacのCommandキー(metaKey)またはWindows/LinuxのCtrlキー(ctrlKey)が押されていて、かつ「S」キーの場合
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault(); //ブラウザ標準の「名前を付けて保存」を禁止
			saveMemo();
		}
	}

	async function saveMemo() {
		try {
			await db.memos.put({
				id: 1,
				title,
				content
			});
			console.log('データが保存されました');
		} catch (error) {
			console.error('データの保存に失敗しました:', error);
		}
	}

	function startDrawing(e: MouseEvent | TouchEvent) {
		isDrawing = true;
		draw(e);
	}

	function stopDrawing(){
		if (isDrawing){
			isDrawing = false;
			ctx?.beginPath();
			saveCanvasData();
		}
	}

	function draw(e: MouseEvent | TouchEvent){
		if (!isDrawing || !canvas || !ctx) return;

		let clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		let clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		const rect = canvas.getBoundingClientRect();
		const x = clientX - rect.left;
		const y = clientY - rect.top;

		ctx.lineTo(x, y);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x, y);
	}

	async function saveCanvasData(){
		if (!canvas) return;

		try {
			const dataUrl = canvas.toDataURL();
			await db.drawings.put({
				id: 1,
				canvasData: dataUrl
			});
			console.log('キャンバスデータが保存されました');
		} catch (error) {
			console.error('キャンバスデータの保存に失敗しました:', error);
		}
	}

	async function clearCanvas(){
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		await db.drawings.put({
			id: 1,
			canvasData: ''
		});
		console.log('キャンバスをクリアしました');
	}

</script>

<svelte:window onkeydown={handleKeydown} />

<h1>One Board</h1>
{#if isLoading}
	<p>Loading...</p>
{:else}
	<nav class="tab-bar">
		<button onclick={() => activeTab = 'text'} class='tab-btn' class:active={activeTab === 'text'}>テキストメモ</button>
		<button onclick={() => activeTab = 'canvas'} class='tab-btn' class:active={activeTab === 'canvas'}>お絵描きボード</button>
	</nav>

	{#if activeTab === 'text'}
		<main class='word-container'>
			<input type='text' bind:value={title} placeholder='無題のドキュメント' class='word-title' />
			<hr class='word-divider' />
			<textarea bind:value={content} placeholder='ここにメモを入力...' class='word-body'></textarea>
		</main>
	{:else}
		<main class='canvas-container'>
			<div class='toolbar'>
				<button onclick={clearCanvas} class='clear-btn'>クリア</button>
			</div>
			<canvas bind:this={canvas} width=800 height=600
				onmousedown={startDrawing}
				onmouseup={stopDrawing}
				onmouseleave={stopDrawing}
				onmousemove={draw}
				ontouchstart={startDrawing}
				ontouchend={stopDrawing}
				ontouchmove={draw}
				class='drawing-canvas'></canvas>
		</main>
	{/if}
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
	.canvas-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px; 
	}
	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 800px;
		margin-bottom: 10px;
	}
	.clear-btn {
		background-color: #ff4d4d;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
	}
	.drawing-canvas 
	{
		background-color: #ffffff;
		border: 1px solid #ccc;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		border-radius: 4px;
		cursor: crosshair;
		touch-action: none;
	}
	nav.tab-bar {
		display: flex;
		justify-content: center;
		margin-bottom: 20px;
	}
	button.tab-btn {
		background-color: #4d4dff;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		margin-right: 20px;
	}
</style>
