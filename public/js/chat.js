// Chat Wizard JavaScript para MerkaticsIA

class ChatWizard {
    constructor() {
        this.currentStep = 1;
        this.formData = {};
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.updateProgress();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.chatForm = document.getElementById('chatForm');
        this.sendButton = document.getElementById('sendButton');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.progressFill = document.getElementById('progressFill');
        this.currentStepElement = document.getElementById('currentStep');
    }

    bindEvents() {
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserInput();
        });

        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleUserInput();
            }
        });

        // Auto-focus en el input
        this.messageInput.focus();
    }

    async handleUserInput() {
        const userMessage = this.messageInput.value.trim();
        
        if (!userMessage || this.isLoading) return;

        // Agregar mensaje del usuario
        this.addMessage(userMessage, 'user');
        this.messageInput.value = '';

        // Mostrar loading
        this.showLoading();

        try {
            // Enviar al API
            const response = await this.sendToAPI(userMessage);
            
            // Ocultar loading
            this.hideLoading();

            if (response.success) {
                // Actualizar datos del formulario
                if (response.embudo) {
                    this.formData.embudo = response.embudo;
                }

                // Agregar respuesta del bot
                this.addMessage(response.response, 'bot');

                // Avanzar de paso solo si nextStep > currentStep
                if (response.nextStep && response.nextStep > this.currentStep) {
                    this.currentStep = response.nextStep;
                }
                this.updateProgress();

                // Si es el último paso, mostrar resumen
                if (response.isComplete) {
                    this.showCompletionMessage();
                }
            } else {
                this.addMessage('Lo siento, hubo un error. Por favor, intenta de nuevo.', 'bot');
            }
        } catch (error) {
            console.error('Error en chat:', error);
            this.hideLoading();
            this.addMessage('Lo siento, hubo un error de conexión. Por favor, verifica tu conexión e intenta de nuevo.', 'bot');
        }
    }

    async sendToAPI(userInput) {
        const response = await fetch('/api/content/wizard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                step: this.currentStep,
                input: userInput,
                formData: this.formData
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type} fade-in-up`;
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="d-flex align-items-start justify-content-end">
                    <div class="flex-grow-1 text-end">
                        <p class="mb-0">${this.escapeHtml(content)}</p>
                    </div>
                    <div class="ms-3">
                        <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="d-flex align-items-start">
                    <div class="me-3">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                            <i class="fas fa-robot"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-2 text-primary">MerkaticsIA Wizard</h6>
                        <div class="mb-0">${this.formatBotMessage(content)}</div>
                    </div>
                </div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatBotMessage(content) {
        // Convertir saltos de línea en <br>
        let formatted = content.replace(/\n/g, '<br>');
        
        // Resaltar texto importante
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Crear listas si hay bullets
        if (formatted.includes('•') || formatted.includes('-')) {
            formatted = formatted.replace(/([•-]\s*.*?)(?=<br>|$)/g, '<li>$1</li>');
            formatted = formatted.replace(/(<li>.*?<\/li>)/s, '<ul class="mb-2">$1</ul>');
        }
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        this.isLoading = true;
        this.sendButton.disabled = true;
        this.messageInput.disabled = true;
        this.loadingIndicator.style.display = 'block';
    }

    hideLoading() {
        this.isLoading = false;
        this.sendButton.disabled = false;
        this.messageInput.disabled = false;
        this.loadingIndicator.style.display = 'none';
    }

    updateProgress() {
        const progress = (this.currentStep / 17) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.currentStepElement.textContent = this.currentStep;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showCompletionMessage() {
        setTimeout(() => {
            this.addMessage(`
                <div class="alert alert-success">
                    <h5><i class="fas fa-trophy me-2"></i>¡Felicitaciones!</h5>
                    <p class="mb-2">Has completado el wizard de marketing. Ahora tienes:</p>
                    <ul class="mb-3">
                        <li>Estrategias personalizadas para tu negocio</li>
                        <li>Copy persuasivo listo para usar</li>
                        <li>Recomendaciones específicas para cada paso</li>
                        <li>Una hoja de ruta clara para implementar</li>
                    </ul>
                    <p class="mb-0"><strong>¿Te gustaría generar una landing page completa con todo este contenido?</strong></p>
                </div>
            `, 'bot');
        }, 1000);
    }
}

// Función global para reiniciar el chat
function resetChat() {
    if (confirm('¿Estás seguro de que quieres reiniciar el chat? Perderás todo el progreso.')) {
        location.reload();
    }
}

// Inicializar el chat cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.chatWizard = new ChatWizard();
});

// Función para generar landing page (opcional)
async function generateLandingPage() {
    try {
        const response = await fetch('/api/content/copy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                formData: window.chatWizard.formData
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Generar HTML de la landing
            const landingResponse = await fetch('/api/content/landing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    copy: result.copy
                })
            });

            const landingResult = await landingResponse.json();
            
            if (landingResult.success) {
                // Abrir la landing en una nueva ventana
                const newWindow = window.open('', '_blank');
                newWindow.document.write(landingResult.html);
                newWindow.document.close();
            }
        }
    } catch (error) {
        console.error('Error generando landing:', error);
        alert('Error generando la landing page. Por favor, intenta de nuevo.');
    }
}

// Mejoras de UX
document.addEventListener('DOMContentLoaded', () => {
    // Auto-resize del input
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Smooth scroll para el chat
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.style.scrollBehavior = 'smooth';
}); 