const express = require('express');
const router = express.Router();
const { generateContent, generateEmailSequence, generateLandingPage, generateFullCopy } = require('../services/geminiService');
const Campaign = require('../models/Campaign');

// Generar contenido usando 17 pasos + Gemini
router.post('/generate', async (req, res) => {
  try {
    const { formData, embudo, step, tipoContenido } = req.body;
    
    const content = await generateContent(formData, embudo, step, tipoContenido);
    
    if (content.success) {
      res.json({
        success: true,
        content: content.content,
        step: content.step,
        embudo: content.embudo,
        tipoContenido: content.tipoContenido
      });
    } else {
      res.status(500).json({ error: content.error });
    }

  } catch (error) {
    console.error('Error generando contenido:', error);
    res.status(500).json({ error: 'Error generando contenido' });
  }
});

// Preview del contenido generado
router.get('/preview/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = await Campaign.findById(campaignId).populate('contactId');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    // Generar secuencia completa de emails
    const emails = await generateEmailSequence(campaign.contactId.formData, campaign.type);
    
    res.json({
      success: true,
      campaign: campaign,
      emails: emails
    });

  } catch (error) {
    console.error('Error obteniendo preview:', error);
    res.status(500).json({ error: 'Error obteniendo preview' });
  }
});

// Aprobar y activar campaña
router.post('/approve/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    campaign.status = 'Activo';
    campaign.nextEmailDate = new Date(); // Enviar primer email inmediatamente
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaña aprobada y activada',
      campaign: campaign
    });

  } catch (error) {
    console.error('Error aprobando campaña:', error);
    res.status(500).json({ error: 'Error aprobando campaña' });
  }
});

// Generar contenido específico para un paso
router.post('/step/:step', async (req, res) => {
  try {
    const { step } = req.params;
    const { formData, embudo, tipoContenido } = req.body;
    
    const content = await generateContent(formData, embudo, parseInt(step), tipoContenido);
    
    if (content.success) {
      res.json({
        success: true,
        content: content.content,
        step: content.step,
        embudo: content.embudo
      });
    } else {
      res.status(500).json({ error: content.error });
    }

  } catch (error) {
    console.error('Error generando contenido para paso:', error);
    res.status(500).json({ error: 'Error generando contenido' });
  }
});

// Nuevo endpoint: Generar solo el copy completo
router.post('/copy', async (req, res) => {
  try {
    const { formData } = req.body;
    // Determinar embudo automáticamente basado en el presupuesto
    let embudo = 'Atraccion';
    if (formData.budget) {
      if (formData.budget.includes('$2000') || formData.budget.includes('$3000')) {
        embudo = 'Conversion';
      }
      if (formData.budget.includes('$4000') || formData.budget.includes('$5000') || formData.budget.includes('Más de $5000')) {
        embudo = 'Relacionamiento';
      }
    }
    // Intentar generar el copy hasta 2 veces si falta alguna sección clave
    let result = await generateFullCopy(formData, embudo);
    const required = ['headline', 'subheadline', 'benefits', 'offer', 'cta'];
    let retries = 0;
    while (retries < 2 && required.some(k => !result.copy?.[k] || result.copy[k].trim() === '')) {
      // Solo reintentar las secciones faltantes
      for (const key of required) {
        if (!result.copy?.[key] || result.copy[key].trim() === '') {
          // Reintentar solo esa sección
          const section = {
            'headline': { step: 1, tipo: 'Headline principal para landing page' },
            'subheadline': { step: 2, tipo: 'Subheadline persuasivo para landing page' },
            'benefits': { step: 8, tipo: 'Lista de 5-6 beneficios clave en bullets' },
            'offer': { step: 10, tipo: 'Oferta irresistible y bonos' },
            'cta': { step: 16, tipo: 'Llamada a la acción clara y directa' }
          }[key];
          try {
            const nuevo = await generateContent(formData, embudo, section.step, section.tipo);
            if (nuevo.success && nuevo.content) {
              result.copy[key] = nuevo.content;
            }
          } catch (e) {}
          await new Promise(r => setTimeout(r, 700));
        }
      }
      retries++;
    }
    // Si aún falta alguna sección, devolver error claro
    const faltantes = required.filter(k => !result.copy?.[k] || result.copy[k].trim() === '');
    if (faltantes.length > 0) {
      return res.status(400).json({ error: `Faltan secciones clave en el copy: ${faltantes.join(', ')}` });
    }
    res.json({ ...result, embudo_determinado: embudo });
  } catch (error) {
    console.error('Error generando copy:', error);
    res.status(500).json({ error: 'Error generando copy' });
  }
});

