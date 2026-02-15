pipeline {
	agent any

	parameters {
		string(name: 'GITHUB_TOKEN', defaultValue: params.GITHUB_TOKEN ?: null, description: 'GitHub token with repo read access')
		string(name: 'GITLAB_TOKEN', defaultValue: params.GITLAB_TOKEN ?: null, description: 'GitLab token')
		string(name: 'LOGGING_WEBHOOK', defaultValue: params.LOGGING_WEBHOOK ?: null, description: 'Logging webhook URL (optional)')
		string(name: 'GITLAB_HOST', defaultValue: params.GITLAB_HOST ?: null, description: 'GitLab host URL (optional)')
		integer(name: 'MAX_REPOS', defaultValue: params.MAX_REPOS ?: null, description: 'Maximum number of repositories to sync (optional)')
		booleanParam(name: 'SKIP_ARCHIVED', defaultValue: params.SKIP_ARCHIVED ?: null, description: 'Skip archived repositories (optional)')
		booleanParam(name: 'SKIP_DISABLED', defaultValue: params.SKIP_DISABLED ?: null, description: 'Skip disabled repositories (optional)')
	} 

	stages {
		stage('Build') {
			steps {
				sh 'docker compose build'
			}
		}

		stage('Deploy') {
			steps {
				sh 'docker compose up --remove-orphans -d'
			}
		}
	}
}