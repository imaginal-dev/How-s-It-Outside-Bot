// src/handlers/horoscope.ts
import { Env } from '../types';
import { sendMessage } from '../telegram';

// A simple in-memory store for user data.
const userStorage = new Map<number, { dob?: string; expecting?: 'dob' }>();

function getZodiacSign(dob: string): string {
	const [year, month, day] = dob.split('-').map(Number);
	if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries ♈️';
	if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus ♉️';
	if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini ♊️';
	if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer ♋️';
	if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo ♌️';
	if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo ♍️';
	if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra ♎️';
	if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio ♏️';
	if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius ♐️';
	if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn ♑️';
	if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius ♒️';
	if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces ♓️';
	return 'Unknown'; // Should not happen with valid dates
}

async function fetchHoroscope(sign: string): Promise<string> {
	try {
		const response = await fetch(
			`https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${sign.toLowerCase().split(' ')[0]}&day=TODAY`,
		);
		const data: any = await response.json();
		if (data && data.data && data.data.horoscope_data) {
			return data.data.horoscope_data;
		}
		return 'Could not fetch horoscope data.';
	} catch (error) {
		console.error('Error fetching horoscope:', error);
		return 'Sorry, there was an error getting your horoscope.';
	}
}

export function getUserState(chatId: number) {
	return userStorage.get(chatId);
}

export async function handleHoroscopeCommand(chatId: number, env: Env) {
	const user = userStorage.get(chatId);

	if (user && user.dob) {
		const sign = getZodiacSign(user.dob);
		const horoscope = await fetchHoroscope(sign);
		const message = `<b>Your daily horoscope for ${sign}:</b>\n\n${horoscope}`;
		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, message);
	} else {
		userStorage.set(chatId, { ...user, expecting: 'dob' });
		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Please reply with your date of birth in YYYY-MM-DD format.');
	}
}

export async function handleDate(chatId: number, dob: string, env: Env) {
	// Basic validation for YYYY-MM-DD format
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
		userStorage.set(chatId, { expecting: 'dob' });
		return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Invalid format. Please use YYYY-MM-DD.');
	}

	userStorage.set(chatId, { dob }); // Save the DOB and clear the 'expecting' state
	const sign = getZodiacSign(dob);
	const horoscope = await fetchHoroscope(sign);
	const message = `<b>Your daily horoscope for ${sign}:</b>\n\n${horoscope}`;
	return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, message);
}
