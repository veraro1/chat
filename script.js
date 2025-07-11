/* ===========================================
   VARIABLES GLOBALES
=========================================== */
const WEBHOOK_URL = 'https://work.infinitewebai.space/webhook/e9df9544-ee5f-404c-b208-aa6424b8406e';

// Elementos del DOM
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatIcon = document.getElementById('chatIcon');
const debugToggle = document.getElementById('debugToggle');
const debugContent = document.getElementById('debugContent');
const debugStatus = document.getElementById('debugStatus');
const debugRawResponse = document.getElementById('debugRawResponse');
const debugProcessedResponse = document.getElementById('debugProcessedResponse');

// Estado del chat
let isOpen = false;
let isWaitingResponse = false;

/* ===========================================
   FUNCIONES DE INTERFAZ
=========================================== */

// Alternar visibilidad del chat
function toggleChat() {
    isOpen = !isOpen;
    
    if (isOpen) {
        chatWindow.style.display = 'flex';
        chatToggle.classList.add('active');
        chatIcon.textContent = '✕';
        messageInput.focus();
    } else {
        chatWindow.style.display = 'none';
        chatToggle.classList.remove('active');
        chatIcon.textContent = '💬';
    }
}

// Alternar panel de depuración
debugToggle.addEventListener('click', () => {
    const isActive = debugContent.classList.toggle('active');
    debugToggle.textContent = isActive ? 'Ocultar' : 'Mostrar';
});

// Actualizar panel de depuración
function updateDebugPanel(status, rawResponse, processedResponse) {
    debugStatus.textContent = status;
    debugRawResponse.textContent = rawResponse || '-';
    debugProcessedResponse.textContent = processedResponse || '-';
}

// Añadir mensaje al chat
function addMessage(content, isUser = false, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    if (isError) {
        messageDiv.className = 'message error-message';
    }
    
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    
    // Auto-scroll al final
    scrollToBottom();
}

// Mostrar indicador de "escribiendo..."
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        Escribiendo...
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

// Ocultar indicador de "escribiendo..."
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll automático al final
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Habilitar/deshabilitar input
function setInputEnabled(enabled) {
    messageInput.disabled = !enabled;
    sendButton.disabled = !enabled;
    isWaitingResponse = !enabled;
}

/* ===========================================
   FUNCIONES DE COMUNICACIÓN
=========================================== */

// Extraer texto de la respuesta JSON
function extractTextFromResponse(response) {
    try {
        // Intenta parsear como JSON
        const data = JSON.parse(response);
        
        // Busca propiedades comunes que puedan contener el texto
        if (data.response) return data.response;
        if (data.message) return data.message;
        if (data.text) return data.text;
        if (data.answer) return data.answer;
        
        // Si no encuentra propiedades conocidas, busca cualquier propiedad de texto
        for (const key in data) {
            if (typeof data[key] === 'string') {
                return data[key];
            }
        }
        
        // Si no encuentra texto, devuelve el JSON completo como string
        return JSON.stringify(data);
    } catch (e) {
        // Si no es JSON válido, devuelve la respuesta original
        return response;
    }
}

// Enviar mensaje al webhook
async function sendMessage(message) {
    try {
        updateDebugPanel('Enviando mensaje...', '', '');
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        // Obtener la respuesta como texto (respuesta en bruto)
        const rawText = await response.text();
        
        // Extraer solo el texto de la respuesta
        const textResponse = extractTextFromResponse(rawText);
        
        // Actualizar panel de depuración
        updateDebugPanel('Respuesta recibida', rawText, textResponse);
        
        return textResponse;
        
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        updateDebugPanel('Error: ' + error.message, '', '');
        throw error;
    }
}

// Procesar envío de mensaje
async function handleSendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isWaitingResponse) {
        return;
    }

    // Limpiar input y deshabilitar
    messageInput.value = '';
    setInputEnabled(false);

    // Añadir mensaje del usuario
    addMessage(message, true);

    // Mostrar indicador de escribiendo
    showTypingIndicator();

    try {
        // Enviar mensaje al webhook y obtener respuesta
        const botResponse = await sendMessage(message);
        
        // Ocultar indicador y mostrar respuesta
        hideTypingIndicator();
        addMessage(botResponse, false);
        
    } catch (error) {
        // Ocultar indicador y mostrar error
        hideTypingIndicator();
        addMessage('❌ Error de conexión. Por favor, intenta de nuevo.', false, true);
    } finally {
        // Rehabilitar input
        setInputEnabled(true);
        messageInput.focus();
    }
}

/* ===========================================
   EVENT LISTENERS
=========================================== */

// Toggle del chat
chatToggle.addEventListener('click', toggleChat);

// Enviar mensaje con botón
sendButton.addEventListener('click', handleSendMessage);

// Enviar mensaje con Enter
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});

/* ===========================================
   INICIALIZACIÓN
=========================================== */

// Configuración inicial
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Chat Widget inicializado correctamente');
    console.log('📡 Webhook URL:', WEBHOOK_URL);
    
    // Focus en el input cuando se abre el chat
    messageInput.addEventListener('focus', () => {
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    });
    
    // Mensaje de bienvenida en el panel de depuración
    updateDebugPanel('Listo para recibir mensajes', '', '');
});