# Minimal Terraform scaffold for Phase 6 (starter resources)
# This is a safe, minimal starting point. Expand modules per production requirements.

resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-app"
  image_tag_mutability = "MUTABLE"
  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, 0)
  availability_zone = "${var.aws_region}a"
  tags = {
    Name = "${var.project_name}-subnet-a"
  }
}
