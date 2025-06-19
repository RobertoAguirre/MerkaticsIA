const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  type: {
    type: String,
    enum: ['Atraccion', 'Conversion', 'Relacionamiento'],
    required: true
  },
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 17
  },
  emailSequence: [{
    emailNumber: Number,
    subject: String,
    content: String,
    sentAt: Date,
    opened: { type: Boolean, default: false },
    clicked: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['Activo', 'Pausado', 'Completado', 'Cancelado'],
    default: 'Activo'
  },
  generatedContent: {
    type: Object,
    default: {}
  },
  nextEmailDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema); 