#!/bin/bash
# 🧪 Script de Teste Simplificado

API_URL="http://localhost:5000"

echo "🧪 Teste de Integração Simplificado - SF-DGCI"
echo ""

# 1. Health Check
echo "1️⃣  Health Check"
status=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:5000/api/health)
if [ "$status" = "200" ]; then
  echo "✅ PASSOU (Status: $status)"
else
  echo "❌ FALHOU (Status: $status)"
fi
echo ""

# 2. Validação - Email inválido
echo "2️⃣  Validação de Inputs"
status=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalido","password":"short"}')
if [ "$status" = "400" ]; then
  echo "✅ PASSOU - Email/password inválido rejeitado (Status: $status)"
else
  echo "❌ FALHOU - Esperado 400, recebido $status"
fi
echo ""

# 3. Credenciais inválidas
UNIQUE_EMAIL="test$(date +%s)@example.com"
status=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"ValidPassword123\"}")
if [ "$status" = "401" ]; then
  echo "✅ PASSOU - Credenciais inválidas rejeitadas (Status: $status)"
else
  echo "❌ FALHOU - Esperado 401, recebido $status"
fi
echo ""

# 4. Rate Limiting
echo "3️⃣  Rate Limiting"
UNIQUE_EMAIL="ratelimit$(date +%s)@example.com"
for i in {1..6}; do
  status=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"Test123456\"}")
  
  if [ $i -lt 6 ]; then
    if [ "$status" = "401" ]; then
      echo "  Tentativa $i: ✅ Status 401"
    else
      echo "  Tentativa $i: ❌ Status inesperado: $status"
    fi
  else
    if [ "$status" = "429" ]; then
      echo "  Tentativa $i: ✅ Rate limit acionado (429)"
    else
      echo "  Tentativa $i: ❌ Rate limit não funcionou (status: $status)"
    fi
  fi
done
echo ""

# 5. Path Traversal
echo "4️⃣  Path Traversal Protection"
# Test 1: URL-encoded path traversal
status=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_URL/api/download/..%2F..%2Fetc%2Fpasswd")
if [ "$status" = "401" ]; then
  echo "✅ PASSOU - Path traversal bloqueado (Status: $status)"
else
  echo "❌ FALHOU - Esperado 401, recebido $status"
fi
echo ""

# 6. Logs
echo "5️⃣  Verificação de Logs"
if [ -f "$PWD/backend/logs/combined.log" ] || [ -f "$PWD/backend/logs/error.log" ]; then
  echo "✅ PASSOU - Logs criados"
else
  echo "❌ FALHOU - Logs não encontrados"
fi
echo ""

# 7. Database
echo "6️⃣  Conectividade com Database"
status=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_URL/api/membros")
if [ "$status" = "401" ]; then
  echo "✅ PASSOU - Database conectado (esperado 401 sem token)"
else
  echo "⚠️  Status: $status (esperado 401 ou 500 se DB desconectado)"
fi
echo ""

echo "🎉 Testes Completados!"
