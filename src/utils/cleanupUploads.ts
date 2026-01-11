import fs from 'fs';
import path from 'path';
import Member from '../schema/Member.model';
import Product from '../schema/Product.model';

// uploads papkasi project rootda bo‘lsa, shu yo‘lni oling
const ROOT_DIR = path.join(__dirname, '../../'); // 1 qadam yuqoriga chiqib project rootga yetamiz
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

interface FolderConfig {
	dir: string;
	model: any;
	field: string;
	isArray?: boolean;
}

export async function cleanupUploads(): Promise<void> {
	const folders: FolderConfig[] = [
		{ dir: path.join(UPLOADS_DIR, 'members'), model: Member, field: 'memberImage', isArray: false },
		{ dir: path.join(UPLOADS_DIR, 'products'), model: Product, field: 'productImages', isArray: true },
	];

	for (const folder of folders) {
		try {
			if (!fs.existsSync(folder.dir)) {
				console.warn(`⚠️ Folder not found: ${folder.dir}`);
				continue;
			}

			const files = fs.readdirSync(folder.dir);
			const docs = await folder.model.find({}, folder.field).lean();

			let dbFiles: string[] = [];

			for (const doc of docs) {
				const val = doc[folder.field];
				if (folder.isArray && Array.isArray(val)) {
					dbFiles.push(...val.map((v: string) => path.basename(v)));
				} else if (typeof val === 'string' && val.length > 0) {
					dbFiles.push(path.basename(val));
				}
			}

			dbFiles = Array.from(new Set(dbFiles));

			for (const file of files) {
				if (!dbFiles.includes(file)) {
					const filePath = path.join(folder.dir, file);
					fs.unlinkSync(filePath);
					console.log(`🗑️ Deleted unused file: ${filePath}`);
				}
			}
		} catch (error) {
			console.error(`❌ Error cleaning folder ${folder.dir}:`, error);
		}
	}
}
