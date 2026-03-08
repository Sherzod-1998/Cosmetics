import { ExtendedRequest } from '../libs/types/member';
import { T } from '../libs/types/common';
import { Response } from 'express';
import Errors, { HttpCode, Message } from '../libs/Errors';
import OrderService from '../models/Order.service';
import { OrderInquiry, OrderUpdateInput, TelegramCheckoutInput } from '../libs/types/order';
import { OrderStatus } from '../libs/enums/order.enum';

const orderService = new OrderService();
const orderController: T = {};

function formatNum(value: number): string {
	return Math.round(Number(value) || 0)
		.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function resolveTelegramId(member: ExtendedRequest['member']): string | null {
	if (member?.telegramId) return String(member.telegramId);
	const phone = String(member?.memberPhone || '');
	if (phone.startsWith('tg_')) return phone.slice(3);
	return null;
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
	const tgResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text,
		}),
	});

	if (!tgResp.ok) {
		const errorText = await tgResp.text();
		console.log('Error, sendTelegramMessage:', errorText);
		throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG);
	}
}

async function resolveAdminChatId(botToken: string): Promise<string> {
	const directId = (process.env.TG_ADMIN_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '').trim();
	if (directId) return directId;

	const adminUsername = (process.env.TG_ADMIN_USERNAME || process.env.TELEGRAM_ADMIN_USERNAME || '').trim();
	if (!adminUsername) return '';

	const username = adminUsername.startsWith('@') ? adminUsername : `@${adminUsername}`;
	const resp = await fetch(
		`https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(username)}`,
	);
	if (!resp.ok) {
		const errorText = await resp.text();
		console.log('Error, resolveAdminChatId getChat:', errorText);
		return '';
	}

	const payload = (await resp.json()) as {
		ok?: boolean;
		result?: { id?: number | string };
	};
	if (!payload?.ok || payload?.result?.id === undefined || payload?.result?.id === null) return '';

	return String(payload.result.id);
}

orderController.createOrder = async (req: ExtendedRequest, res: Response) => {
	try {
		console.log('createOrder');
		const result = await orderService.createOrder(req.member, req.body);
		res.status(HttpCode.CREATED).json(result); // `-` o'rniga `.` qo'yildi
	} catch (err) {
		console.log('Error, createOrder:', err);
		if (err instanceof Errors) {
			res.status(err.code).json(err);
		} else {
			res.status(Errors.standard.code).json(Errors.standard);
		}
	}
};

orderController.getMyOrders = async (req: ExtendedRequest, res: Response) => {
	try {
		console.log('getMyOrderssssssssssss');
		const { page, limit, orderStatus } = req.query;
		const inquiry: OrderInquiry = {
			page: Number(page),
			limit: Number(limit),
			orderStatus: orderStatus as OrderStatus,
		};
		console.log('inquiry:', inquiry);
		const result = await orderService.getMyOrders(req.member, inquiry);
		res.status(HttpCode.OK).json(result); // Changed to HttpCode.OK (200)
	} catch (err) {
		console.log('Error, getMyOrders:', err);

		if (err instanceof Errors) {
			res.status(err.code).json(err);
		} else {
			res.status(Errors.standard.code).json(Errors.standard);
		}
	}
};

orderController.updateOrder = async (req: ExtendedRequest, res: Response) => {
	try {
		console.log('updateOrder');
		const input: OrderUpdateInput = req.body;
		const result = await orderService.updateOrder(req.member, input);
		res.status(HttpCode.CREATED).json(result);
	} catch (err) {
		console.log('Error, updateOrder:', err);
		if (err instanceof Errors) {
			res.status(err.code).json(err);
		} else {
			res.status(Errors.standard.code).json(Errors.standard);
		}
	}
};

orderController.checkoutToTelegram = async (req: ExtendedRequest, res: Response) => {
	try {
		const botToken = process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
		if (!botToken) throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG);
		const adminChatId = await resolveAdminChatId(botToken);

		const telegramId = resolveTelegramId(req.member);
		if (!telegramId) throw new Errors(HttpCode.BAD_REQUEST, Message.NOT_AUTHENTICATED);

		const input = req.body as TelegramCheckoutInput;
		const items = Array.isArray(input?.items) ? input.items : [];
		if (!items.length) throw new Errors(HttpCode.BAD_REQUEST, Message.NO_DATA_FOUND);

		const header = `🧾 Yangi buyurtma\n👤 ${req.member.memberNick}\n📱 ${req.member.memberPhone}`;
		const lines = items
			.map((item, idx) => {
				const qty = Number(item.quantity) || 0;
				const price = Number(item.price) || 0;
				const rowTotal = qty * price;
				return `${idx + 1}. ${item.productName}\n   ${qty} x ${formatNum(price)} so'm = ${formatNum(rowTotal)} so'm`;
			})
			.join('\n');
		const summary = `\n\nJami mahsulot: ${Number(input.totalCount) || 0}\nJami: ${formatNum(
			Number(input.subtotal) || 0,
		)} so'm`;
		const text = `${header}\n\n${lines}${summary}`;
		await sendTelegramMessage(botToken, telegramId, text);
		if (adminChatId && adminChatId !== telegramId) {
			await sendTelegramMessage(botToken, adminChatId, text);
		}

		res.status(HttpCode.OK).json({ ok: true });
	} catch (err) {
		console.log('Error, checkoutToTelegram:', err);
		if (err instanceof Errors) {
			res.status(err.code).json(err);
		} else {
			res.status(Errors.standard.code).json(Errors.standard);
		}
	}
};

export default orderController;
