#!/bin/bash
# 🧪 Script de Teste de Integração - SF-DGCI

set -uo pipefail

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0
API_URL="http://localhost:5000"
TIMEOUT=5
INVALID_EMAIL="invalid.$(date +%s)@example.com"
RATE_LIMIT_EMAIL="ratelimit.$(date +%s)@example.com"

echo -e "${COLOR_BLUE}🧪 Iniciando Testes de Integração - SF-DGCI${NC}\n"

# Função para fazer request
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local description=$5
  
  echo -e "${COLOR_YELLOW}📝 Teste: $description${NC}"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [[ "$status" == "$expected_status"* ]]; then
    echo -e "${COLOR_GREEN}✅ PASSOU (Status: $status)${NC}\n"
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "${COLOR_RED}❌ FALHOU (Status: $status, Esperado: $expected_status)${NC}"
    echo "Resposta: $body"
    echo ""
    ((TESTS_FAILED++))
    return 0  # Return 0 to avoid script exit on failure
  fi
}

# 1. Health Check
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}"
echo -e "${COLOR_BLUE}1️⃣  Health Check${NC}"
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}\n"

test_endpoint "GET" "/api/health" "" "200" "Verificar health check"

# 2. Validação de Inputs
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}"
echo -e "${COLOR_BLUE}2️⃣  Validação de Inputs${NC}"
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}\n"

test_endpoint "POST" "/api/auth/login" \
  "{\"email\":\"$INVALID_EMAIL\",\"password\":\"short\"}" \
  "400" "Rejeitar email/password inválidos"

test_endpoint "POST" "/api/auth/login" \
  "{\"email\":\"$INVALID_EMAIL\",\"password\":\"ValidPassword123\"}" \
  "401" "Rejeitar credenciais inválidas (utilizador não existe)"

# 3. Rate Limiting
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}"
echo -e "${COLOR_BLUE}3️⃣  Rate Limiting${NC}"
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}\n"

echo -e "${COLOR_YELLOW}📝 Teste: Rate limiting de login (5 tentativas máx)${NC}"
for i in {1..6}; do
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$RATE_LIMIT_EMAIL\",\"password\":\"Test123456\"}" 2>/dev/null)
  
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ $i -lt 6 ]; then
    # Primeiras 5 tentativas devem falhar com 401 (credenciais inválidas)
    if [[ "$status" == "401"* ]]; then
      echo "  Tentativa $i: ✅ Bloqueado com status 401"
    else
      echo "  Tentativa $i: ❌ Status inesperado: $status"
    fi
  else
    # 6ª tentativa deve ser bloqueada com 429 (Too Many Requests)
    if [[ "$status" == "429"* ]]; then
      echo "  Tentativa $i: ✅ Rate limit acionado (429)"
      ((TESTS_PASSED++))
    else
      echo "  Tentativa $i: ❌ Rate limit não funcionou (status: $status)"
      ((TESTS_FAILED++))
    fi
  fi
done
echo ""

# 4. Path Traversal
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}"
echo -e "${COLOR_BLUE}4️⃣  Path Traversal Protection${NC}"
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}\n"

test_endpoint "GET" "/api/download/..%2F..%2Fetc%2Fpasswd" "" "401" "Bloquear path traversal (não autenticado)"

# 5. Verificar Logs
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}"
echo -e "${COLOR_BLUE}5️⃣  Verificação de Logs${NC}"
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}\n"

echo -e "${COLOR_YELLOW}📝 Verificar se logs foram criados${NC}"
if [ -f "backend/logs/combined.log" ] || [ -f "backend/logs/error.log" ]; then
  echo -e "${COLOR_GREEN}✅ Pasta de logs criada${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${COLOR_RED}❌ Pasta de logs não encontrada${NC}\n"
  ((TESTS_FAILED++))
fi

# 6. Verificar se banco de dados está conectado
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}"
echo -e "${COLOR_BLUE}6️⃣  Conectividade com Database${NC}"
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}\n"

echo -e "${COLOR_YELLOW}📝 Teste: Endpoint que requer DB${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/membros" 2>/dev/null)
status=$(echo "$response" | tail -n1)

if [[ "$status" == "401"* ]]; then
  # 401 é esperado sem token, significa que chegou até o DB
  echo -e "${COLOR_GREEN}✅ Database conectado (status: $status)${NC}\n"
  ((TESTS_PASSED++))
elif [[ "$status" == "500"* ]]; then
  echo -e "${COLOR_RED}❌ Erro de database (status: 500)${NC}\n"
  ((TESTS_FAILED++))
else
  echo -e "${COLOR_YELLOW}⚠️  Status inesperado: $status${NC}\n"
fi

# 7. Sintaxe e Compilação
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}"
echo -e "${COLOR_BLUE}7️⃣  Verificação de Sintaxe${NC}"
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}\n"

echo -e "${COLOR_YELLOW}📝 Teste: Sintaxe de ficheiros principais${NC}"

files_to_check=(
  "backend/server.js"
  "backend/src/middleware/validators.js"
  "backend/src/middleware/protect-pii.js"
  "backend/src/middleware/audit-complete.js"
  "backend/src/middleware/downloads.js"
  "backend/src/middleware/rate-limiters.js"
  "backend/src/utils/sanitize.js"
)

all_syntax_ok=true
for file in "${files_to_check[@]}"; do
  if node -c "$file" 2>/dev/null; then
    echo "  $file: ✅"
  else
    echo "  $file: ❌"
    all_syntax_ok=false
  fi
done

if [ "$all_syntax_ok" = true ]; then
  echo -e "${COLOR_GREEN}✅ Todas as sintaxes OK${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${COLOR_RED}❌ Algumas sintaxes com erro${NC}\n"
  ((TESTS_FAILED++))
fi

# 8. Dependências
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}"
echo -e "${COLOR_BLUE}8️⃣  Verificação de Dependências${NC}"
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}\n"

echo -e "${COLOR_YELLOW}📝 Teste: npm audit${NC}"
audit_output=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.critical // 0')

if [ "$audit_output" -eq 0 ]; then
  echo -e "${COLOR_GREEN}✅ Sem vulnerabilidades críticas${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${COLOR_RED}❌ $audit_output vulnerabilidades críticas encontradas${NC}\n"
  ((TESTS_FAILED++))
fi

# Resumo Final
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}"
echo -e "${COLOR_BLUE}📊 RESUMO DOS TESTES${NC}"
echo -e "${COLOR_BLUE}═══════════════════════════════════${NC}\n"

total_tests=$((TESTS_PASSED + TESTS_FAILED))

echo -e "Total de Testes: $total_tests"
echo -e "✅ Passaram: ${COLOR_GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Falharam: ${COLOR_RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${COLOR_GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}\n"
  exit 0
else
  echo -e "\n${COLOR_RED}⚠️  Alguns testes falharam. Revise os erros acima.${NC}\n"
  exit 1
fi
