# 🚀 GUIA RÁPIDO - Teste e Deploy

## 📥 Instalação Rápida

```bash
# 1. Instalar dependências backend
cd backend
npm install

# 2. Copiar e configurar .env
cp .env.example .env
nano .env  # Editar variáveis obrigatórias

# 3. Teste rápido
npm run dev
# Deve mostrar: 🚀 Servidor rodando em http://localhost:5000

# 4. Verificar saúde
curl http://localhost:5000/api/health
# Retorna: {"status":"OK","sistema":"SF-DGCI","versao":"1.0.0"}
```

---

## ✅ Testes de Segurança (5 minutos)

### 1️⃣ Rate Limiting

```bash
# Teste: Tentar login 6x em rápida sucessão
for i in {1..6}; do 
  echo "Tentativa $i:"
  curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123456"}' \
    | jq '.error'
done

# Esperado:
# "Email e password são obrigatórios" (tentativa 1-5)
# "Demasiadas tentativas de login. Tente novamente em 15 minutos." (tentativa 6)
```

### 2️⃣ Path Traversal

```bash
# Teste: Tentar aceder a ficheiros fora de uploads
curl -X GET http://localhost:5000/api/download/../../etc/passwd \
  -H "Authorization: Bearer fake-token"

# Esperado: "Caminho inválido" ou "Não autenticado"
```

### 3️⃣ httpOnly Cookies

```bash
# Teste: Verificar se token é httpOnly
curl -i -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sf-dgci.gw","password":"senhaadmin123"}'

# Procurar por: "Set-Cookie: authToken=...;HttpOnly;Secure;SameSite=Strict"
# Se for development: "HttpOnly;SameSite=Strict" (sem Secure)
```

### 4️⃣ Validação de Inputs

```bash
# Teste: Enviar XSS payload
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<script>alert(1)</script>","password":"test"}'

# Esperado: Email sanitizado ou rejeitado
```

### 5️⃣ Proteção de PII

```bash
# Teste: Descarregar lista de membros
curl -X GET http://localhost:5000/api/membros \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0]'

# Esperado (NOT presente para non-admin):
# - nif
# - bi_passaporte
# - email (de outros utilizadores)
```

---

## 📊 Verificar Logs

```bash
# Logs de erro
tail -f backend/logs/error.log

# Todas as ações
tail -f backend/logs/combined.log

# Filtrar por tipo de ação
grep "LOGIN_FALHOU" backend/logs/combined.log
grep "DOWNLOAD_FICHEIRO" backend/logs/combined.log

# Ver auditoria de hoje
tail -100 backend/logs/combined.log | jq 'select(.timestamp | startswith("2026-06-03"))'
```

---

## 🐳 Deploy com Docker

```bash
# 1. Build
docker build -t sf-dgci-backend:latest ./backend

# 2. Preparar volumes
mkdir -p volumes/uploads
mkdir -p volumes/logs

# 3. Run
docker run -d \
  --name sf-dgci \
  -p 5000:5000 \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=SenhaForte123 \
  -e JWT_SECRET=sua_senha_muito_longa_aleatorio \
  -v $(pwd)/volumes/uploads:/app/uploads \
  -v $(pwd)/volumes/logs:/app/logs \
  sf-dgci-backend:latest

# 4. Verificar
docker logs -f sf-dgci
docker exec sf-dgci curl http://localhost:5000/api/health
```

---

## 🚢 Deploy em Produção (Checklist)

### 1️⃣ Preparação

```bash
# Verificar segurança
npm audit  # Deve ter 0 CRITICAL

# Limpar cache
rm -rf node_modules
npm ci --only=production

# Build para produção
npm run build  # Se houver

# Testar em staging
NODE_ENV=production npm start
```

### 2️⃣ Configuração

```bash
# Criar .env seguro
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "NODE_ENV=production" >> .env
echo "PORT=5000" >> .env

# Proteger ficheiro
chmod 600 .env

# NÃO comitar
git add .env
git commit -m "Add production env" --allow-empty
```

### 3️⃣ Database

```bash
# Criar backup antes
pg_dump -U postgres sistema_gestao > backup_pre_deploy.sql

# Rodar migrations (se houver)
npm run migrate

# Verificar integridade
psql -U postgres sistema_gestao -c "\dt"
```

### 4️⃣ Start

```bash
# Usando systemd
sudo systemctl start sf-dgci
sudo systemctl status sf-dgci

# Ou usando Docker
docker-compose -f docker-compose.prod.yml up -d

# Verificar health
curl https://api.sfdgci.mz/api/health
```

### 5️⃣ Validação Pós-Deploy

```bash
# 1. Health check
curl https://api.sfdgci.mz/api/health

# 2. Login teste
curl -X POST https://api.sfdgci.mz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sf-dgci.gw","password":"senha"}'

# 3. Ver logs
tail -f /var/log/sf-dgci.log

# 4. Verificar certificado SSL
openssl s_client -connect api.sfdgci.mz:443 -showcerts
```

---

## 🚨 Troubleshooting

### "Cannot find module 'cookie-parser'"
```bash
npm install cookie-parser --save
npm install
```

### "Cannot connect to database"
```bash
# Verificar conexão
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT NOW();"

# Verificar variáveis
echo $DB_PASSWORD
echo $DB_HOST
```

### "Port 5000 already in use"
```bash
# Encontrar e matar processo
lsof -i :5000 | awk 'NR!=1 {print $2}' | xargs kill -9

# Ou usar outra porta
PORT=5001 npm start
```

### "SSL certificate not valid"
```bash
# Renovar certificado
sudo certbot renew

# Ou gerar novo
sudo certbot certonly --standalone -d api.sfdgci.mz
```

---

## 📈 Performance Tips

```bash
# 1. Habilitar compressão (já está em server.js)
# Verificar: curl -I https://api.sfdgci.mz | grep "content-encoding"

# 2. Indexar database
psql -U postgres sistema_gestao << EOF
CREATE INDEX idx_utilizadores_email ON utilizadores(email);
CREATE INDEX idx_membros_nome ON membros(nome_completo);
CREATE INDEX idx_auditoria_logs_timestamp ON auditoria_logs(created_at);
EOF

# 3. Configurar Redis para sessões
redis-server

# 4. Usar nginx caching
# Ver SECURITY_DEPLOYMENT.md
```

---

## 🔄 Rollback (se problema)

```bash
# 1. Parar serviço
sudo systemctl stop sf-dgci

# 2. Revert código
git revert HEAD
git pull

# 3. Restaurar BD
psql -U postgres sistema_gestao < backup_pre_deploy.sql

# 4. Iniciar
sudo systemctl start sf-dgci

# 5. Verificar
curl https://api.sfdgci.mz/api/health
```

---

## 📋 Checklist de Go-Live

- [ ] Database backup criado
- [ ] SSL certificate válido
- [ ] npm audit sem CRITICAL
- [ ] Health check passando
- [ ] Login teste com utilizador real
- [ ] Rate limiting testado
- [ ] Logs sendo coletados
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] Firewall configurado
- [ ] Equipa notificada
- [ ] Plano de rollback em lugar

---

## 📞 Contactos de Emergência

**Security Issues**: security@sfdgci.mz  
**DevOps**: devops@sfdgci.mz  
**Database Admin**: dba@sfdgci.mz

---

**Última Atualização**: 3 de Junho de 2026  
**Status**: ✅ Pronto para Staging
