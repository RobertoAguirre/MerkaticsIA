const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  businessName: String,
  status: {
    type: String,
    enum: ['Lead', 'Oportunidad', 'Prospecto', 'Cliente', 'Cliente_Recurrente', 'Inactivo', 'Perdido'],
    default: 'Lead'
  },
  stage: {
    type: String,
    enum: ['Atraccion', 'Conversion', 'Relacionamiento'],
    default: 'Atraccion'
  },
  formData: {
    type: Object,
    default: {}
  },
  tags: [String],
  budget: {
    type: String,
    enum: ['Menos de $500', '$500-$999', '$1000-$1999', '$2000-$2999', '$3000-$3999', '$4000-$4999', 'Más de $5000']
  },
  industry: String,
  challenges: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema); 