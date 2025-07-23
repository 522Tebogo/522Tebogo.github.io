document.addEventListener('DOMContentLoaded', () => {
    // ----------------- CONFIGURATION ----------------- //
    //  把这里替换成你在第三步中获得的 Cloudflare Worker URL
    const WORKER_URL = 'https://yellow-cake-8a01.l3280359024.workers.dev'; 
    // ----------------------------------------------- //

    const chatWindow = document.getElementById('chat-window');
    const chatToggleButton = document.getElementById('chat-toggle-button');
    const closeChatButton = document.getElementById('close-chat-button');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = []; // To store the conversation

    // --- Event Listeners ---
    chatToggleButton.addEventListener('click', toggleChatWindow);
    closeChatButton.addEventListener('click', toggleChatWindow);
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    // --- Functions ---
    function toggleChatWindow() {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    }

    function addMessageToUI(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;

        // Check for loading state
        if (sender === 'bot' && text === 'loading') {
            messageElement.innerHTML = `<p class="loading">思考中...</p>`;
            messageElement.id = 'loading-indicator';
        } else {
             messageElement.innerHTML = `<p>${text}</p>`;
        }

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        return messageElement;
    }

    function updateBotMessage(loadingElement, newText) {
         const pElement = loadingElement.querySelector('p');
         if(pElement) {
            pElement.classList.remove('loading');
            pElement.innerText = newText;
         }
    }

    async function sendMessage() {
        const userInput = chatInput.value.trim();
        if (userInput === '') return;

        // Add user message to UI and history
        addMessageToUI('user', userInput);
        conversationHistory.push({ role: 'user', parts: [{ text: userInput }] });
        chatInput.value = '';

        // Show loading indicator
        const loadingIndicator = addMessageToUI('bot', 'loading');

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: conversationHistory }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const botResponse = data.candidates[0].content.parts[0].text;
                updateBotMessage(loadingIndicator, botResponse);
                // Add bot response to history
                conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
            } else {
                updateBotMessage(loadingIndicator, '抱歉，我无法生成回复。');
            }

        } catch (error) {
            console.error('Error fetching Gemini response:', error);
            updateBotMessage(loadingIndicator, '发生错误，请稍后再试。');
        }
    }
});