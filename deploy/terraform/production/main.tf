provider "aws" {
  region = "us-east-1"  # Replace with your region
}

#Normally I would keep the TF state in a remote backend like S3.

resource "aws_instance" "ec2-host" {
  ami                    = "ami-0c55b159cbfafe1f0"  # Replace with an appropriate AMI ID
  instance_type          = "t2.large"  # Choose your instance type
  iam_instance_profile   = aws_iam_instance_profile.ec2_log_role_profile.name
  key_name               = "ssh-key-name"
  security_groups        = ["security-group"]

  user_data = <<-EOF
              #!/bin/bash
              # Format the EBS volume (only once)
              mkfs -t ext4 /dev/xvdf
              # Create a mount point directory
              mkdir /mnt/job_data
              # Mount the EBS volume to the mount point
              mount /dev/xvdf /mnt/job_data
              # Add the mount to fstab for automatic mounting on reboot
              echo '/dev/xvdf /mnt/job_data ext4 defaults,nofail 0 2' >> /etc/fstab

              # Install AWS CloudWatch Logs Agent
              yum install -y awslogs

              # Configure the CloudWatch Logs Agent
              cat > /etc/awslogs/awslogs.conf <<EOL
              [general]
              state_file = /var/lib/awslogs/agent-state

              [/var/log/messages]
              log_group_name = /ec2/job-processor-logs
              log_stream_name = {instance_id}
              file = /var/log/messages

              [/var/log/cloud-init.log]
              log_group_name = /ec2/job-processor-logs
              log_stream_name = {instance_id}
              file = /var/log/cloud-init.log

              [/mnt/job_data]
              log_group_name = /ec2/job-processor-logs
              log_stream_name = {instance_id}
              file = /mnt/job_data/*.log

              EOL

              # Start the AWS Logs Agent and enable it to start on boot
              service awslogs start
              chkconfig awslogs on
              EOF

  tags = {
    Name = "EC2 Job Processor"
  }
}


resource "aws_route53_record" "example_com" {
  zone_id = airtakehomeassignment.com
  name    = "concatenate-vidoes"
  type    = "A"
  ttl     = 60
  records = [aws_instance.example.public_ip]
}

# Create an EBS Volume
resource "aws_ebs_volume" "job_data" {
  availability_zone = "us-east-1"
  size              = 10
  type              = "gp2"
}

# Attach the EBS Volume to the EC2 Instance
resource "aws_volume_attachment" "job_data_attachment" {
  instance_id = aws_instance.ec2-host.id
  volume_id   = aws_ebs_volume.job_data.id
  device      = "/dev/sdh"  # Device name that will be used by the EC2 instance
}


resource "aws_cloudwatch_log_group" "ec2_log_group" {
  name              = "/ec2/concatenate-videos-service"
  retention_in_days = 7  # You can adjust the retention period as needed
}


resource "aws_iam_role" "ec2_log_role" {
  name = "EC2CloudWatchLogsRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Effect    = "Allow"
        Sid       = ""
      },
    ]
  })
}

resource "aws_iam_policy" "ec2_log_policy" {
  name        = "EC2CloudWatchLogsPolicy"
  description = "Policy to allow EC2 instances to send logs to CloudWatch"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_log_role_policy" {
  role       = aws_iam_role.ec2_log_role.name
  policy_arn = aws_iam_policy.ec2_log_policy.arn
}


resource "aws_iam_instance_profile" "ec2_log_role_profile" {
  name = "EC2InstanceWithLogsProfile"
  role = aws_iam_role.ec2_log_role.name
}