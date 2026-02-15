function getMandatoryEnv(name: string): string {
	const v = process.env[name]?.trim();
	if (!v) throw new Error(`Missing required env var: ${name}`);
	return v;
}

function getOptionalEnv(name: string, defaultValue: string = ""): string {
	const v = process.env[name]?.trim();
	return v || defaultValue;
}

function getOptionalNumberEnv(name: string, defaultValue: number = 0): number {
	const v = process.env[name]?.trim();
	if (v === undefined || v === "") return defaultValue;
	return Number(v);
}

function getOptionalBooleanEnv(name: string, defaultValue: boolean = false): boolean {
	const v = process.env[name]?.trim();
	if (v === undefined || v === "") return defaultValue;
	return v === "1" || v.toLowerCase() === "true";
}

export function getConfig() {
	return {
		githubToken: getMandatoryEnv("GITHUB_TOKEN"),
		gitlabToken: getMandatoryEnv("GITLAB_TOKEN"),
		loggingWebhook: getOptionalEnv("LOGGING_WEBHOOK"),
		gitlabHost: getOptionalEnv("GITLAB_HOST", "https://gitlab.com"),
		maxRepos: getOptionalNumberEnv("MAX_REPOS", 10),
		skipArchived: getOptionalBooleanEnv("SKIP_ARCHIVED", true),
		skipDisabled: getOptionalBooleanEnv("SKIP_DISABLED", true),
	};
};