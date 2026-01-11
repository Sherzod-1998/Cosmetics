import cron from 'node-cron';
import { cleanupUploads } from '../utils/cleanupUploads';

// 🔁 Jadval bo‘yicha har kuni 03:00 da tozalash
cron.schedule('0 3 * * *', () => {
	console.log('🧹 Scheduled cleanup started...');
	cleanupUploads().catch(console.error);
});

// 🚀 Project start bo‘lgan zahoti 1 marta ishga tushirish
(async () => {
	console.log('🧹 Initial cleanup started...');
	await cleanupUploads().catch(console.error);
})();
