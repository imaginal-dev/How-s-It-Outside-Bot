# How's It Outside? - Telegram Bot

This is a versatile, serverless Telegram bot that provides users with a variety of information and entertainment.

The bot is built to run on **Cloudflare Workers**, making it completely autonomous and highly efficient.

## Privacy-Focused

This bot is designed with your privacy in mind:
- **No Personal Data Collection**: The bot does not store any personal data, chat history, or user information.
- **Stateless**: Each request is processed independently. The only exception is the `/horoscope` command, which temporarily remembers your date of birth *for a single session* to provide the service, and the `/dice` game, which keeps track of the score for the current game only. This information is not stored long-term.
- **No Tracking**: It does not track users or their activities.

## Example

[@hiioSuperBot](https://t.me/hiioSuperBot) in Telegram

## How to Use

1.  Find @hiioSuperBot on Telegram.
2.  Start a chat.
3.  Use the commands.

## How to deploy

1.  Clone the repository.
2.  Install dependencies.
3.  [Configure telegram bot](https://core.telegram.org/bots/faq).
4.  Add your Telegram bot token to the `wrangler.jsonc` file.
5.  Deploy to [Cloudflare Workers](https://developers.cloudflare.com/workers/).

---

*This project is open-source and intended for educational and entertainment purposes.*
