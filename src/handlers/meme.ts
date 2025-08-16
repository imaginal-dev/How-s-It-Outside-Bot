import { Env } from '../types';
import { sendMessage, sendPhoto } from '../telegram';

export async function handleMemeCommand(chatId: number, env: Env) {
	try {
		// This endpoint provides the Bing Picture of the Day data.
		const response = await fetch('https://meme-api.com/gimme');
		const data: any = await response.json();

		if (!data || !data.url) {
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, I couldn’t fetch any memes for you 😔');
		}

		const imageUrl = data.url;
		const caption = data.title;

		return sendPhoto(env.TELEGRAM_BOT_TOKEN, chatId, imageUrl, caption);
	} catch (error) {
		console.error('Error fetching picture of the day:', error);
		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, there was an error getting the picture of the day.');
	}
}
