const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const Campaign = require('../models/Campaign');

// Listar contactos con filtros
router.get('/contacts', async (req, res) => {
  try {
    const { status, stage, limit = 50, page = 1 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (stage) filter.stage = stage;
    
    const contacts = await Contact.find(filter)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      contacts: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error listando contactos:', error);
    res.status(500).json({ error: 'Error listando contactos' });
  }
});

// Actualizar estado del contacto
router.put('/contacts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    contact.status = status;
    await contact.save();

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      contact: contact
    });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error actualizando estado' });
  }
});

// Vista del pipeline por estados
router.get('/pipeline', async (req, res) => {
  try {
    const pipeline = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          contacts: { $push: '$$ROOT' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const stageStats = await Contact.aggregate([
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      pipeline: pipeline,
      stageStats: stageStats
    });

  } catch (error) {
    console.error('Error obteniendo pipeline:', error);
    res.status(500).json({ error: 'Error obteniendo pipeline' });
  }
});

// Reportes y métricas
router.get('/reports', async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'Activo' });
    
    const statusBreakdown = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stageBreakdown = await Contact.aggregate([
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      metrics: {
        totalContacts,
        activeCampaigns,
        statusBreakdown,
        stageBreakdown
      },
      recentContacts
    });

  } catch (error) {
    console.error('Error generando reportes:', error);
    res.status(500).json({ error: 'Error generando reportes' });
  }
});

// Obtener contacto específico
router.get('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    const campaigns = await Campaign.find({ contactId: id });

    res.json({
      success: true,
      contact: contact,
      campaigns: campaigns
    });

  } catch (error) {
    console.error('Error obteniendo contacto:', error);
    res.status(500).json({ error: 'Error obteniendo contacto' });
  }
});

// Buscar contactos
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Término de búsqueda requerido' });
    }

    const contacts = await Contact.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { businessName: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);

    res.json({
      success: true,
      contacts: contacts
    });

  } catch (error) {
    console.error('Error buscando contactos:', error);
    res.status(500).json({ error: 'Error buscando contactos' });
  }
});

module.exports = router; 