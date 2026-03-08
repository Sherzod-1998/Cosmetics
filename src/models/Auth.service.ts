import Errors, { HttpCode, Message } from '../libs/Errors';
import { AUTH_TIMER } from '../libs/config';
import { Member, TelegramLoginPayload } from '../libs/types/member';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class AuthService {
	private readonly secretToken;
	constructor() {
		this.secretToken = process.env.SECRET_TOKEN as string;
	}

	public async createToken(payload: Member) {
		return new Promise((resolve, reject) => {
			const duration = `${AUTH_TIMER}h`;
			jwt.sign(
				payload,
				process.env.SECRET_TOKEN as string,
				{
					expiresIn: duration,
				},
				(err, token) => {
					if (err) reject(new Errors(HttpCode.UNAUTHORIZED, Message.TOKEN_CREATION_FAILED));
					else resolve(token as string);
				},
			);
		});
	}
	public async checkAuth(token: string): Promise<Member> {
		const result: Member = (await jwt.verify(token, this.secretToken)) as Member;
		console.log(`--- [AUTH] memberNick: ${result.memberNick} ---`);
		return result;
	}

	public verifyTelegramAuth(payload: TelegramLoginPayload): void {
		const botToken = process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
		if (!botToken) {
			throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG);
		}

		const hash = String(payload.hash || '');
		const authDate = Number(payload.auth_date || 0);
		if (!hash || !authDate || !payload.id) {
			throw new Errors(HttpCode.BAD_REQUEST, Message.NOT_AUTHENTICATED);
		}

		const maxAge = Number(process.env.TG_AUTH_MAX_AGE_SECONDS || 86400);
		const now = Math.floor(Date.now() / 1000);
		if (now - authDate > maxAge) {
			throw new Errors(HttpCode.UNAUTHORIZED, Message.NOT_AUTHENTICATED);
		}

		const checkString = Object.entries(payload)
			.filter(([key, value]) => key !== 'hash' && value !== undefined && value !== null && value !== '')
			.map(([key, value]) => `${key}=${value}`)
			.sort()
			.join('\n');

		const secretKey = crypto.createHash('sha256').update(botToken).digest();
		const generatedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

		const left = Buffer.from(generatedHash, 'hex');
		const right = Buffer.from(hash, 'hex');
		if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
			throw new Errors(HttpCode.UNAUTHORIZED, Message.NOT_AUTHENTICATED);
		}
	}
}

export default AuthService;
