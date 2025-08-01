// src/handlers/quote.ts
import { Env } from '../types';
import { sendMessage } from '../telegram';

const QUOTE_API_URL = 'https://zenquotes.io/api/random';

export async function handleQuoteCommand(chatId: number, env: Env) {
	try {
		const response = await fetch(QUOTE_API_URL);
		const data: any = await response.json();

		if (!data || data.length === 0) {
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, I couldn’t fetch a quote right now.');
		}

		const quote = data[0];
		const message = `"${quote.q}"\n\n- <i>${quote.a}</i>`;

		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, message);
	} catch (error) {
		console.error('Error fetching quote:', error);
		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, there was an error getting a quote.');
	}
}
