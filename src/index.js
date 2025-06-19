const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar conexión a base de datos
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB
connectDB();

// Middleware básico
app.use(cors());
app.use(express.json());

// Rutas básicas
app.use('/api/forms', require('./routes/forms'));
app.use('/api/content', require('./routes/content'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/crm', require('./routes/crm'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Merkatics - Sistema de Marketing Inteligente',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      forms: '/api/forms',
      content: '/api/content',
      emails: '/api/emails',
      crm: '/api/crm'
    }
  });
});

// Manejo de errores básico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 API disponible en: http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/merkatics'}`);
}); 