import Dexie from 'dexie';

export const db = new Dexie('OneboardDB');

db.version(1).stores({
	boards: '++id, title, content'
});
