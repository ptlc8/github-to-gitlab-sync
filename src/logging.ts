import { getConfig } from "./config.js";

type LogLevel = "debug" | "info" | "success" | "warn" | "error";

const logLevelEmojis: Record<LogLevel, string[]> = {
	debug: ["🔍", "🐛"],
	info: ["ℹ️", "📘"],
	success: ["✅", "🍀", "🦎", "🐸"],
	warn: ["⚠️", "🔶", "🐡", "🚧"],
	error: ["❌", "🚨", "🦞", "🧨"]
};

const logLevelColorCodes: Record<LogLevel, string> = {
	debug: "\x1b[36m",
	info: "\x1b[34m",
	success: "\x1b[32m",
	warn: "\x1b[33m",
	error: "\x1b[31m"
};
const resetColorCode = "\x1b[0m";

const CONFIG = getConfig();

export async function log(level: LogLevel, message: string, meta: Record<string, string|number|boolean> = {}) {
	logToStdout(level, message, meta);

	if (!CONFIG.loggingWebhook?.length) return;
	if (!["success", "warn", "error"].includes(level)) return;
	
	logToWebhook(level, message, meta)
		.catch((e) => logToStdout("error", "Failed to send log to webhook", { error: e.toString() }));
}

async function logToStdout(level: LogLevel, message: string, meta: Record<string, string|number|boolean>) {
	var levelStr = level.toUpperCase().padEnd(7);
	if (process.stdout.isTTY)
		levelStr = logLevelColorCodes[level] + levelStr + resetColorCode;
	const line = `${levelStr} ${message} ${
		Object.keys(meta).length ? JSON.stringify(meta) : ""
	}`;
	console.log(line);
}

async function logToWebhook(level: LogLevel, message: string, meta: Record<string, string|number|boolean>) {
	const payload = {
		username: "Github to Gitlab sync",
		content: getEmoji(level) + " " + message
			+ (Object.entries(meta).map(([key, value]) =>
				typeof value === "string" && value.startsWith("http") ?
					`\n**${key}**: <${value}>` :
					`\n**${key}**: \`${value}\``
			).join("")),
	};

	let res = await fetch(CONFIG.loggingWebhook, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${await res.text()}`);
	}
}

function getEmoji(level: LogLevel): string {
	const emojis = logLevelEmojis[level];
	return emojis[Math.floor(Math.random() * emojis.length)] ?? "";
}
