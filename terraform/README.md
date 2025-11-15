Phase 6 Terraform scaffold

This folder contains a minimal Terraform scaffold to bootstrap Phase 6 infrastructure.
It is intentionally small — expand into modules and production-grade resources (ALB, RDS, ElastiCache,
ECS task definitions, IAM roles, CloudFront, Route53) before applying to production.

Quick start

1. Install Terraform (>= 1.0)
2. Configure AWS credentials (environment variables or shared credentials file)

```bash
export AWS_ACCESS_KEY_ID=YOUR_KEY
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET
export AWS_DEFAULT_REGION=us-east-1
```

3. Initialize Terraform

```bash
cd terraform
terraform init
```

4. Review plan

```bash
terraform plan -var="project_name=rtechwebsite" -var="environment=staging"
```

5. Apply (only after review and with proper creds/approval)

```bash
terraform apply -var="project_name=rtechwebsite" -var="environment=staging"
```

Notes
- This scaffold creates an ECR repository, an ECS cluster, and a minimal VPC + subnet.
- Replace with modularized code when moving to production (use separate modules for networking, compute, db, cache).
- For production, add remote state backend (S3 + DynamoDB locking) and secrets management (Secrets Manager / Parameter Store).
