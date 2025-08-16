import { Env } from '../types';
import { sendMessage } from '../telegram';

export async function handlePolicyCommand(chatId: number, env: Env) {
	const policyText = `<b>Privacy-Focused</b>

This bot is designed with your privacy in mind:\n
- <b>No Personal Data Collection</b>: The bot does not store any personal data, chat history, or user information.\n
- <b>Stateless</b>: Each request is processed independently. The only exception is the /horoscope command, which temporarily remembers your date of birth for a single session to provide the service, and the /dice game, which keeps track of the score for the current game only. This information is not stored long-term.\n
- <b>No Tracking</b>: It does not track users or their activities.\n
<i>Author</i>: <a href="https://github.com/imaginal-dev">BMO</a>`;

	await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, policyText, { parse_mode: 'HTML' });

	return new Response('OK');
}
