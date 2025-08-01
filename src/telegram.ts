// src/telegram.ts
import { Env } from './types';

export function generateKeyboard(currentCategory: string = 'general') {
	const allCategories = [
		{ text: 'General', callback_data: 'news_general' },
		{ text: 'Technology', callback_data: 'news_technology' },
		{ text: 'Science', callback_data: 'news_science' },
		{ text: 'Business', callback_data: 'news_business' },
		{ text: 'Entertainment', callback_data: 'news_entertainment' },
		{ text: 'Sports', callback_data: 'news_sports' },
		{ text: 'Health', callback_data: 'news_health' },
	];

	const buttons = allCategories
		.filter((button) => button.callback_data !== `news_${currentCategory}`)
		.map((button) => ({ text: button.text, callback_data: button.callback_data }));

	const rows = [];
	for (let i = 0; i < buttons.length; i += 2) {
		rows.push(buttons.slice(i, i + 2));
	}

	return {
		inline_keyboard: rows,
	};
}

export async function sendMessage(token: string, chatId: number, text: string, replyMarkup: any = null) {
	const url = `https://api.telegram.org/bot${token}/sendMessage`;
	const payload: any = {
		chat_id: chatId,
		text: text,
		parse_mode: 'HTML',
	};
	if (replyMarkup) {
		payload.reply_markup = replyMarkup;
	}

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	return response.json();
}

export async function editMessage(token: string, chatId: number, messageId: number, text: string, replyMarkup: any = null) {
	const url = `https://api.telegram.org/bot${token}/editMessageText`;
	const payload: any = {
		chat_id: chatId,
		message_id: messageId,
		text: text,
		parse_mode: 'HTML',
	};
	if (replyMarkup) {
		payload.reply_markup = replyMarkup;
	}

	return fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
}

export async function sendPhoto(token: string, chatId: number, photoUrl: string, caption: string) {
	const url = `https://api.telegram.org/bot${token}/sendPhoto`;
	const payload = {
		chat_id: chatId,
		photo: photoUrl,
		caption: caption,
		parse_mode: 'HTML',
	};

	return fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
}

export async function deleteMessage(token: string, chatId: number, messageId: number) {
	const url = `https://api.telegram.org/bot${token}/deleteMessage`;
	const payload = {
		chat_id: chatId,
		message_id: messageId,
	};

	return fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
}
