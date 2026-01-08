# Troubleshooting 404 Not Found

## Masalah
- `https://api-livestock.nafhan.com/` → 404 Not Found
- `https://livestock.nafhan.com/` → 404 Not Found
- Tidak HTTPS

## Langkah Troubleshooting

### 1. Cek Network Traefik Ada
```bash
docker network ls | grep traefik
```

**Jika tidak ada**, buat network:
```bash
docker network create traefik
```

### 2. Cek Services Running
```bash
docker compose -f docker-compose.prod.yml ps
```

Pastikan backend dan frontend status `Up (healthy)`.

### 3. Cek Traefik Detect Services
```bash
# Cek logs Traefik
docker logs traefik --tail 50

# Atau cek dashboard Traefik (jika enabled)
# Biasanya di: https://traefik.nafhan.com
```

Cari log seperti:
```
level=info msg="Server configuration reloaded on :443"
level=info msg="Creating middleware" middlewareName=livestock-backend@docker
```

### 4. Cek Labels di Container
```bash
# Backend
docker inspect livestock-backend-prod | grep -A 20 Labels

# Frontend  
docker inspect livestock-frontend-prod | grep -A 20 Labels
```

Pastikan ada labels:
- `traefik.enable=true`
- `traefik.http.routers.livestock-backend.rule=Host(api-livestock.nafhan.com)`
- `traefik.http.services.livestock-backend.loadbalancer.server.port=3001`

### 5. Cek DNS Pointing
```bash
# Cek DNS resolve
nslookup api-livestock.nafhan.com
nslookup livestock.nafhan.com

# Atau
dig api-livestock.nafhan.com
dig livestock.nafhan.com
```

Pastikan pointing ke IP server yang benar: `31.97.223.172`

### 6. Cek Port Backend/Frontend Accessible
```bash
# Test backend dari dalam server
curl http://localhost:3001/

# Test frontend dari dalam server
curl http://localhost:3000/
```

Jika error, berarti aplikasi belum jalan dengan benar.

### 7. Cek Traefik Configuration File

Traefik perlu konfigurasi untuk:
- Listen di port 80 (HTTP) dan 443 (HTTPS)
- Enable Docker provider
- Enable Let's Encrypt untuk SSL

**Contoh traefik.yml minimal:**
```yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik

certificatesResolvers:
  mytlschallenge:
    acme:
      email: your-email@example.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

### 8. Restart Services
```bash
# Restart livestock services
docker compose -f docker-compose.prod.yml restart backend frontend

# Atau rebuild dan restart
docker compose -f docker-compose.prod.yml up -d --force-recreate backend frontend
```

## Solusi Umum

### Solusi 1: Network Traefik Tidak Ada
```bash
# Buat network
docker network create traefik

# Restart services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Solusi 2: Traefik Tidak Detect Services
Pastikan di `docker-compose.prod.yml`:
```yaml
networks:
  traefik:
    external: true
    name: traefik  # Harus sama dengan network Traefik
```

Dan di services:
```yaml
backend:
  networks:
    - livestock-network
    - traefik  # Harus connect ke network Traefik
  labels:
    - traefik.enable=true
    - traefik.docker.network=traefik  # Penting!
```

### Solusi 3: Port Conflict
Jika ada service lain pakai port 3000/3001:
```bash
# Cek port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Atau
lsof -i :3000
lsof -i :3001
```

### Solusi 4: Expose Port untuk Testing
Sementara untuk testing, expose port di `docker-compose.prod.yml`:
```yaml
backend:
  ports:
    - "3001:3001"  # Tambahkan ini
  # ... rest of config

frontend:
  ports:
    - "3000:3000"  # Tambahkan ini
  # ... rest of config
```

Lalu test:
```bash
curl http://31.97.223.172:3001/
curl http://31.97.223.172:3000/
```

## Cek Traefik Configuration

Jika Traefik sudah running, cek konfigurasinya:

```bash
# Cek Traefik container
docker ps | grep traefik

# Cek Traefik config
docker exec <traefik-container-id> cat /etc/traefik/traefik.yml

# Atau jika pakai docker-compose
cd /path/to/traefik
cat docker-compose.yml
cat traefik.yml
```

## Quick Fix: Expose Ports

Jika mau cepat test tanpa Traefik, expose ports:

**Edit docker-compose.prod.yml:**
```yaml
backend:
  ports:
    - "3001:3001"
  # Comment out Traefik labels
  # labels:
  #   - traefik.enable=true
  #   ...

frontend:
  ports:
    - "3000:3000"
  # Comment out Traefik labels
  # labels:
  #   - traefik.enable=true
  #   ...
```

Lalu akses:
- Backend: `http://31.97.223.172:3001/`
- Frontend: `http://31.97.223.172:3000/`

## Hubungi Saya

Jika masih error, kirim output dari:
```bash
# 1. Network list
docker network ls

# 2. Services status
docker compose -f docker-compose.prod.yml ps

# 3. Backend logs
docker logs livestock-backend-prod --tail 50

# 4. Frontend logs
docker logs livestock-frontend-prod --tail 50

# 5. Traefik logs (jika ada)
docker logs traefik --tail 50

# 6. DNS check
nslookup api-livestock.nafhan.com
nslookup livestock.nafhan.com
```
