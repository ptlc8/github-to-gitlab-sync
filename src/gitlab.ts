import { Gitlab as GitlabApi, type ProjectSchema } from "@gitbeaker/rest";
import { type Repo } from "./common.js";
import { log } from "./logging.js";

export class Gitlab {
	private api: GitlabApi;
	private token: string;
	
	constructor(token: string, host: string) {
		this.token = token;
		this.api = new GitlabApi({ token, host });
	}

	async isTokenValid(): Promise<boolean> {
		try {
			await this.api.Users.showCurrentUser();
			return true;
		} catch {
			return false;
		}
	}

	async getGitlabProject(path: string): Promise<ProjectSchema | null> {
		const userId = (await this.api.Users.showCurrentUser()).id;
		const projects = await this.api.Users.allProjects(userId);
		return projects.find((p) => p.path === path) ?? null;
	} 

	async syncProject(repo: Repo): Promise<Repo | null> {
		const project = await this.getGitlabProject(repo.name);

		if (!project) {
			await log("info", "Creating GitLab project", { repo: repo.name });
			const created = (await this.api.Projects.create({
				path: repo.name,
				description: repo.description ?? "",
				visibility: repo.private ? "private" : "public",
				topics: repo.topics,
			}));
			return this.projectToRepo(created);
		}

		// don't sync if 'mirror' topic is missing
		if (!project.topics?.includes("mirror")) {
			await log("warn", "Existing GitLab project is missing 'mirror' topic", { project: repo.name, url: project.web_url });
			return null;
		}

		// don't update already up to date
		if (this.isProjectUpToDate(project, repo)) {
			return this.projectToRepo(project);
		}

		await log("info", "Updating GitLab project metadata", { project: repo.name });
		const edited = await this.api.Projects.edit(project.id, {
			description: repo.description ?? "",
			topics: repo.topics,
			visibility: repo.private ? "private" : "public",
		});
		await log("success", "Repo metadata synced", { repo: repo.name });

		return this.projectToRepo(edited);
	}

	isProjectUpToDate(project: ProjectSchema, repo: Repo): boolean {
		return project.description === repo.description
			&& project.visibility === (repo.private ? "private" : "public")
			&& project.topics?.sort().join(",") === repo.topics.sort().join(",");
	}

	projectToRepo(project: ProjectSchema): Repo {
		return {
			name: project.path,
			private: project.visibility === "private",
			description: project.description,
			topics: project.topics ?? [],
			htmlUrl: project.web_url,
			cloneUrl: this.createCloneUrlWithToken(project.http_url_to_repo),
			updatedAt: project.updated_at,
			pushedAt: project.empty_repo ? "2000-01-01T00:00:00Z" : project.last_activity_at,
		};
	}

	createCloneUrlWithToken(url: string): string {
		const u = new URL(url);
		u.username = "oauth2";
		u.password = this.token;
		return u.toString();
	}
}