// Utilidad para limpiar y formatear el copy generado
function formatCopySection(text) {
  if (!text) return '';
  // Negritas Markdown a <strong>
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Saltos de línea dobles a párrafos
  html = html.replace(/\n\n+/g, '</p><p>');
  // Saltos de línea simples a <br>
  html = html.replace(/\n/g, '<br>');
  // Envolver en <p> si no es una lista
  if (!/^<ul|<ol|<li/.test(html.trim())) {
    html = `<p>${html}</p>`;
  }
  return html;
}

// Modificar endpoint de landing: ahora recibe el copy y devuelve el HTML estilizado con Tailwind y copy limpio
router.post('/landing', async (req, res) => {
  try {
    const { copy } = req.body;
    if (!copy || typeof copy !== 'object') {
      return res.status(400).json({ error: 'Se requiere el copy completo en el body' });
    }
    // Limpiar y formatear cada sección
    const headline = formatCopySection(copy.headline);
    const subheadline = formatCopySection(copy.subheadline);
    const benefits = (copy.benefits || '').split(/\n|\r/).filter(Boolean).map(b => `<li class="mb-1">${formatCopySection(b)}</li>`).join('');
    const offer = formatCopySection(copy.offer);
    const cta = formatCopySection(copy.cta);

    // Generar HTML estilizado con Tailwind CDN
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${copy.headline || 'Landing Page'}</title>
  <meta name="description" content="${copy.seo?.description || ''}">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900">
  <div class="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
    <div class="mb-6">
      <div class="text-3xl font-bold text-blue-800 mb-2">${headline}</div>
      <div class="text-xl text-blue-600 mb-4">${subheadline}</div>
    </div>
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Beneficios Clave</h3>
      <ul class="list-disc pl-6 space-y-1 text-base text-gray-800">${benefits}</ul>
    </div>
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Oferta Especial</h3>
      <div class="text-base text-gray-800">${offer}</div>
    </div>
    <a class="block w-full text-center py-3 px-6 bg-blue-700 text-white font-bold rounded-lg shadow hover:bg-blue-800 transition mb-6" href="#form">${cta}</a>
    <footer class="text-xs text-gray-400 mt-8 text-center">Landing generada automáticamente por MerkaticsIA</footer>
  </div>
</body>
</html>`;
    res.json({ success: true, html });
  } catch (error) {
    console.error('Error generando landing:', error);
    res.status(500).json({ error: 'Error generando landing page' });
  }
});

// Chat Wizard - Endpoint minimalista para guía paso a paso
router.post('/wizard', async (req, res) => {
  try {
    const { step, input, formData = {} } = req.body;
    
    if (!step || step < 1 || step > 17) {
      return res.status(400).json({ error: 'Paso inválido (1-17)' });
    }

    // Determinar embudo automáticamente
    let embudo = 'Atraccion';
    if (formData.budget) {
      if (formData.budget.includes('$2000') || formData.budget.includes('$3000')) {
        embudo = 'Conversion';
      }
      if (formData.budget.includes('$4000') || formData.budget.includes('$5000') || formData.budget.includes('Más de $5000')) {
        embudo = 'Relacionamiento';
      }
    }

    // Generar respuesta para el paso actual
    const tiposContenido = {
      1: 'Análisis inicial y recomendación para el paso 1',
      2: 'Estrategia para el paso 2 basada en el input',
      3: 'Plan de acción para el paso 3',
      4: 'Recomendación específica para el paso 4',
      5: 'Análisis del problema y solución',
      6: 'Estrategia de posicionamiento',
      7: 'Plan de credibilidad y autoridad',
      8: 'Lista de beneficios clave',
      9: 'Estrategia de prueba social',
      10: 'Oferta y estructura de precios',
      11: 'Bonos y valor agregado',
      12: 'Apilamiento de valor',
      13: 'Estrategia de precios',
      14: 'Urgencia y escasez',
      15: 'Garantías y confianza',
      16: 'Llamada a la acción',
      17: 'Cierre y P.S.'
    };

    const result = await generateContent(formData, embudo, step, tiposContenido[step] || 'Recomendación general');
    
    // Si la respuesta es insuficiente o vacía, pedir más información y no avanzar
    if (!result.success || !result.content || result.content.trim().length < 20) {
      return res.json({
        success: true,
        currentStep: step,
        nextStep: step,
        isComplete: false,
        response: 'Necesito un poco más de información o detalles para poder darte una recomendación personalizada. ¿Podrías ampliar tu respuesta o ser más específico?',
        embudo: embudo,
        progress: Math.round((step / 17) * 100)
      });
    }

    // Determinar siguiente paso
    const nextStep = step < 17 ? step + 1 : null;
    const isComplete = step === 17;

    res.json({
      success: true,
      currentStep: step,
      nextStep: nextStep,
      isComplete: isComplete,
      response: result.content,
      embudo: embudo,
      progress: Math.round((step / 17) * 100)
    });

  } catch (error) {
    console.error('Error en wizard:', error);
    res.status(500).json({ error: 'Error en el wizard' });
  }
});

module.exports = router; 