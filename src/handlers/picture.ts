// src/handlers/picture.ts
import { Env } from '../types';
import { sendMessage, sendPhoto } from '../telegram';

export async function handlePictureCommand(chatId: number, env: Env) {
	try {
		// This endpoint provides the Bing Picture of the Day data.
		const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US');
		const data: any = await response.json();

		if (!data || !data.images || data.images.length === 0) {
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, I couldn’t fetch the picture of the day.');
		}

		const image = data.images[0];
		const imageUrl = `https://www.bing.com${image.url}`;
		const caption = `<b>${image.title}</b>\n\n${image.copyright}`;

		return sendPhoto(env.TELEGRAM_BOT_TOKEN, chatId, imageUrl, caption);
	} catch (error) {
		console.error('Error fetching picture of the day:', error);
		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, there was an error getting the picture of the day.');
	}
}