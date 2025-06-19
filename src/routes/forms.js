const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const Campaign = require('../models/Campaign');
const { generateEmailSequence } = require('../services/geminiService');

// Formulario inicial de calificación
router.post('/initial', async (req, res) => {
  try {
    const formData = req.body;
    
    // Determinar embudo basado en las respuestas
    let embudo = 'Atraccion';
    
    if (formData.budget && formData.budget.includes('$2000')) {
      embudo = 'Conversion';
    }
    if (formData.budget && formData.budget.includes('$4000')) {
      embudo = 'Relacionamiento';
    }

    // Crear contacto
    const contact = new Contact({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      businessName: formData.businessName,
      stage: embudo,
      formData: formData,
      budget: formData.budget,
      industry: formData.industry,
      challenges: formData.challenges
    });

    await contact.save();

    // Crear campaña
    const campaign = new Campaign({
      contactId: contact._id,
      type: embudo,
      currentStep: 1
    });

    await campaign.save();

    res.json({
      success: true,
      message: 'Formulario procesado correctamente',
      contactId: contact._id,
      campaignId: campaign._id,
      embudo: embudo
    });

  } catch (error) {
    console.error('Error procesando formulario:', error);
    res.status(500).json({ error: 'Error procesando formulario' });
  }
});

// Formulario embudo atracción
router.post('/atraccion', async (req, res) => {
  try {
    const { contactId, formData } = req.body;
    
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    // Actualizar datos del formulario
    contact.formData = { ...contact.formData, ...formData };
    await contact.save();

    // Generar secuencia de emails
    const emails = await generateEmailSequence(contact.formData, 'Atraccion');
    
    // Actualizar campaña
    const campaign = await Campaign.findOne({ contactId });
    if (campaign) {
      campaign.emailSequence = emails;
      await campaign.save();
    }

    res.json({
      success: true,
      message: 'Formulario de atracción procesado',
      emails: emails
    });

  } catch (error) {
    console.error('Error procesando formulario de atracción:', error);
    res.status(500).json({ error: 'Error procesando formulario' });
  }
});

// Formulario embudo conversión
router.post('/conversion', async (req, res) => {
  try {
    const { contactId, formData } = req.body;
    
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    // Actualizar datos del formulario
    contact.formData = { ...contact.formData, ...formData };
    contact.stage = 'Conversion';
    await contact.save();

    // Generar secuencia de emails
    const emails = await generateEmailSequence(contact.formData, 'Conversion');
    
    // Actualizar campaña
    const campaign = await Campaign.findOne({ contactId });
    if (campaign) {
      campaign.type = 'Conversion';
      campaign.emailSequence = emails;
      await campaign.save();
    }

    res.json({
      success: true,
      message: 'Formulario de conversión procesado',
      emails: emails
    });

  } catch (error) {
    console.error('Error procesando formulario de conversión:', error);
    res.status(500).json({ error: 'Error procesando formulario' });
  }
});

// Formulario embudo relacionamiento
router.post('/relacionamiento', async (req, res) => {
  try {
    const { contactId, formData } = req.body;
    
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    // Actualizar datos del formulario
    contact.formData = { ...contact.formData, ...formData };
    contact.stage = 'Relacionamiento';
    await contact.save();

    // Generar secuencia de emails
    const emails = await generateEmailSequence(contact.formData, 'Relacionamiento');
    
    // Actualizar campaña
    const campaign = await Campaign.findOne({ contactId });
    if (campaign) {
      campaign.type = 'Relacionamiento';
      campaign.emailSequence = emails;
      await campaign.save();
    }

    res.json({
      success: true,
      message: 'Formulario de relacionamiento procesado',
      emails: emails
    });

  } catch (error) {
    console.error('Error procesando formulario de relacionamiento:', error);
    res.status(500).json({ error: 'Error procesando formulario' });
  }
});

module.exports = router; 