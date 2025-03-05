provider "aws" {
  region = "us-west-1"  # Replace with your region
}

#Normally I would keep the TF state in a remote backend like S3.

resource "aws_instance" "ec2-host" {
  ami           = "ami-0c55b159cbfafe1f0"  # Replace with an appropriate AMI ID
  instance_type = "t2.micro"  # Choose your instance type

  key_name      = "your-ssh-key-name"  # Replace with your SSH key name
  security_groups = ["your-security-group"]  # Replace with your security group

}



