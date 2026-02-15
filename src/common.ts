export type Repo = {
	name: string;
	private: boolean;
	description: string | null;
	topics: string[];
	htmlUrl?: string;
	updatedAt: string;
	pushedAt: string;
	cloneUrl?: string;
};

export function toMirrorRepo(repo: Repo): Repo {
	let mirrorHeading = repo.htmlUrl ? `Mirror of ${repo.htmlUrl}` : `Mirror`;
	return {
		name: repo.name,
		private: repo.private,
		description: [repo.description ?? "", mirrorHeading].filter(Boolean).join("\n\n"),
		topics: [...(repo.topics ?? []), "mirror"],
		updatedAt: repo.updatedAt,
		pushedAt: repo.pushedAt,
	};
}