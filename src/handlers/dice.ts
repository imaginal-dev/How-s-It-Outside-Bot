// src/handlers/dice.ts
import { Env, ExecutionContext } from '../types';
import { sendMessage, editMessage } from '../telegram';

const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const diceToEmoji = (dice: number[]): string => dice.map((die) => diceEmojis[die - 1]).join(' ');

const GAME_STATE = {
	playerScore: 0,
	botScore: 0,
	playerTurnScore: 0,
	botTurnScore: 0,
	diceCount: 6,
	scoreboardMessageId: null as number | null,
	actionMessageId: null as number | null,
};

const WINNING_SCORE = 5000;

function getScoreboardMessage(): string {
	return `🏆 <strong>Scoreboard</strong> 🏆\n\n👤 Player: ${GAME_STATE.playerScore}\n🤖 Bot: ${GAME_STATE.botScore}\n\nFirst to ${WINNING_SCORE} wins!`;
}

function rollDice(count: number): number[] {
	const rolls = [];
	for (let i = 0; i < count; i++) {
		rolls.push(Math.floor(Math.random() * 6) + 1);
	}
	return rolls;
}

function calculateScore(dice: number[]): { score: number; scoringDice: number[]; nonScoringDice: number[] } {
	const counts: { [key: number]: number } = {};
	for (const die of dice) {
		counts[die] = (counts[die] || 0) + 1;
	}

	let score = 0;
	const scoringDice: number[] = [];
	const nonScoringDice: number[] = [];

	// Check for three-of-a-kind
	for (let i = 1; i <= 6; i++) {
		if (counts[i] >= 3) {
			score += i === 1 ? 1000 : i * 100;
			for (let j = 0; j < 3; j++) scoringDice.push(i);
			counts[i] -= 3;
		}
	}

	// Check for single 1s and 5s
	if (counts[1] > 0) {
		score += counts[1] * 100;
		for (let i = 0; i < counts[1]; i++) scoringDice.push(1);
	}
	if (counts[5] > 0) {
		score += counts[5] * 50;
		for (let i = 0; i < counts[5]; i++) scoringDice.push(5);
	}

	// Collect non-scoring dice
	for (const die of dice) {
		if (!scoringDice.includes(die)) {
			nonScoringDice.push(die);
		}
	}

	return { score, scoringDice, nonScoringDice };
}

export async function handleDiceRulesCommand(chatId: number, env: Env) {
	const rules = `🎲 <b>Dice Game Rules</b> 🎲

The goal is to be the first player to score <b>${WINNING_SCORE} points</b>.

<b>Scoring:</b>
- Three 1s: <b>1000 points</b>
- Three of a kind (2s, 3s, 4s, 5s, 6s): <b>Number × 100</b> (e.g., three 5s = 500 points)
- Single 1: <b>100 points</b>
- Single 5: <b>50 points</b>

<b>How to Play:</b>
1. On your turn, you roll 6 dice.
2. You must set aside at least one scoring die.
3. You can then choose to "bank" your points for the turn or risk them by rolling the remaining dice.
4. If you roll and get no scoring dice, you "bust" and lose all points from that turn.
5. If all 6 of your dice score, you get to roll all 6 again!`;
	return sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, rules);
}

export async function handleDiceCommand(chatId: number, env: Env) {
	GAME_STATE.playerScore = 0;
	GAME_STATE.botScore = 0;
	GAME_STATE.playerTurnScore = 0;
	GAME_STATE.botTurnScore = 0;
	GAME_STATE.diceCount = 6;

	const scoreboardResponse = await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, getScoreboardMessage());
	if (scoreboardResponse && scoreboardResponse.result) {
		GAME_STATE.scoreboardMessageId = scoreboardResponse.result.message_id;
	}

	const actionMessage = "Let's play Dice! 🎲\n\n/dice_rules - Shows the rules for the Dice game.\n\nYour turn to roll!";
	const keyboard = {
		inline_keyboard: [[{ text: 'Roll Dice (6)', callback_data: 'dice_roll_6_0' }]],
	};
	const actionResponse = await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, actionMessage, keyboard);
	if (actionResponse && actionResponse.result) {
		GAME_STATE.actionMessageId = actionResponse.result.message_id;
	}
}

function getPlayerActionMessage(lastAction: string, turnScore: number, remainingDice: number): string {
	return `\n${lastAction}\n\n<b>Turn Score:</b> ${turnScore}\n--------------------\nWhat's your move?\n	`;
}

