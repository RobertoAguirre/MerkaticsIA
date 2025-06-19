const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configurar Gemini AI con manejo de errores
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Usar el modelo más reciente y optimizado
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  }
});

// Metodología de 17 pasos de Sabri Suby
const PASOS_17 = {
  1: 'Dirigirse a la audiencia',
  2: 'Demandar atención con gran promesa',
  3: 'Respaldar la promesa',
  4: 'Crear intriga irresistible',
  5: 'Iluminar el problema',
  6: 'Proporcionar la solución',
  7: 'Mostrar credenciales',
  8: 'Detallar beneficios',
  9: 'Prueba social',
  10: 'Hacer oferta irresistible',
  11: 'Agregar bonos',
  12: 'Apilar el valor',
  13: 'Revelar precio',
  14: 'Inyectar escasez',
  15: 'Dar garantía poderosa',
  16: 'Llamada a la acción',
  17: 'Cerrar con P.S.'
};

// Generar prompt base según el paso y embudo
const generatePrompt = (formData, embudo, step, tipoContenido) => {
  const pasoActual = PASOS_17[step];
  
  return `
Eres un experto en marketing directo siguiendo la metodología de Sabri Suby de 17 pasos.

DATOS DEL CLIENTE:
- Nombre: ${formData.name || 'No especificado'}
- Negocio: ${formData.businessName || 'No especificado'}
- Industria: ${formData.industry || 'No especificado'}
- Presupuesto: ${formData.budget || 'No especificado'}
- Desafíos: ${formData.challenges ? formData.challenges.join(', ') : 'No especificados'}

EMBUDO: ${embudo}
PASO ACTUAL: ${step}/17 - ${pasoActual}
TIPO DE CONTENIDO: ${tipoContenido}

INSTRUCCIONES:
1. Aplica específicamente el paso ${step} de la metodología
2. Personaliza para el tipo de negocio indicado
3. Mantén un tono profesional pero cercano
4. Incluye datos específicos del formulario
5. Genera contenido listo para usar

RESULTADO ESPERADO: ${tipoContenido}
  `;
};

// Función principal para generar contenido con mejor manejo de errores
const generateContent = async (formData, embudo, step, tipoContenido) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    const prompt = generatePrompt(formData, embudo, step, tipoContenido);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No se pudo generar contenido');
    }
    
    return {
      success: true,
      content: text,
      step: step,
      embudo: embudo,
      tipoContenido: tipoContenido
    };
  } catch (error) {
    console.error('Error generando contenido con Gemini:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar contenido'
    };
  }
};

// Generar secuencia de emails para un embudo
const generateEmailSequence = async (formData, embudo) => {
  const sequences = {
    'Atraccion': [
      { step: 1, tipo: 'Email 1 - Introducción y Valor' },
      { step: 5, tipo: 'Email 2 - Educación y Conexión' },
      { step: 16, tipo: 'Email 3 - Acción y Compromiso' }
    ],
    'Conversion': [
      { step: 7, tipo: 'Email 1 - Destacando Valor Único' },
      { step: 10, tipo: 'Email 2 - Simplificando Proceso' },
      { step: 14, tipo: 'Email 3 - Creando Urgencia' },
      { step: 16, tipo: 'Email 4 - Eliminación de Dudas' }
    ],
    'Relacionamiento': [
      { step: 1, tipo: 'Email 1 - Bienvenida + Video' },
      { step: 3, tipo: 'Email 2 - Confirmación y Preparación' },
      { step: 14, tipo: 'Email 3 - Recordatorio de Chat' },
      { step: 8, tipo: 'Email 4 - Preparación Adicional' },
      { step: 16, tipo: 'Email 5 - CTA Final' }
    ]
  };

  const sequence = sequences[embudo] || sequences['Atraccion'];
  const emails = [];

  for (let i = 0; i < sequence.length; i++) {
    const emailData = sequence[i];
    const content = await generateContent(formData, embudo, emailData.step, emailData.tipo);
    
    emails.push({
      emailNumber: i + 1,
      subject: `Email ${i + 1} - ${embudo}`,
      content: content.content,
      step: emailData.step,
      tipo: emailData.tipo
    });
  }

  return emails;
};

module.exports = {
  generateContent,
  generateEmailSequence,
  PASOS_17
}; 