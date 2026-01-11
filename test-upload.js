import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const app = express();
const port = 3000;

// Rasmni saqlash uchun papka yarating
const uploadDir = './uploads/test';
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		cb(null, uuidv4() + ext);
	},
});

const upload = multer({ storage });

// Rasm yuklash endpoint
app.post('/upload-test', upload.single('photo'), (req, res) => {
	console.log('File:', req.file);
	res.send('✅ Fayl qabul qilindi');
});

app.listen(port, () => {
	console.log(`Server http://localhost:${port}`);
});
