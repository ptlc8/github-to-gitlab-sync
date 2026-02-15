import { type Repo } from "./common.js";

export type GithubRepo = Repo & {
	id: number;
	name: string;
	private: boolean;
	html_url: string;
	description: string | null;
	fork: boolean;
	clone_url: string;
	topics: string[];
	archived: boolean;
	disabled: boolean;
	pushed_at: string;
	updated_at: string;
};

type GitHubAffiliation = "owner" | "collaborator" | "organization_member";

function parseNextLink(linkHeader?: string): string | null {
	// GitHub Link header format: <url>; rel="next", <url>; rel="last"
	if (!linkHeader) return null;
		const parts = linkHeader.split(",");
	for (const p of parts) {
		const m = p.match(/<([^>]+)>\s*;\s*rel="next"/);
		if (m?.[1]) return m[1];
	}
	return null;
}


export class Github {

	private token: string;

	constructor(token: string) {
		this.token = token;
	}

	async fetch<T>(url: string): Promise<{ data: T; link?: string }> {
		const res = await fetch(url, {
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${this.token}`,
				"X-GitHub-Api-Version": "2022-11-28",
			},
		});

		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(`GitHub API error ${res.status} ${res.statusText} for ${url}: ${text}`);
		}

		const link = res.headers.get("link") || undefined;
		const data = (await res.json()) as T;
		if (!link) return { data };
		return { data, link };
	}

	async isTokenValid(): Promise<boolean> {
		try {
			await this.fetch("https://api.github.com/user");
			return true;
		} catch {
			return false;
		}
	}

	async listGithubRepos(skipArchived: boolean, skipDisabled: boolean, affiliations: GitHubAffiliation[] = ["owner"]): Promise<Repo[]> {
		const repos: GithubRepo[] = [];
		let url = `https://api.github.com/user/repos?per_page=100&visibility=all&affiliation=${affiliations.join(",")}&sort=full_name&direction=asc`;

		while (url) {
			const { data, link } = await this.fetch<GithubRepo[]>(url);
			repos.push(...data);

			url = parseNextLink(link) ?? "";
		}

		const filtered = repos.filter((r) => {
			if (skipArchived && r.archived) return false;
			if (skipDisabled && r.disabled) return false;
			if (r.fork) return false;
			return true;
		});

		return filtered.map(r => this.ghRepoToRepo(r));
	}

	ghRepoToRepo(ghRepo: GithubRepo): Repo {
		return {
			name: ghRepo.name,
			private: ghRepo.private,
			description: ghRepo.description,
			topics: ghRepo.topics,
			htmlUrl: ghRepo.html_url,
			updatedAt: ghRepo.updated_at,
			pushedAt: ghRepo.pushed_at,
			cloneUrl: this.createCloneUrlWithToken(ghRepo.clone_url),
		};
	}

	createCloneUrlWithToken(url: string): string {
		const u = new URL(url);
		u.username = "x-access-token";
		u.password = this.token;
		return u.toString();
	}
}