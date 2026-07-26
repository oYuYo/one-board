import Dexie from 'dexie';

export const db = new Dexie('OneboardDB');

db.version(2).stores({
	memos: '++id, title, content',
	drawings: '++id, canvasData'
});
