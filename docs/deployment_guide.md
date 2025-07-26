# AWS EC2 Deployment Guide

This guide provides a step-by-step walkthrough for deploying this Next.js application to an AWS EC2 instance. This guide provides instructions for both the AWS Management Console and the AWS CLI.

## Deployment using the AWS Management Console (Web Interface)

This section will guide you through deploying the application using the AWS Management Console.

### 1. Set up AWS Secrets Manager

Before deploying the application, you need to store your Polygon and Gemini API keys in AWS Secrets Manager.

1.  **Open the AWS Secrets Manager console.**
2.  **Click "Store a new secret".**
3.  **Select "Other type of secret".**
4.  **Create a secret for your Polygon API key:**
    *   In the "Secret key/value" section, create a key named `POLYGON_API_KEY` and set its value to your Polygon API key.
    *   Click "Next".
    *   Give the secret a name, for example, `MyWebApp/ApiKeys`.
    *   Click "Next" and then "Store".
5.  **Create a secret for your Gemini API key:**
    *   Follow the same steps as above, but this time use the key `GOOGLE_API_KEY` and set its value to your Gemini API key.

### 2. Configure IAM Role for EC2

Your EC2 instance will need permission to access these secrets. You will create an IAM role that your EC2 instance will assume.

1.  **Open the IAM console.**
2.  **Go to "Roles" and click "Create role".**
3.  **Select "AWS service" as the trusted entity type, and choose "EC2" as the use case.**
4.  **Click "Next".**
5.  **In the "Add permissions" step, search for and add the `SecretsManagerReadWrite` policy.** In a production environment, you would want to create a more restrictive policy, but for this guide, this will suffice.
6.  **Click "Next".**
7.  **Give the role a name, for example, `EC2SecretsManagerRole`.**
8.  **Click "Create role".**

### 3. Launch an EC2 Instance

Now, you will launch an EC2 instance and associate the IAM role you just created.

1.  **Open the EC2 console.**
2.  **Click "Launch instance".**
3.  **Choose an Amazon Machine Image (AMI):** Select "Amazon Linux 2 AMI" or any other Linux distribution you are comfortable with.
4.  **Choose an instance type:** `t2.micro` is a good choice for a small application and is eligible for the AWS Free Tier.
5.  **Configure instance details:**
    *   In the "IAM instance profile" dropdown, select the `EC2SecretsManagerRole` you created earlier.
6.  **Add storage:** The default storage is usually sufficient.
7.  **Add tags:** This is optional, but it's a good practice to tag your instances.
8.  **Configure security group:**
    *   Create a new security group.
    *   Add a rule to allow SSH (port 22) from your IP address.
    *   Add a rule to allow HTTP (port 80) from anywhere.
    *   Add a rule to allow HTTPS (port 443) from anywhere.
9.  **Review and launch:**
    *   Review your instance configuration and click "Launch".
    *   You will be prompted to create or select a key pair. If you don't have one, create a new one and download the `.pem` file. You will need this to SSH into your instance.

### 4. Install Docker and Deploy the Application

Once your EC2 instance is running, you need to connect to it, install Docker, and deploy the application.

1.  **Connect to your instance using EC2 Instance Connect:**
    *   In the EC2 console, select your instance and click "Connect".
    *   Select "EC2 Instance Connect" and click "Connect".
2.  **Update the installed packages:**
    ```bash
    sudo yum update -y
    ```
3.  **Install Docker:**
    ```bash
    sudo amazon-linux-extras install docker
    ```
4.  **Start the Docker service:**
    ```bash
    sudo service docker start
    ```
5.  **Add the `ec2-user` to the `docker` group so you can run Docker commands without `sudo`:**
    ```bash
    sudo usermod -a -G docker ec2-user
    ```
6.  **Log out and log back in to apply the group changes.**
7.  **Clone the repository on your EC2 instance:**
    ```bash
    git clone <your-repository-url>
    ```
8.  **Navigate to the project directory:**
    ```bash
    cd <your-project-directory>
    ```
