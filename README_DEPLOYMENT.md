Phase 5 Deployment Quickstart

This guide helps you run the app locally in a containerized staging environment and shows CI/CD basics.

1) Build and run locally with Docker Compose (staging):

```bash
# Build and start services
docker-compose build --pull
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop and remove
docker-compose down -v
```

2) Run tests locally:

```bash
npm ci
npm test -- tests/unit.test.js
```

3) CI/CD (GitHub Actions):
- Workflow is at `.github/workflows/ci-cd.yml`.
- Set repository secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.
- On push to `main`, tests run and image is built and pushed to DockerHub.

4) Production recommendations:
- Use Kubernetes (managed cluster) for production.
- Use proper secrets management (Vault/Secrets Manager).
- Configure monitoring and alerting (Prometheus/Grafana, Sentry, ELK).
- Use TLS certificates from Let’s Encrypt or cloud provider.
- Run staging smoke tests before production rollout.
