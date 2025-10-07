Production deploy with Caddy (automatic TLS)

1) Copy this repo to your server (for example to `/home/vagrant/resume_builder`) and install Docker + Docker Compose.

2) Create a `.env` file next to `docker-compose.production.yml` with:

```
JWT_SECRET=some_long_random_value
OPENAI_API_KEY=sk-REPLACE
```

3) Point DNS A record for `karuna.021413.xyz` to the server public IP.

4) Run (from `/home/vagrant/resume_builder/deploy`):

```bash
docker compose -f docker-compose.production.yml up -d --build
```

Caddy will automatically obtain TLS certificates for `karuna.021413.xyz` and proxy requests to the frontend and backend.
