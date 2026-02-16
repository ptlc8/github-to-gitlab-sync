# GitHub to GitLab Sync 📥

A tool for synchronizing repositories from GitHub to GitLab.


## Features ✨

- Mirror GitHub repositories to GitLab
- Automated synchronization of repository metadata (description, topics, visibility)
- Configurable scheduling (cron-based)
- Optional logging to a webhook for monitoring sync status and errors


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
CRON_MINUTE=9 # Minute for scheduled sync
CRON_HOUR=9 # Hour for scheduled sync
```


## Usage 🚀

In cron mode (default), the synchronizer will run at the specified time (default: 9:09 AM daily):
```bash
docker compose run -it --rm synchronizer
```

In one-shot mode, the synchronizer will run immediately and exit:
```bash
docker compose run -it --rm synchronizer once
```