provider "aws" {
  region = "us-east-1"  # Specify your desired region
}

resource "aws_ecr_repository" "concatenate_video_service" {
  name = "concatenate-video-service"

  # Optional settings (you can customize these as needed)
  image_tag_mutability = "IMMUTABLE"
  lifecycle_policy {
    rule {
      rule_action = "expire"
      description = "Expire old images"
      image_count_limit = 10
      tag_status = "any"
    }
  }
    image_scanning_configuration {
    scan_on_push = true
  }
}