export async function handleDiceCallback(data: string, chatId: number, messageId: number, env: Env, ctx: ExecutionContext) {
	if (messageId !== GAME_STATE.actionMessageId) return;

	const parts = data.split('_');
	const action = parts[1];

	if (action === 'bank') {
		const turnScore = parseInt(parts[2], 10);
		GAME_STATE.playerScore += turnScore;
		GAME_STATE.playerTurnScore = 0;

		await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.scoreboardMessageId!, getScoreboardMessage());

		if (GAME_STATE.playerScore >= WINNING_SCORE) {
			const message = `You banked ${turnScore} points! 💰\n\n🎉 You won! 🎉\n\nType /dice to start a new game.`;
			await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, message);
			return;
		}

		const message = `You banked ${turnScore} points! 💰\n\nNow it's the bot's turn.`;
		await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, message);
		ctx.waitUntil(handleBotTurn(chatId, env, ctx));
		return;
	}

	if (action === 'roll') {
		const diceCount = parseInt(parts[2], 10);
		const currentTurnScore = parseInt(parts[3], 10);
		const dice = rollDice(diceCount);
		const { score, nonScoringDice } = calculateScore(dice);

		if (score === 0) {
			GAME_STATE.playerTurnScore = 0;
			const message = `You rolled: ${diceToEmoji(dice)}\n\nOh no, you busted! 💥\n\nYou lost all points from this turn. Your turn is over.\n\nNow it's the bot's turn.`;
			await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, message);
			ctx.waitUntil(handleBotTurn(chatId, env, ctx));
			return;
		}

		const newTurnScore = currentTurnScore + score;
		const remainingDiceCount = nonScoringDice.length === 0 ? 6 : nonScoringDice.length;

		const lastAction = `You rolled: ${diceToEmoji(dice)}\nScored: ${score}`;
		const message = getPlayerActionMessage(lastAction, newTurnScore, remainingDiceCount);
		const keyboard = {
			inline_keyboard: [
				[
					{ text: `Roll Again (${remainingDiceCount} dice)`, callback_data: `dice_roll_${remainingDiceCount}_${newTurnScore}` },
					{ text: `Bank Points (${newTurnScore})`, callback_data: `dice_bank_${newTurnScore}` },
				],
			],
		};
		await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, message, keyboard);
	}
}

async function handleBotTurn(chatId: number, env: Env, ctx: ExecutionContext) {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, 'The bot is thinking... 🤔');
	await new Promise((resolve) => setTimeout(resolve, 2000));

	let botDiceCount = 6;
	GAME_STATE.botTurnScore = 0;

	while (true) {
		const dice = rollDice(botDiceCount);
		const { score, nonScoringDice } = calculateScore(dice);

		if (score === 0) {
			GAME_STATE.botTurnScore = 0;
			await editMessage(
				env.TELEGRAM_BOT_TOKEN,
				chatId,
				GAME_STATE.actionMessageId!,
				`The bot rolled: ${diceToEmoji(dice)}\n\nOh no, the bot busted! 💥`,
			);
			await new Promise((resolve) => setTimeout(resolve, 2000));
			break;
		}

		GAME_STATE.botTurnScore += score;
		await editMessage(
			env.TELEGRAM_BOT_TOKEN,
			chatId,
			GAME_STATE.actionMessageId!,
			`The bot rolled: ${diceToEmoji(dice)}\n\nScore for this roll: ${score}\nBot's score for this turn is now ${GAME_STATE.botTurnScore}.`,
		);
		await new Promise((resolve) => setTimeout(resolve, 2000));

		if (GAME_STATE.botScore + GAME_STATE.botTurnScore >= WINNING_SCORE) {
			await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, 'The bot is going for the win!');
			await new Promise((resolve) => setTimeout(resolve, 1000));
			break;
		}

		if (GAME_STATE.botTurnScore >= 500) {
			await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, 'The bot decided to bank its points.');
			await new Promise((resolve) => setTimeout(resolve, 1000));
			break;
		}

		botDiceCount = nonScoringDice.length === 0 ? 6 : nonScoringDice.length;
		await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, `The bot is rolling again with ${botDiceCount} dice...`);
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}

	GAME_STATE.botScore += GAME_STATE.botTurnScore;
	GAME_STATE.botTurnScore = 0;
	await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.scoreboardMessageId!, getScoreboardMessage());

	if (GAME_STATE.botScore >= WINNING_SCORE) {
		const message = `The bot banked its points!\n\n😢 You lost! 😢\n\nType /dice to start a new game.`;
		await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, message);
		return;
	}

	const message = `The bot banked its points!\n\nYour turn to roll!`;
	const keyboard = {
		inline_keyboard: [[{ text: 'Roll Dice (6)', callback_data: `dice_roll_6_0` }]],
	};
	await editMessage(env.TELEGRAM_BOT_TOKEN, chatId, GAME_STATE.actionMessageId!, message, keyboard);
}
