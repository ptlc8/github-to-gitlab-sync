import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { toMirrorRepo, type Repo } from "./common.js";
import { getConfig } from "./config.js";
import { Github } from "./github.js";
import { Gitlab } from "./gitlab.js";
import { log } from "./logging.js";

const execFileAsync = promisify(execFile);

const CONFIG = getConfig();

async function withTempDir<T>(prefix: string, fn: (dir: string) => Promise<T>): Promise<T> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
	try {
		return await fn(dir);
	} finally {
		await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
	}
}

async function syncRepo(repo: Repo, mirrorRepo: Repo): Promise<void> {
	if (!repo.cloneUrl)
		throw new Error("Repo has no clone URL (cloneUrl missing)");
	if (!mirrorRepo.cloneUrl)
		throw new Error("Mirror repo has no clone URL (cloneUrl missing)");
	const sourceUrl = repo.cloneUrl;
	const destinationUrl = mirrorRepo.cloneUrl;
	const timeout = 1000 * 60 * 5; // 5 minutes TODO: change

	await withTempDir("gh-gl-mirror", async (tmp) => {
		const mirrorDir = path.join(tmp, `${repo.name}.git`);

		await log("info", "Cloning (mirror)", { repo: repo.name });
		await execFileAsync("git", ["clone", "--mirror", sourceUrl, mirrorDir], { timeout });

		await log("debug", "Setting push URL", { repo: repo.name });
		await execFileAsync("git", ["-C", mirrorDir, "remote", "set-url", "--push", "origin", destinationUrl], { timeout });

		await log("info", "Pushing (mirror)", { repo: repo.name });
		await execFileAsync("git", ["-C", mirrorDir, "push", "--mirror"], { timeout });
	});
}

async function main() {
	await log("info", "Starting sync run", {
		gitlabHost: CONFIG.gitlabHost,
		maxRepos: CONFIG.maxRepos ?? "all",
		skipArchived: CONFIG.skipArchived,
		skipDisabled: CONFIG.skipDisabled,
	});

	const github = new Github(CONFIG.githubToken);
	if (!await github.isTokenValid()) {
		await log("error", "Invalid GitHub token");
		process.exit(1);
	}

	const gitlab = new Gitlab(CONFIG.gitlabToken, CONFIG.gitlabHost);
	if (!await gitlab.isTokenValid()) {
		await log("error", "Invalid GitLab token");
		process.exit(1);
	}

	const repos = await github.listGithubRepos(CONFIG.skipArchived, CONFIG.skipDisabled);
	await log("info", "Fetched GitHub repos", { count: repos.length });

	const maxRepos = CONFIG.maxRepos;

	let ok = 0;
	let failed = 0;
	let skipped = 0;

	for (const repo of repos) {
		if (ok >= maxRepos) {
			await log("info", "Reached max repos limit, skipping remaining", { maxRepos, total: repos.length, processed: ok + failed + skipped });
			break;
		}

		try {
			const mirrorRepo = await gitlab.syncProject(toMirrorRepo(repo));
			
			if (!mirrorRepo) {
				skipped++;
				await log("info", "Skipping repo", { repo: repo.name });
				continue;
			}

			if (new Date(mirrorRepo.pushedAt) >= new Date(repo.pushedAt)) {
				skipped++;
				await log("info", "Skipping repo, already up to date", { repo: repo.name });
				continue;
			}

			await syncRepo(repo, mirrorRepo);

			ok++;
			await log("success", "Repo synced", { repo: repo.name });
		} catch (e: any) {
			failed++;
			await log("error", "Repo sync failed", {
				repo: repo.name,
				error: e.toString(),
				stack: e.stack,
			});
		}
	}

	await log("info", "Sync run finished", { ok, failed, skipped, total: repos.length });

	if (failed > 0) process.exitCode = 2;
}

main().catch(async (e) => {
	await log("error", "Fatal error", { error: e.toString(), stack: e.stack });
	process.exitCode = 1;
});

process.on("SIGINT", async () => {
	process.exit(130);
});
