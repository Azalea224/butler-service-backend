# 🚀 Deployment Guide

This guide covers deploying the Butler Service Backend to a VPS from GitHub.

---

## Prerequisites

- A VPS running Ubuntu 20.04+ (or similar Linux distro)
- SSH access to your server
- A domain name (optional, but recommended)
- GitHub repository with this code

---

## Option 1: Docker Deployment (Recommended)

Docker provides the easiest and most consistent deployment experience.

### 1. Install Docker on Your VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (logout/login required after)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 2. Clone the Repository

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/butler-service-backend.git
cd butler-service-backend
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate a secure JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "Generated JWT_SECRET: $JWT_SECRET"

# Edit .env with your values
nano .env
```

**Required environment variables:**
- `JWT_SECRET` - Use the generated secret above
- `GEMINI_API_KEY` - Get from https://aistudio.google.com/apikey

### 4. Deploy with Docker Compose

```bash
# Build and start services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f app
```

### 5. Verify Deployment

```bash
# Test health endpoint
curl http://localhost:3000/api/health
```

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose up -d --build
```

---

## Option 2: Manual Deployment with PM2

For more control, deploy directly with Node.js and PM2.

### 1. Install Node.js

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

### 2. Install MongoDB

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Install PM2

```bash
sudo npm install -g pm2
```

### 4. Clone and Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/butler-service-backend.git
cd butler-service-backend

# Install dependencies
npm ci

# Build TypeScript
npm run build

# Setup environment
cp .env.example .env
nano .env  # Edit with your values
```

### 5. Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 process list (survives reboot)
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

### 6. Useful PM2 Commands

```bash
pm2 status              # Check status
pm2 logs butler-backend # View logs
pm2 monit               # Real-time monitoring
pm2 reload butler-backend # Zero-downtime restart
pm2 stop butler-backend # Stop application
```

### Updating the Application

```bash
cd butler-service-backend
git pull origin main
npm ci
npm run build
pm2 reload butler-backend
```

---

## Setting Up Nginx Reverse Proxy (Recommended)

Use Nginx to handle SSL termination and proxy requests.

### 1. Install Nginx

```bash
sudo apt install nginx -y
```

### 2. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/butler-backend
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/butler-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Monitoring & Maintenance

### View Logs

```bash
# Docker
docker compose logs -f app

# PM2
pm2 logs butler-backend
```

### Health Check

```bash
curl https://your-domain.com/api/health
```

### Backup MongoDB (Docker)

```bash
# Create backup
docker exec butler-mongo mongodump --out /data/db/backup

# Copy backup from container
docker cp butler-mongo:/data/db/backup ./backup
```

### Backup MongoDB (Manual Installation)

```bash
mongodump --out ./backup/$(date +%Y%m%d)
```

---

## GitHub Actions CI/CD (Optional)

Create `.github/workflows/deploy.yml` for automatic deployments:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/butler-service-backend
            git pull origin main
            docker compose up -d --build
```

**Required GitHub Secrets:**
- `VPS_HOST` - Your server IP or domain
- `VPS_USER` - SSH username
- `VPS_SSH_KEY` - Private SSH key

---

## Troubleshooting

### Application won't start

1. Check logs: `docker compose logs app` or `pm2 logs butler-backend`
2. Verify `.env` file exists and has correct values
3. Check MongoDB is running: `docker compose ps` or `sudo systemctl status mongod`

### MongoDB connection errors

1. Ensure MongoDB is running
2. Check `MONGODB_URI` in `.env`
3. For Docker: make sure you're using `mongodb://mongo:27017` (not `localhost`)

### Port already in use

```bash
# Find process using port 3000
sudo lsof -i :3000
# Kill it if needed
sudo kill -9 <PID>
```

---

## Security Checklist

- [ ] Use a strong, randomly generated `JWT_SECRET`
- [ ] Keep `GEMINI_API_KEY` secure and never commit to Git
- [ ] Enable UFW firewall
- [ ] Setup SSL with Let's Encrypt
- [ ] Keep system and packages updated
- [ ] Use non-root user for deployment
- [ ] Regular MongoDB backups

