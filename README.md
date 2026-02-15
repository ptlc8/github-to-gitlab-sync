# GitHub to GitLab Sync 📥

A tool for synchronizing repositories from GitHub to GitLab.


## Features ✨

- Mirror GitHub repositories to GitLab
- Automated synchronization of repository metadata (description, topics, visibility)


## Configuration ⚙️

Set environment variables (either in a `.env` file or directly in the environment):

```bash
GITHUB_TOKEN=your_github_token # GitHub access token with read repository permissions
GITLAB_TOKEN=your_gitlab_token # GitLab access token with read/write api and repository permissions
```

Optional environment variables:

```bash
GITLAB_HOST=https://gitlab.com # or your self-hosted GitLab URL
MAX_REPOS=10 # Maximum number of repositories to sync
SKIP_ARCHIVED=true
SKIP_DISABLED=true
LOGGING_WEBHOOK=https://your_logging_webhook_url # Webhook URL for error, warn and success logs
```


## Usage 🚀

```bash
docker compose run -it --rm synchronizer
```