output "ecr_repository_url" {
  description = "ECR repository URL for the application image"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "vpc_id" {
  description = "VPC ID created for the project"
  value       = aws_vpc.main.id
}
