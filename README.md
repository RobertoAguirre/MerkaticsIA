# 🚀 API Merkatics - Sistema de Marketing Inteligente

Sistema de marketing automatizado que genera contenido personalizado usando Google Gemini AI, basado en la metodología de 17 pasos de Sabri Suby.

## 📋 Características del MVP

- ✅ **Formularios dinámicos** por embudo (Atracción, Conversión, Relacionamiento)
- ✅ **Generación de contenido** con Gemini AI usando metodología de 17 pasos
- ✅ **Secuencias de emails** automatizadas
- ✅ **CRM básico** con pipeline de estados
- ✅ **API REST** simple y fácil de usar

## 🏗️ Arquitectura

```
src/
├── index.js              # Servidor principal
├── config/
│   └── database.js       # Configuración MongoDB
├── models/
│   ├── Contact.js        # Modelo de contactos
│   └── Campaign.js       # Modelo de campañas
├── services/
│   └── geminiService.js  # Servicio de Gemini AI
└── routes/
    ├── forms.js          # Formularios
    ├── content.js        # Generación de contenido
    ├── emails.js         # Envío de emails
    └── crm.js           # Gestión CRM
```

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd MerkaticsIA
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp env.example .env
# Editar .env con tus credenciales
```

4. **Configurar MongoDB**
```bash
# Asegúrate de tener MongoDB corriendo localmente
# O usa MongoDB Atlas
```

5. **Obtener API Key de Gemini**
- Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
- Crea una nueva API key
- Agrega la key a tu archivo .env

## 🎯 Uso

### Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

### Endpoints principales

#### Formularios
- `POST /api/forms/initial` - Formulario inicial
- `POST /api/forms/atraccion` - Formulario embudo atracción
- `POST /api/forms/conversion` - Formulario embudo conversión
- `POST /api/forms/relacionamiento` - Formulario embudo relacionamiento

#### Generación de contenido
- `POST /api/content/generate` - Generar contenido con Gemini
- `GET /api/content/preview/:campaignId` - Preview de contenido
- `POST /api/content/approve/:campaignId` - Aprobar campaña

#### Emails
- `POST /api/emails/send-sequence` - Iniciar secuencia
- `GET /api/emails/status/:campaignId` - Estado de emails
- `POST /api/emails/test` - Email de prueba

#### CRM
- `GET /api/crm/contacts` - Listar contactos
- `PUT /api/crm/contacts/:id/status` - Actualizar estado
- `GET /api/crm/pipeline` - Vista del pipeline
- `GET /api/crm/reports` - Reportes

## 📊 Flujo de trabajo

1. **Usuario llena formulario inicial** → API clasifica y crea contacto
2. **Sistema consulta Gemini AI** → Genera contenido usando 17 pasos
3. **Se programa secuencia de emails** → Según embudo asignado
4. **Emails se envían automáticamente** → Con tracking básico
5. **CRM se actualiza** → Estados cambian según interacciones

## 🤖 Metodología de 17 Pasos

El sistema usa la metodología de Sabri Suby para generar contenido:

1. Dirigirse a la audiencia
2. Demandar atención con gran promesa
3. Respaldar la promesa
4. Crear intriga irresistible
5. Iluminar el problema
6. Proporcionar la solución
7. Mostrar credenciales
8. Detallar beneficios
9. Prueba social
10. Hacer oferta irresistible
11. Agregar bonos
12. Apilar el valor
13. Revelar precio
14. Inyectar escasez
15. Dar garantía poderosa
16. Llamada a la acción
17. Cerrar con P.S.

## 🔧 Configuración

### Variables de entorno requeridas
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/merkatics
GEMINI_API_KEY=tu_gemini_api_key
```

### Variables opcionales
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password
```

## 📝 Ejemplo de uso

### 1. Crear contacto inicial
```bash
curl -X POST http://localhost:3000/api/forms/initial \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@empresa.com",
    "businessName": "Mi Empresa",
    "budget": "$1000-$1999",
    "industry": "Tecnología"
  }'
```

### 2. Generar contenido
```bash
curl -X POST http://localhost:3000/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {"name": "Juan", "businessName": "Mi Empresa"},
    "embudo": "Atraccion",
    "step": 1,
    "tipoContenido": "Email de introducción"
  }'
```

## 🚧 Limitaciones del MVP

- ❌ No incluye autenticación/autorización
- ❌ No incluye tests automatizados
- ❌ Envío de emails simulado (no real)
- ❌ Sin validación avanzada de datos
- ❌ Sin rate limiting
- ❌ Sin logging avanzado

## 🔄 Próximos pasos

- [ ] Implementar envío real de emails con Nodemailer
- [ ] Agregar autenticación JWT
- [ ] Implementar validación con Joi/Zod
- [ ] Agregar tests unitarios
- [ ] Implementar rate limiting
- [ ] Agregar logging estructurado
- [ ] Crear dashboard web
- [ ] Implementar webhooks

## 📞 Soporte

Para soporte técnico o preguntas, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para Merkatics** 