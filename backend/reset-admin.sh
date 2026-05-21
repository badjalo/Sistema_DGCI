#!/bin/bash

# Script para resetar senha do admin via psql

DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="sistema_gestao"
DB_USER="Badjalo"
DB_PASSWORD="Badjalo25"

ADMIN_EMAIL="admin@sf-dgci.gw"
ADMIN_PASSWORD="Admin@2026!"

# Hash da senha usando node (bcrypt)
HASH=$(node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('$ADMIN_PASSWORD', 10, (err, hash) => {
  if (err) process.exit(1);
  console.log(hash);
});
")

if [ -z "$HASH" ]; then
  echo "❌ Erro ao gerar hash da senha"
  exit 1
fi

echo "✅ Hash gerado: $HASH"
echo ""

# Executar comando SQL
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<SQL
-- Resetar senha do admin
UPDATE utilizadores 
SET password_hash = '$HASH', ativo = true, atualizado_em = NOW()
WHERE email = '$ADMIN_EMAIL';

-- Se não existe, criar
INSERT INTO utilizadores (nome, email, password_hash, perfil, ativo)
SELECT 'Administrador', '$ADMIN_EMAIL', '$HASH', 'administrador', true
WHERE NOT EXISTS (SELECT 1 FROM utilizadores WHERE email = '$ADMIN_EMAIL');

-- Exibir resultado
SELECT id, nome, email, ativo FROM utilizadores WHERE email = '$ADMIN_EMAIL';
SQL

echo ""
echo "✅ Credenciais atualizadas!"
echo ""
echo "Login:"
echo "  📧 Email: $ADMIN_EMAIL"
echo "  🔐 Senha: $ADMIN_PASSWORD"
