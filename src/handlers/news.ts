import { Env } from '../types';
import { sendMessage, generateKeyboard } from '../telegram';

const NEWS_API_URL = 'https://news.google.com/news/rss/headlines/section/topic';

function parseXml(xml: string): any[] {
	const items = [];
	const itemRegex = /<item>([\s\S]*?)<\/item>/g;
	let match;
	while ((match = itemRegex.exec(xml)) !== null) {
		const itemXml = match[1];
		const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemXml);
		const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemXml);
		if (titleMatch && linkMatch) {
			items.push({
				title: titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
				link: linkMatch[1],
			});
		}
	}
	return items;
}

async function getFinalUrl(url: string): Promise<string> {
	try {
		const response = await fetch(url, { method: 'HEAD', redirect: 'manual' });
		// Check for redirect header
		if (response.status === 302 || response.status === 301) {
			const location = response.headers.get('location');
			if (location) {
				return location;
			}
		}
		// Fallback to the original URL if no redirect or location header
		return url;
	} catch (error) {
		console.error('Error fetching final URL:', error);
		return url; // Return original URL on error
	}
}

export async function handleNewsCategory(category: string, chatId: number, env: Env) {
	const categoryMap: { [key: string]: string } = {
		general: 'WORLD',
		business: 'BUSINESS',
		entertainment: 'ENTERTAINMENT',
		health: 'HEALTH',
		science: 'SCIENCE',
		sports: 'SPORTS',
		technology: 'TECHNOLOGY',
	};

	const googleCategory = categoryMap[category.toLowerCase()] || 'WORLD';
	const url = `${NEWS_API_URL}/${googleCategory}?hl=en-US&gl=US&ceid=US:en`;

	try {
		const response = await fetch(url);
		const text = await response.text();
		const articles = parseXml(text);

		if (!articles || articles.length === 0) {
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, `Sorry, I couldn’t fetch news for the ${category} category.`);
		}

		const topArticles = articles.slice(0, 5);

		const articlePromises = topArticles.map(async (article) => {
			const finalUrl = await getFinalUrl(article.link);
			return `📰 <strong>${article.title}<\/strong>\n<a href="${finalUrl}">Read more ➤<\/a>`;
		});

		const articlesFormatted = (await Promise.all(articlePromises)).join('\n\n');

		const message = `<strong>Top 5 ${category.charAt(0).toUpperCase() + category.slice(1)} Headlines<\/strong>\n\n${articlesFormatted}`;
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
