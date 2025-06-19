const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');

// Iniciar secuencia de emails
router.post('/send-sequence', async (req, res) => {
  try {
    const { campaignId } = req.body;
    
    const campaign = await Campaign.findById(campaignId).populate('contactId');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    // Simular envío de emails (en un MVP real usarías nodemailer)
    const emailsToSend = campaign.emailSequence.filter(email => !email.sentAt);
    
    for (let email of emailsToSend) {
      email.sentAt = new Date();
      email.opened = false;
      email.clicked = false;
      
      console.log(`📧 Email ${email.emailNumber} enviado a ${campaign.contactId.email}`);
      console.log(`📝 Asunto: ${email.subject}`);
      console.log(`📄 Contenido: ${email.content.substring(0, 100)}...`);
    }

    campaign.status = 'Activo';
    await campaign.save();

    res.json({
      success: true,
      message: `Secuencia iniciada - ${emailsToSend.length} emails programados`,
      emailsSent: emailsToSend.length
    });

  } catch (error) {
    console.error('Error iniciando secuencia:', error);
    res.status(500).json({ error: 'Error iniciando secuencia' });
  }
});

// Estado de emails enviados
router.get('/status/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = await Campaign.findById(campaignId).populate('contactId');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    const emailStats = campaign.emailSequence.map(email => ({
      emailNumber: email.emailNumber,
      subject: email.subject,
      sentAt: email.sentAt,
      opened: email.opened,
      clicked: email.clicked,
      tipo: email.tipo
    }));

    res.json({
      success: true,
      campaign: {
        id: campaign._id,
        type: campaign.type,
        status: campaign.status,
        currentStep: campaign.currentStep
      },
      contact: {
        name: campaign.contactId.name,
        email: campaign.contactId.email,
        businessName: campaign.contactId.businessName
      },
      emails: emailStats
    });

  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({ error: 'Error obteniendo estado' });
  }
});

// Enviar email de prueba
router.post('/test', async (req, res) => {
  try {
    const { email, subject, content } = req.body;
    
    // Simular envío de email de prueba
    console.log(`🧪 Email de prueba enviado a: ${email}`);
    console.log(`📝 Asunto: ${subject}`);
    console.log(`📄 Contenido: ${content.substring(0, 100)}...`);

    res.json({
      success: true,
      message: 'Email de prueba enviado correctamente',
      to: email,
      subject: subject
    });

  } catch (error) {
    console.error('Error enviando email de prueba:', error);
    res.status(500).json({ error: 'Error enviando email de prueba' });
  }
});

// Marcar email como abierto
router.post('/open/:campaignId/:emailNumber', async (req, res) => {
  try {
    const { campaignId, emailNumber } = req.params;
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    const email = campaign.emailSequence.find(e => e.emailNumber == emailNumber);
    if (email) {
      email.opened = true;
      await campaign.save();
    }

    res.json({
      success: true,
      message: 'Email marcado como abierto'
    });

  } catch (error) {
    console.error('Error marcando email como abierto:', error);
    res.status(500).json({ error: 'Error marcando email' });
  }
});

// Marcar email como clickeado
router.post('/click/:campaignId/:emailNumber', async (req, res) => {
  try {
    const { campaignId, emailNumber } = req.params;
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    const email = campaign.emailSequence.find(e => e.emailNumber == emailNumber);
    if (email) {
      email.clicked = true;
      await campaign.save();
    }

    res.json({
      success: true,
      message: 'Email marcado como clickeado'
    });

  } catch (error) {
    console.error('Error marcando email como clickeado:', error);
    res.status(500).json({ error: 'Error marcando email' });
  }
});

module.exports = router; 