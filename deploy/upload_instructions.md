# How to transfer this project to your Ubuntu server

Choose one of the transfer options below. After transfer, log in to the server and run `deploy/deploy_on_server.sh` (with sudo) to install Docker, start the services, and apply the database schema.

Prerequisites on your local (Windows) machine
- You have SSH access to the server (user@server_ip) and credentials or SSH key.
- `scp` or `rsync` is available (comes with Windows OpenSSH) or use `git`.

Option A — compress + scp (recommended when you don't have a git remote)

1. Compress the project locally (PowerShell):

```powershell
# run this on your Windows host (example path shown)
cd 'C:\Users\Hp\OneDrive\Documents\resume_builder'
Compress-Archive -Path * -DestinationPath C:\temp\resume_builder.zip -Force
```

2. Copy the zip to the VM/server (replace `user` and `server_ip`):

```powershell
scp C:\temp\resume_builder.zip user@server_ip:~/resume_builder.zip
```

3. SSH to the server and extract into the target project folder `/home/vagrant/resume_builder`:

```bash
ssh user@server_ip
mkdir -p /home/vagrant/resume_builder
unzip ~/resume_builder.zip -d /home/vagrant/resume_builder
cd /home/vagrant/resume_builder/deploy
sudo bash deploy_on_server.sh
```

Option B — rsync (keeps file metadata and is fast for updates)

From PowerShell (you may need to install rsync via Git for Windows or WSL):

```powershell
cd 'C:\Users\Hp\OneDrive\Documents\resume_builder'
rsync -avz -e "ssh" ./ user@server_ip:~/resume_builder

# On server
ssh user@server_ip
cd ~/resume_builder/deploy
sudo bash deploy_on_server.sh
```

Option C — use Git

1. Push repo to a remote (GitHub/GitLab) and then on server:

```bash
git clone <git-url> resume_builder
cd resume_builder/deploy
sudo bash deploy_on_server.sh
```

Notes
- Ensure `karuna.021413.xyz` DNS A record points to the server IP before running the deploy script (Caddy needs to reach the domain to fetch TLS certificates).
- The deploy script will build the frontend, run Docker Compose (production compose file), and attempt to apply the DB schema.
