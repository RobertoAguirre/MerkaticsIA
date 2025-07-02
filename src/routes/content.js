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
    const result = await generateFullCopy(formData, embudo);
    if (result.success) {
      res.json({ ...result, embudo_determinado: embudo });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error generando copy:', error);
    res.status(500).json({ error: 'Error generando copy' });
  }
});

// Modificar endpoint de landing: ahora recibe el copy y devuelve el HTML
router.post('/landing', async (req, res) => {
  try {
    const { copy } = req.body;
    if (!copy || typeof copy !== 'object') {
      return res.status(400).json({ error: 'Se requiere el copy completo en el body' });
    }
    // Generar HTML minimalista usando el copy recibido
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${copy.seo?.title || copy.headline || 'Landing Page'}</title>
  <meta name="description" content="${copy.seo?.description || ''}">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; color: #222; }
    .container { max-width: 700px; margin: 0 auto; padding: 2rem; background: #fff; box-shadow: 0 2px 8px #0001; }
    h1, h2, h3 { color: #1a237e; }
    ul { padding-left: 1.2em; }
    .cta { display: block; margin: 2rem 0; padding: 1rem; background: #1a237e; color: #fff; text-align: center; border-radius: 6px; text-decoration: none; font-weight: bold; }
    .testimonials { background: #f1f8e9; padding: 1em; border-radius: 6px; margin: 1em 0; }
    .faq { background: #e3f2fd; padding: 1em; border-radius: 6px; margin: 1em 0; }
    .urgency { color: #c62828; font-weight: bold; }
    .guarantee { color: #388e3c; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${copy.headline}</h1>
    <h2>${copy.subheadline}</h2>
    <p>${copy.opening_paragraph}</p>
    <h3>Beneficios Clave</h3>
    <ul>${(copy.benefits || '').split('\n').map(b => b ? `<li>${b.trim()}</li>` : '').join('')}</ul>
    <h3>¿Cuál es el problema y cómo lo resolvemos?</h3>
    <p>${copy.problem_solution}</p>
    <h3>Características Técnicas</h3>
    <ul>${(copy.features || '').split('\n').map(f => f ? `<li>${f.trim()}</li>` : '').join('')}</ul>
    <h3>Aplicaciones</h3>
    <ul>${(copy.applications || '').split('\n').map(a => a ? `<li>${a.trim()}</li>` : '').join('')}</ul>
    <div class="testimonials">
      <h3>Testimonios</h3>
      ${(copy.testimonials || '').split('\n').map(t => t ? `<p>“${t.trim()}”</p>` : '').join('')}
    </div>
    <h3>Oferta Especial</h3>
    <p>${copy.offer}</p>
    <a class="cta" href="#form">${copy.cta}</a>
    <div class="faq">
      <h3>Preguntas Frecuentes</h3>
      ${(copy.faq || '').split('\n').map(f => f ? `<p>${f.trim()}</p>` : '').join('')}
    </div>
    <p class="urgency">${copy.urgency}</p>
    <p class="guarantee">${copy.guarantee}</p>
  </div>
</body>
</html>`;
    res.json({ success: true, html });
  } catch (error) {
    console.error('Error generando landing:', error);
    res.status(500).json({ error: 'Error generando landing page' });
  }
});

module.exports = router; 