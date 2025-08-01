// src/index.ts
import { Env, ExecutionContext } from './types';
import { sendMessage, deleteMessage } from './telegram';
import { handleNewsCommand, handleNewsCategory } from './handlers/news';
import { handleWeatherCommand, handleLocation } from './handlers/weather';
import { handleQuoteCommand } from './handlers/quote';
import { handleFactCommand } from './handlers/fact';
import { handleHistoryCommand } from './handlers/history';
import { handlePictureCommand } from './handlers/picture';
import { handleHoroscopeCommand, handleDate, getUserState } from './handlers/horoscope';
import { handleDiceCommand, handleDiceCallback, handleDiceRulesCommand } from './handlers/dice';
import { handleHelpCommand } from './handlers/help';

async function handleCommand(command: string, chatId: number, env: Env, ctx: ExecutionContext) {
	switch (command) {
		case '/start':
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, "Don't you know How's It Outside?\n\n Use /help to see all available commands.");
		case '/help':
			return handleHelpCommand(chatId, env);
		case '/ping':
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'pong');
		case '/news':
			return handleNewsCommand(chatId, env);
		case '/weather':
			return handleWeatherCommand(chatId, env);
		case '/quote':
			return handleQuoteCommand(chatId, env);
		case '/fact':
			return handleFactCommand(chatId, env);
		case '/history':
			return handleHistoryCommand(chatId, env);
		case '/picture':
			return handlePictureCommand(chatId, env);
		case '/horoscope':
			return handleHoroscopeCommand(chatId, env);
		case '/dice':
			return handleDiceCommand(chatId, env);
		case '/dice_rules':
			return handleDiceRulesCommand(chatId, env);
		default:
			return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, "Sorry, I don't recognize that command.");
	}
}

async function handleUpdate(update: any, env: Env, ctx: ExecutionContext) {
	if (update.message) {
		const message = update.message;
		const chatId = message.chat.id;
		const messageId = message.message_id;
		const userState = getUserState(chatId);

		if (message.text && message.text.startsWith('/')) {
			ctx.waitUntil(handleCommand(message.text, chatId, env, ctx));
		} else if (message.location) {
			ctx.waitUntil(handleLocation(message.location, chatId, messageId, env));
		} else if (userState && userState.expecting === 'dob' && message.text) {
			ctx.waitUntil(handleDate(chatId, message.text, env));
		} else {
			// Delete any other type of message
			ctx.waitUntil(deleteMessage(env.TELEGRAM_BOT_TOKEN, chatId, messageId));
			const notification = await sendMessage(
				env.TELEGRAM_BOT_TOKEN,
				chatId,
				'Sorry, only commands are allowed. Please use /help to see the available commands.',
			);
			if (notification && notification.result && notification.result.message_id) {
				// Delete the notification after 5 seconds
				ctx.waitUntil(
					new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
						deleteMessage(env.TELEGRAM_BOT_TOKEN, chatId, notification.result.message_id),
					),
				);
			}
		}
	} else if (update.callback_query) {
		const callbackQuery = update.callback_query;
		const chatId = callbackQuery.message.chat.id;
		const messageId = callbackQuery.message.message_id;
		const data = callbackQuery.data;

		if (data.startsWith('news_')) {
			const category = data.split('_')[1];
			ctx.waitUntil(handleNewsCategory(category, chatId, env));
		} else if (data.startsWith('dice_')) {
			ctx.waitUntil(handleDiceCallback(data, chatId, messageId, env, ctx));
		}
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		if (request.method !== 'POST' || url.pathname !== '/webhook') {
			return new Response('Not Found', { status: 404 });
		}

		try {
			const update = await request.json();
			ctx.waitUntil(handleUpdate(update, env, ctx));
		} catch (e) {
			console.error(e);
		}

		return new Response('OK');
	},
};
