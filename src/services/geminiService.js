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

// Nueva función: Generar copy completo y HTML minimalista para landing page
const generateLandingPage = async (formData, embudo) => {
  try {
    // 1. Generar cada sección del copy usando prompts específicos
    const sections = [
      { key: 'headline', step: 1, tipo: 'Headline principal para landing page' },
      { key: 'subheadline', step: 2, tipo: 'Subheadline persuasivo para landing page' },
      { key: 'opening_paragraph', step: 3, tipo: 'Párrafo de apertura que conecte con el dolor del cliente' },
      { key: 'benefits', step: 8, tipo: 'Lista de 5-6 beneficios clave en bullets' },
      { key: 'problem_solution', step: 5, tipo: 'Sección problema-solución' },
      { key: 'features', step: 6, tipo: 'Lista de características técnicas principales' },
      { key: 'applications', step: 8, tipo: 'Lista de aplicaciones o usos recomendados' },
      { key: 'testimonials', step: 9, tipo: '2 testimonios de clientes simulados' },
      { key: 'offer', step: 10, tipo: 'Oferta irresistible y bonos' },
      { key: 'cta', step: 16, tipo: 'Llamada a la acción clara y directa' },
      { key: 'faq', step: 13, tipo: '3-5 preguntas frecuentes con respuesta breve' },
      { key: 'urgency', step: 14, tipo: 'Sección de urgencia y escasez' },
      { key: 'guarantee', step: 15, tipo: 'Sección de garantías y confianza' },
      { key: 'seo', step: 1, tipo: 'Título SEO, meta descripción y palabras clave para la landing' }
    ];

    const copy = {};
    for (const section of sections) {
      try {
        const result = await generateContent(formData, embudo, section.step, section.tipo);
        copy[section.key] = result.content || '';
      } catch (e) {
        copy[section.key] = '';
      }
      // Delay para evitar saturar la API de Gemini
      await new Promise(r => setTimeout(r, 400));
    }

    // 2. Generar HTML minimalista usando el copy generado
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

    return {
      success: true,
      copy,
      html
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Error generando landing page'
    };
  }
};

// Nueva función: Generar solo el copy completo para la landing page (MVP robusto)
const generateFullCopy = async (formData, embudo) => {
  try {
    // Solo 5 secciones clave para el MVP
    const sections = [
      { key: 'headline', step: 1, tipo: 'Headline principal para landing page' },
      { key: 'subheadline', step: 2, tipo: 'Subheadline persuasivo para landing page' },
      { key: 'benefits', step: 8, tipo: 'Lista de 5-6 beneficios clave en bullets' },
      { key: 'offer', step: 10, tipo: 'Oferta irresistible y bonos' },
      { key: 'cta', step: 16, tipo: 'Llamada a la acción clara y directa' }
    ];

    const copy = {};
    const errores = [];
    for (const section of sections) {
      try {
        const result = await generateContent(formData, embudo, section.step, section.tipo);
        copy[section.key] = result.content || '';
      } catch (e) {
        copy[section.key] = '';
        errores.push(section.key);
      }
      // Delay mayor para evitar saturar la API
      await new Promise(r => setTimeout(r, 700));
    }
    return { success: true, copy, errores };
  } catch (error) {
    return { success: false, error: error.message || 'Error generando copy' };
  }
};

module.exports = {
  generateContent,
  generateEmailSequence,
  PASOS_17,
  generateLandingPage,
  generateFullCopy
}; 