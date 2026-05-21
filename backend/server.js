require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// Garantir que a pasta de uploads existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const fotosDir = path.join(uploadsDir, 'fotos');
const assetsDir = path.join(uploadsDir, 'assets');
const documentosDir = path.join(uploadsDir, 'documentos');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(fotosDir)) fs.mkdirSync(fotosDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  if (!fs.existsSync(documentosDir)) fs.mkdirSync(documentosDir, { recursive: true });
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

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Demasiadas requisições. Tente novamente em breve.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas tentativas de login. Tente novamente em 15 minutos.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// ── Body Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ── Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Static Files ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    sistema: 'SF-DGCI',
    versao: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
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
