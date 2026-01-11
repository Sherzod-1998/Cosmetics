/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from 'dotenv';
dotenv.config({
	path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

import mongoose from 'mongoose';
import server from './app';

mongoose
	.connect(process.env.MONGO_URL as string, {})
	.then((data) => {
		console.log('MongoDB connection succeed');
		const PORT = process.env.PORT ?? 3003;
		server.listen(PORT, function () {
			console.log(`The server is successfully running on port: ${PORT}`);
		});
	})
	.catch((err) => console.log('Error on connection MongoDB', err));
