import { Env } from '../types';
import { sendMessage } from '../telegram';

export async function handleJokeCommand(chatId: number, env: Env) {
	try {
		const response = await fetch(
			'https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single',
		);
		const data: any = await response.json();

		if (data.error) {
			throw new Error(data.error);
		}

		const laughingEmojis = ['😂', '🤣', '😆', '😄', '😃', '😀', '😁', '😸', '😹'];
		const randomEmoji = laughingEmojis[Math.floor(Math.random() * laughingEmojis.length)];

		const joke = `${data.joke} ${randomEmoji}`;

		await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, joke);
	} catch (error) {
		console.error('Error fetching joke:', error);
		await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, "Sorry, I couldn't fetch a joke right now. Please try again later.");
	}

	return new Response('OK');
}
