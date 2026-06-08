# 🔐 Guia de Segurança & Deployment - SF-DGCI

## 📋 Checklist de Segurança (CRÍTICO)

### 🔴 ANTES DE CADA DEPLOY

- [ ] **DB_PASSWORD definida em .env** (não usar fallback 'sf_dgci_2026')
- [ ] **JWT_SECRET** é uma string aleatória de 32+ caracteres
- [ ] **NODE_ENV=production** em servidor de produção
- [ ] **Certificado SSL/TLS** válido e em renovação automática
- [ ] **CORS_ORIGIN** restritos apenas a domínios autorizados
- [ ] **Folder `/logs` com permissões 750** (apenas app pode escrever)
- [ ] **Folder `/uploads` com permissões 755** (apenas app pode descarregar)

### 🔐 Configuração de Variáveis de Ambiente

```bash
# .env - NUNCA comitar para git!
NODE_ENV=production
PORT=5000

# Database (usar senha forte!)
DB_HOST=db.seu-servidor.com
DB_PORT=5432
DB_NAME=sf_dgci_prod
DB_USER=sf_dgci_user
DB_PASSWORD=SenhaForte123!@#$%^&*()

# JWT (gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=seu_jwt_secret_muito_longo_32_caracteres_aleatorio
JWT_EXPIRES_IN=24h

# URLs
FRONTEND_URL=https://app.sfdgci.mz
API_URL=https://api.sfdgci.mz

# Logging
LOG_LEVEL=error
LOG_FILE=logs/combined.log

# Email
SMTP_HOST=smtp.seu-email.com
SMTP_PORT=587
SMTP_USER=seu-email@sfdgci.mz
SMTP_PASSWORD=sua_senha_app
EMAIL_FROM=noreply@sfdgci.mz
```

### 📦 Instalação e Setup

```bash
# 1. Instalar dependências
cd backend
npm install --production

# 2. Verificar vulnerabilidades
npm audit

# 3. Executar migrations (se houver)
npm run migrate

# 4. Testar servidor
npm run dev  # Desenvolvimento
npm start    # Produção

# 5. Verificar logs
tail -f logs/combined.log
```

---

## 🚀 Deploy com Docker

### Dockerfile

```dockerfile
FROM node:18.19-alpine

# Criar utilizador não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S app -u 1001

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências de produção apenas
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código
COPY --chown=app:nodejs . .

# Criar folder de logs
RUN mkdir -p logs && \
    chown app:nodejs logs

# Switch para user não-root
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 5000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: sf_dgci_prod
      POSTGRES_USER: sf_dgci_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: sf_dgci_prod
      DB_USER: sf_dgci_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/uploads:/app/uploads
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Deploy no Linux (Systemd)

```bash
# 1. Criar file de serviço
sudo nano /etc/systemd/system/sf-dgci.service
```

```ini
[Unit]
Description=SF-DGCI Backend API
After=network.target

[Service]
Type=simple
User=app
WorkingDirectory=/home/app/sf-dgci/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=5000"

[Install]
WantedBy=multi-user.target
```

```bash
# 2. Ativar e iniciar
sudo systemctl daemon-reload
sudo systemctl enable sf-dgci
sudo systemctl start sf-dgci
sudo systemctl status sf-dgci

# 3. Ver logs
sudo journalctl -u sf-dgci -f
```

---

## 🔒 Segurança em Produção

### Nginx Reverse Proxy

```nginx
upstream sf_dgci_backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name api.sfdgci.mz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.sfdgci.mz;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.sfdgci.mz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sfdgci.mz/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy
    location / {
        proxy_pass http://sf_dgci_backend;
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

### Firewall (UFW)

```bash
# Permitir SSH, HTTP, HTTPS
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Backup da Base de Dados

```bash
#!/bin/bash
# backup.sh - Cron job diário

BACKUP_DIR="/backups/sf-dgci"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sf_dgci_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

# Fazer backup
pg_dump -U sf_dgci_user sf_dgci_prod | gzip > $BACKUP_FILE

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Upload para remote (opcional)
# s3cmd put $BACKUP_FILE s3://meu-bucket-backups/

echo "Backup criado: $BACKUP_FILE"
```

Adicionar ao crontab:
```bash
crontab -e
# Diariamente às 2 AM
0 2 * * * /home/app/backup.sh
```

---

## 📊 Monitoramento

### Logs

```bash
# Ver erros em tempo real
tail -f logs/error.log

# Ver todas as ações de auditoria
tail -f logs/combined.log

# Buscar tentativas de login falhadas
grep "LOGIN_FALHOU" logs/combined.log
```

### Métricas

Instalar Prometheus + Grafana:

```bash
npm install prom-client  # Para métricas
```

---

## 🧪 Teste de Segurança

```bash
# 1. Verificar vulnerabilidades de dependências
npm audit

# 2. Teste de rate limiting
for i in {1..10}; do curl -X POST http://localhost:5000/api/auth/login; done

# 3. Teste de HTTPS
curl -I https://api.sfdgci.mz

# 4. Testar cookies httpOnly
curl -I https://api.sfdgci.mz/api/auth/me
# Verificar: Set-Cookie: authToken=...; HttpOnly; Secure; SameSite=Strict

# 5. Teste de path traversal
curl "https://api.sfdgci.mz/api/download/name/../../etc/passwd"
# Deve retornar: "Caminho inválido"
```

---

## 📋 Checklist Pré-Produção

- [ ] Todos os secrets definidos em .env
- [ ] HTTPS/SSL ativado
- [ ] Backups automáticos configurados
- [ ] Logs sendo coletados
- [ ] Monitoramento ativo
- [ ] Rate limiting testado
- [ ] CORS restrito
- [ ] Firewall configurado
- [ ] npm audit sem vulnerabilidades críticas
- [ ] Testes de segurança passaram
- [ ] Database hardened (apenas app pode conectar)
- [ ] Disaster recovery plan em lugar

---

## 🚨 Incident Response

Se houver suspeita de brecha:

1. **Revoke tokens**: Limpar sessões em Redis
2. **Backup logs**: Arquivar logs de auditoria
3. **Review auditoria**: `SELECT * FROM auditoria_logs WHERE created_at > NOW() - INTERVAL '24 hours'`
4. **Reset passwords**: Forçar reset de passwords de utilizadores afetados
5. **Notificar**: Informar utilizadores e reguladores (GDPR/LGPD)

---

## 📞 Contacto de Segurança

Para reportar vulnerabilidades: security@sfdgci.mz
