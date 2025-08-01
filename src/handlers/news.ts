// src/handlers/news.ts
import { Env } from '../types';
import { sendMessage, generateKeyboard } from '../telegram';

const NEWS_API_URL = 'https://raw.githubusercontent.com/SauravKanchan/NewsAPI/master/top-headlines/category';

export async function handleNewsCategory(category: string, chatId: number, env: Env) {
	const url = `${NEWS_API_URL}/${category}/in.json`;
	try {
		const response = await fetch(url);
		const data: any = await response.json();

		if (data.status !== 'ok' || !data.articles || data.articles.length === 0) {
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, `Sorry, I couldn’t fetch news for the ${category} category.`);
		}

		const articles = data.articles
			.slice(0, 5)
			.map((article: any) => '📰 <strong>' + article.title + '</strong>\n<a href="' + article.url + '">Read more</a>')
			.join('\n\n');

		const message = '<strong>Top 5 ' + category.charAt(0).toUpperCase() + category.slice(1) + ' Headlines</strong>\n\n' + articles;
		const keyboard = generateKeyboard(category);

		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, message, keyboard);
	} catch (error) {
		console.error(`Error fetching ${category} news:`, error);
		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, there was an error getting the news.');
	}
}

export async function handleNewsCommand(chatId: number, env: Env) {
	return handleNewsCategory('general', chatId, env);
}
