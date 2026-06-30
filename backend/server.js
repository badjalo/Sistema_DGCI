require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const winston = require('winston');
const { protectSensitiveData } = require('./src/middleware/protect-pii');
const { auditMiddleware } = require('./src/middleware/audit-complete');
const { secureDownload, servePublicUpload } = require('./src/middleware/downloads');
require('express-async-errors');  // ✅ Catch async errors

const app = express();

// ✅ Logger de Erros (Winston)
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'error',
  format: winston.format.json(),
  defaultMeta: { service: 'sf-dgci-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Garantir que a pasta de uploads existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');

// Criar pasta logs se não existir
const logsDir = path.join(__dirname, 'logs');
try {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
} catch (err) {
  console.error('Erro ao criar diretório de logs:', err);
}
const fotosDir = path.join(uploadsDir, 'fotos');
const assetsDir = path.join(uploadsDir, 'assets');
const documentosDir = path.join(uploadsDir, 'documentos');
const assinaturasDir = path.join(uploadsDir, 'assinaturas');
const obituarioDir = path.join(uploadsDir, 'obituario');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(fotosDir)) fs.mkdirSync(fotosDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  if (!fs.existsSync(documentosDir)) fs.mkdirSync(documentosDir, { recursive: true });
  if (!fs.existsSync(assinaturasDir)) fs.mkdirSync(assinaturasDir, { recursive: true });
  if (!fs.existsSync(obituarioDir)) fs.mkdirSync(obituarioDir, { recursive: true });
} catch (err) {
  console.error('Não foi possível criar diretórios de upload:', err);
}

// ── Security Middleware ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Body Parsers ───────────────────────────────────────────── (ANTES dos rate limiters!)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());  // ✅ Parse cookies para httpOnly tokens
app.use(compression());

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 300,
  message: { error: 'Demasiadas requisições. Tente novamente em breve.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 20 : 5,
  keyGenerator: (req) => req.body.email || req.ip,  // Por email/IP
  message: { error: 'Demasiadas tentativas de login. Tente novamente em 15 minutos.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// ✅ CSRF Protection (exceto GET, HEAD, OPTIONS)
const csrfProtection = csrf({
  cookie: false,  // Usar em session, não em cookie
  sessionKey: 'csrfToken'
});

// ── Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ✅ Middleware de Proteção de PII (remover dados sensíveis de respostas)
app.use('/api/', protectSensitiveData);

// ✅ Middleware de Auditoria Completa (registar TODAS as ações)
app.use('/api/', auditMiddleware);

// ── Serviço Seguro de Uploads ─────────────────────────────────
// Remover a rota pública de uploads
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // ❌ REMOVIDO (inseguro)

// Servir apenas imagens publicamente com proteção
app.get('/public/uploads/:subdir/:filename', servePublicUpload(path.join(__dirname, 'uploads')));
app.get('/uploads/:subdir/:filename', servePublicUpload(path.join(__dirname, 'uploads')));  // compatibilidade com URLs antigas

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/membros', require('./src/routes/membros.routes'));
app.use('/api/utilizadores', require('./src/routes/utilizadores.routes'));
app.use('/api/departamentos', require('./src/routes/departamentos.routes'));
app.use('/api/cargos', require('./src/routes/cargos.routes'));
app.use('/api/quotas', require('./src/routes/quotas.routes'));
app.use('/api/pagamentos', require('./src/routes/pagamentos.routes'));
app.use('/api/financeiro', require('./src/routes/financeiro.routes'));
app.use('/api/documentos', require('./src/routes/documentos.routes'));
app.use('/api/comunicados', require('./src/routes/comunicados.routes'));
app.use('/api/notificacoes', require('./src/routes/notificacoes.routes'));
app.use('/api/relatorios', require('./src/routes/relatorios.routes'));
app.use('/api/cartoes', require('./src/routes/cartoes.routes'));
app.use('/api/dashboard', require('./src/routes/dashboard.routes'));
app.use('/api/configuracoes', require('./src/routes/configuracoes.routes'));
app.use('/api/auditoria', require('./src/routes/auditoria.routes'));
app.use('/api/slider', require('./src/routes/slider.routes'));
app.use('/api/sindicato', require('./src/routes/sindicato.routes'));
app.use('/api/contacto', require('./src/routes/contacto.routes'));
app.use('/api/votacoes', require('./src/routes/votacoes.routes'));
app.use('/api/pesquisa', require('./src/routes/pesquisa.routes'));

// ── Endpoint de Download Seguro ──────────────────────────────
const { authenticate } = require('./src/middleware/auth');
app.get('/api/download/:fileId', authenticate, secureDownload(path.join(__dirname, 'uploads')));
app.get('/api/download/nome/:filename', authenticate, secureDownload(path.join(__dirname, 'uploads')));

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    sistema: 'SF-DGCI',
    versao: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── Servir Frontend React (build estático) ────────────────────
// O frontend compilado fica em ../frontend/dist/ relativo ao backend
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback: todas as rotas não encontradas servem o index.html
  app.get('*', (req, res, next) => {
    // Não interceptar rotas de API
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/public/')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // ── 404 Handler (sem frontend) ────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });
}

// ── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  // ✅ Logging com Winston
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id || 'anonymous',
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // ✅ CSRF token error
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Token CSRF inválido ou ausente' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏛️  SF-DGCI Backend API`);
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`⏰ ${new Date().toLocaleString('pt-PT')}\n`);
});

module.exports = app;
