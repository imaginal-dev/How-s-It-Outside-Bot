// src/types.ts
export interface Env {
	TELEGRAM_BOT_TOKEN: string;
}

export interface ExecutionContext {
	waitUntil: (promise: Promise<any>) => void;
}
