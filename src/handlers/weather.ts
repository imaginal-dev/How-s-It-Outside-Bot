// src/handlers/weather.ts
import { Env } from '../types';
import { sendMessage, deleteMessage } from '../telegram';

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

function getWeatherDescription(code: number): { description: string; emoji: string } {
	const descriptions: { [key: number]: { description: string; emoji: string } } = {
		0: { description: 'Clear sky', emoji: '☀️' },
		1: { description: 'Mainly clear', emoji: '🌤️' },
		2: { description: 'Partly cloudy', emoji: '⛅️' },
		3: { description: 'Overcast', emoji: '☁️' },
		45: { description: 'Fog', emoji: '🌫️' },
		48: { description: 'Depositing rime fog', emoji: '🌫️' },
		51: { description: 'Light drizzle', emoji: '💧' },
		53: { description: 'Moderate drizzle', emoji: '💧' },
		55: { description: 'Dense drizzle', emoji: '💧' },
		61: { description: 'Slight rain', emoji: '🌧️' },
		63: { description: 'Moderate rain', emoji: '🌧️' },
		65: { description: 'Heavy rain', emoji: '🌧️' },
		80: { description: 'Slight rain showers', emoji: '🌦️' },
		81: { description: 'Moderate rain showers', emoji: '🌦️' },
		82: { description: 'Violent rain showers', emoji: '🌦️' },
	};
	return descriptions[code] || { description: 'Unknown', emoji: '🤷' };
}

export async function handleWeatherCommand(chatId: number, env: Env) {
	const keyboard = {
		keyboard: [[{ text: 'Share your location to get the weather forecast.', request_location: true }]],
		resize_keyboard: true,
		one_time_keyboard: true,
	};
	return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Please share your location to get the weather forecast.', keyboard);
}

export async function handleLocation(location: any, chatId: number, messageId: number, env: Env) {
	const { latitude, longitude } = location;

	const weatherUrl = `${WEATHER_API_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,apparent_temperature,precipitation_probability&daily=sunrise,sunset&timezone=auto`;
	const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,uv_index`;

	try {
		const [weatherResponse, airQualityResponse] = await Promise.all([fetch(weatherUrl), fetch(airQualityUrl)]);

		const weatherData = await weatherResponse.json();
		const airQualityData = await airQualityResponse.json();

		if (!weatherData.current_weather) {
			await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, I couldn’t fetch the weather for your location.');
			return;
		}

		const weather = weatherData.current_weather;
		const hourly = weatherData.hourly;
		const daily = weatherData.daily;
		const airQuality = airQualityData.current;
		const weatherInfo = getWeatherDescription(weather.weathercode);

		const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const sunset = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

		const message = `
<b>Current Weather</b> ${weatherInfo.emoji}

<b>${weatherInfo.description}</b>
🌡️ Temperature: ${weather.temperature}°C
🤔 Feels like: ${hourly.apparent_temperature[0]}°C
💧 Precipitation: ${hourly.precipitation_probability[0]}%
💨 Windspeed: ${weather.windspeed} km/h

🌅 Sunrise: ${sunrise}
🌇 Sunset: ${sunset}

<b>Air Quality & UV</b>
🌬️ AQI: ${airQuality.european_aqi}
☀️ UV Index: ${airQuality.uv_index}
`;

		await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, message);
	} catch (error) {
		console.error('Error fetching weather:', error);
		await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Sorry, there was an error getting the weather.');
	} finally {
		await deleteMessage(env.TELEGRAM_BOT_TOKEN, chatId, messageId);
	}
}
