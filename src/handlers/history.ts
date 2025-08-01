// src/handlers/history.ts
import { Env } from '../types';
import { sendMessage } from '../telegram';

export async function handleHistoryCommand(chatId: number, env: Env) {
	try {
		const date = new Date();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		// This API is free and doesn't require a key.
		const response = await fetch(`https://byabbe.se/on-this-day/${month}/${day}/events.json`);
		const data: any = await response.json();

		if (!data || !data.events || data.events.length === 0) {
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, I couldn’t fetch any historical events for today.');
		}

		// Pick a few random events to show
		const events = data.events.sort(() => 0.5 - Math.random()).slice(0, 5);

		const eventsText = events.map((event: any) => `<b>${event.year}</b>: ${event.description}`).join('\n\n');

		const message = `<strong>On this day in history (${data.date}):</strong> 📜\n\n${eventsText}`;

		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, message);
	} catch (error) {
		console.error('Error fetching historical events:', error);
		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, there was an error getting historical events.');
	}
}
