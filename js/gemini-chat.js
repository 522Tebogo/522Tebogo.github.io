document.addEventListener('DOMContentLoaded', () => {
    // ----------------- CONFIGURATION ----------------- //
    //  把这里替换成你在第三步中获得的 Cloudflare Worker URL
    const WORKER_URL = 'https://gemini-flash.l3280359024.workers.dev/'; 
    // ----------------------------------------------- //

    const chatWindow = document.getElementById('chat-window');
    const chatToggleButton = document.getElementById('chat-toggle-button');
    const closeChatButton = document.getElementById('close-chat-button');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    let isFirstToggle = true;

    

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

   function toggleChatWindow() {
        // 首次切换时，移除内联的 display: none，让 CSS 接管
        if (isFirstToggle) {
            chatWindow.style.display = ''; // 移除内联样式
            isFirstToggle = false; // 将标志位设为 false，确保此操作只执行一次
            
            // 稍作延迟再切换 class，以确保 display 的改变先生效，从而触发动画
            setTimeout(() => {
                chatWindow.classList.toggle('hidden');
            }, 10);

        } else {
            chatWindow.classList.toggle('hidden');
        }

        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    }
// 在 gemini-chat.js 文件中，替换这两个函数

function addMessageToUI(sender, text) {
    const messageElement = document.createElement('div');
    // 添加一个初始动画class
    messageElement.className = `message ${sender}-message animate-in`;

    if (sender === 'user') {
        messageElement.innerHTML = `<p>${text}</p>`;
    } else { // sender === 'bot'
        const avatarHTML = '<div class="bot-avatar"></div>';
        let textHTML;

        if (text === 'loading') {
            // 这是新的“三点跳动”加载动画的HTML结构
            textHTML = `
                <p class="loading">
                    <span class="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </p>
            `;
            messageElement.id = 'loading-indicator';
        } else {
            textHTML = `<p>${text}</p>`;
        }
        messageElement.innerHTML = avatarHTML + textHTML;
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement;
}

function updateBotMessage(loadingElement, newText) {
    if (loadingElement) {
        const pElement = loadingElement.querySelector('p');
        if (pElement) {
            // 直接用新的文本内容替换掉整个p标签的内容
            pElement.innerHTML = newText;
            pElement.classList.remove('loading');
        }
        loadingElement.id = '';
    }
}

    // 在您的 gemini-chat.js 文件中，找到并替换这个函数

async function sendMessage() {
    const userInput = chatInput.value.trim();
    if (userInput === '') return;

    // 添加用户消息到UI和历史记录
    addMessageToUI('user', userInput);
    // 注意：这里的格式是针对Gemini的，如果换成DeepSeek需要修改
    conversationHistory.push({ role: 'user', parts: [{ text: userInput }] });
    chatInput.value = '';

    // 创建“加载中”的消息元素
    const loadingElement = addMessageToUI('bot', 'loading');
    
    // --- 新增代码：获取头像元素并开始动画 ---
    const avatarElement = loadingElement.querySelector('.bot-avatar');
    if (avatarElement) {
        avatarElement.classList.add('thinking');
    }
    // --- 新增结束 ---

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: conversationHistory }),
        });

        // --- 新增代码：在处理回复前，先停止动画 ---
        if (avatarElement) {
            avatarElement.classList.remove('thinking');
        }
        // --- 新增结束 ---

        if (!response.ok) {
            // 如果HTTP状态码不是2xx，也当作错误处理
            const errorData = await response.json();
            throw new Error(errorData.error.message || `API Error: ${response.status}`);
        }

        const data = await response.json();

        // 检查是否有错误字段，即使状态码是200
        if (data.error) {
            throw new Error(data.error.message);
        }

        if (data.candidates && data.candidates.length > 0) {
            const botResponse = data.candidates[0].content.parts[0].text;
            updateBotMessage(loadingElement, botResponse);
            conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
        } else {
            // 收到成功响应但内容为空，可能是安全拦截
            updateBotMessage(loadingElement, '抱歉，我无法生成回复。（可能触发了安全策略）');
        }

    } catch (error) {
        // --- 新增代码：如果请求过程出错，也要停止动画 ---
        if (avatarElement) {
            avatarElement.classList.remove('thinking');
        }
        // --- 新增结束 ---
        console.error('Error fetching Gemini response:', error);
        updateBotMessage(loadingElement, `发生错误：${error.message}`);
    }
}
});