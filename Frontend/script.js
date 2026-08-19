// DOM Elements
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const modeItems = document.querySelectorAll('.mode-item');
const currentModeTitle = document.getElementById('current-mode-title');

// State
let currentMode = 'normal';
let chatHistory = []; // Stores conversation context

// 1. Handle Mode Switching
modeItems.forEach(item => {
    item.addEventListener('click', () => {
        // UI Updates
        modeItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // State Updates
        currentMode = item.dataset.mode;
        currentModeTitle.innerText = item.innerText.trim();
        
        // Optional: Clear chat on mode switch for clean context
        chatHistory = [];
        chatBox.innerHTML = '';
        addMessage("System: Mode switched to " + item.innerText.trim(), 'bot-message');
    });
});

// 2. Chat Functions
function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Parse Markdown if it's a bot message
    if (sender === 'bot-message') {
        contentDiv.innerHTML = marked.parse(text);
    } else {
        contentDiv.innerText = text;
    }
    
    msgDiv.appendChild(contentDiv);
    chatBox.appendChild(msgDiv);
    
    // Auto Scroll
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot-message', 'typing-indicator');
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>`;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return typingDiv;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Add User Message to UI
    addMessage(text, 'user-message');
    userInput.value = '';

    // 2. Show Loading
    const typingIndicator = showTyping();

    // 3. Prepare Data
    const payload = {
        message: text,
        mode: currentMode,
        history: chatHistory // Send context
    };

    try {
        // 4. Call Backend
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 5. Remove Loading & Add Bot Response
        chatBox.removeChild(typingIndicator);
        
        if (data.error) {
            addMessage("Error: " + data.error, 'bot-message');
        } else {
            addMessage(data.response, 'bot-message');
            
            // Update History (Client Side Memory)
            chatHistory.push({ role: "user", content: text });
            chatHistory.push({ role: "assistant", content: data.response });
            
            // Keep history limited to prevent large payloads
            if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
        }

    } catch (error) {
        chatBox.removeChild(typingIndicator);
        addMessage("Error: Could not connect to server.", 'bot-message');
    }
}

// 3. Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

clearBtn.addEventListener('click', () => {
    chatBox.innerHTML = '';
    chatHistory = [];
    addMessage("Chat cleared.", 'bot-message');
});