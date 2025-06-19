const express = require('express');
const router = express.Router();
const { generateContent, generateEmailSequence } = require('../services/geminiService');
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

module.exports = router; 