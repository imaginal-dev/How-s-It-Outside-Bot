import { Env } from '../types';
import { sendMessage } from '../telegram';

export async function handleAboutCommand(chatId: number, env: Env) {
	const aboutText = `<b>How's It Outside? - Telegram Bot</b>\n
This is a versatile, serverless Telegram bot that provides users with a variety of information and entertainment.
The bot is built to run on <b>Cloudflare Workers</b>, making it completely autonomous and highly efficient.
\n
<i><a href="https://github.com/imaginal-dev/How-s-It-Outside-Bot">This project</a> is open-source and intended for educational and entertainment purposes.</i>`;

	await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, aboutText, { parse_mode: 'HTML' });

	return new Response('OK');
}