9.  **Build the Docker image:**
    ```bash
    docker build -t my-nextjs-app .
    ```
10. **Run the Docker container:**
    ```bash
    docker run -d -p 80:3000 --name my-nextjs-app my-nextjs-app
    ```

Your application should now be running on your EC2 instance and accessible via its public IP address.

### 5. (Optional) Set up a Domain Name with Route 53

To use a custom domain name, you can use AWS Route 53.

1.  **Open the Route 53 console.**
2.  **If you don't have a registered domain, you can register one with Route 53.**
3.  **Create a hosted zone for your domain.**
4.  **Create an "A" record that points your domain to your EC2 instance's public IP address.**

Now you can access your application using your custom domain name.

---

## Deployment using the AWS CLI

This section will guide you through deploying the application using the AWS Command Line Interface (CLI). This guide assumes you have the AWS CLI installed and configured on your local machine.

### 1. Set up AWS Secrets Manager

Before deploying the application, you need to store your Polygon and Gemini API keys in AWS Secrets Manager.

1.  **Create a JSON file named `secrets.json` with the following content:**
    ```json
    {
      "POLYGON_API_KEY": "your-polygon-api-key",
      "GOOGLE_API_KEY": "your-gemini-api-key"
    }
    ```
2.  **Create the secret in AWS Secrets Manager:**
    ```bash
    aws secretsmanager create-secret --name MyWebApp/ApiKeys --secret-string file://secrets.json
    ```

### 2. Configure IAM Role for EC2

Your EC2 instance will need permission to access these secrets. You will create an IAM role that your EC2 instance will assume.

1.  **Create a trust policy file named `ec2-trust-policy.json`:**
    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": { "Service": "ec2.amazonaws.com" },
          "Action": "sts:AssumeRole"
        }
      ]
    }
    ```
2.  **Create the IAM role:**
    ```bash
    aws iam create-role --role-name EC2SecretsManagerRole --assume-role-policy-document file://ec2-trust-policy.json
    ```
3.  **Attach the `SecretsManagerReadWrite` policy to the role:**
    ```bash
    aws iam attach-role-policy --role-name EC2SecretsManagerRole --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
    ```

### 3. Launch an EC2 Instance

Now, you will launch an EC2 instance and associate the IAM role you just created.

1.  **Get the latest Amazon Linux 2 AMI ID:**
    ```bash
    aws ssm get-parameters --names /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 --query 'Parameters[0].[Value]' --output text
    ```
2.  **Create a security group and add rules:**
    ```bash
    aws ec2 create-security-group --group-name my-sg --description "My security group"
    aws ec2 authorize-security-group-ingress --group-name my-sg --protocol tcp --port 22 --cidr YOUR_IP_ADDRESS/32
    aws ec2 authorize-security-group-ingress --group-name my-sg --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-name my-sg --protocol tcp --port 443 --cidr 0.0.0.0/0
    ```
3.  **Launch the EC2 instance:**
    ```bash
    aws ec2 run-instances --image-id <ami-id> --instance-type t2.micro --key-name <your-key-pair-name> --security-groups my-sg --iam-instance-profile Name=EC2SecretsManagerRole
    ```

### 4. Install Docker and Deploy the Application

Once your EC2 instance is running, you need to connect to it, install Docker, and deploy the application.

1.  **Connect to your instance using SSH:**
    ```bash
    ssh -i /path/to/your-key.pem ec2-user@your-instance-public-ip
    ```
2.  **Run the following commands to install Docker and deploy the application:**
    ```bash
    sudo yum update -y
    sudo amazon-linux-extras install docker
    sudo service docker start
    sudo usermod -a -G docker ec2-user
    git clone <your-repository-url>
    cd <your-project-directory>
    docker build -t my-nextjs-app .
    docker run -d -p 80:3000 --name my-nextjs-app my-nextjs-app
    ```

Your application should now be running on your EC2 instance and accessible via its public IP address.
