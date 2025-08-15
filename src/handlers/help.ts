// src/handlers/help.ts
import { Env } from '../types';
import { sendMessage } from '../telegram';

export async function handleHelpCommand(chatId: number, env: Env) {
	const helpText = `<b>How's It Outside Bot Help 🤖</b>

Here are the available commands:

/about \nℹ️ Shows information about the bot.\n
/help \n📋 Shows this help message.\n
/news \n📰 Gets the latest news headlines.\n
/weather \n🌤️ Gets the weather forecast for your location.\n
/quote \n💭 Gets a random inspirational quote.\n
/fact \n🧠 Gets a random interesting fact.\n
/history \n📅 Shows historical events that happened on this day.\n
/picture \n📸 Gets the Bing Picture of the Day.\n
/horoscope \n⭐ Gets your daily horoscope.\n
/meme \n😂 Gets a random meme.\n
/joke \n😄 Gets a random joke.\n
/dice \n🎲 Starts a new Game of Dice.\n
/policy \n🔒 Shows the bot's privacy policy.\n
`;

	return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, helpText, { parse_mode: 'HTML' });
}
