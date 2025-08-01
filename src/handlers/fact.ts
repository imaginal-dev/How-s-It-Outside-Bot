// src/handlers/fact.ts
import { Env } from '../types';
import { sendMessage } from '../telegram';

const FACT_API_URL = 'https://uselessfacts.jsph.pl/random.json?language=en';

export async function handleFactCommand(chatId: number, env: Env) {
	try {
		const response = await fetch(FACT_API_URL);
		const data: any = await response.json();

		if (!data || !data.text) {
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, I couldn’t fetch a fact right now.');
		}

		const message = `<strong>Did you know?</strong> 🤔\n\n${data.text}`;

		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, message);
	} catch (error) {
		console.error('Error fetching fact:', error);
		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, there was an error getting a fact.');
	}
}
