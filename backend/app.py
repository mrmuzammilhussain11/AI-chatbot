import os
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from groq import Groq

# 1. Setup & Config
load_dotenv()
app = Flask(__name__, static_folder='../frontend', static_url_path='')

# Initialize Groq Client
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

# 2. System Prompts for Modes
SYSTEM_PROMPTS = {
    "normal": "You are a helpful, friendly, and intelligent AI assistant.",
    "study": "You are a university professor. Explain complex topics simply, step-by-step, using examples and analogies.",
    "code": "You are a senior software engineer. Provide clean, efficient, and well-commented code. Explain your logic.",
    "content": "You are a professional content writer. Write engaging, creative, and SEO-friendly content.",
    "english": "You are an English language tutor. Converse with the user, correct their grammar, and suggest better vocabulary."
}

# 3. Serve Frontend (Root URL)
@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

# 4. Chat API Endpoint
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        mode = data.get('mode', 'normal')
        history = data.get('history', []) # List of previous messages

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # Get the specific system prompt
        system_instruction = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS['normal'])

        # Prepare messages for Groq
        # We start with the system prompt, then add context history, then current message
        messages = [{"role": "system", "content": system_instruction}]
        
        # Add last 5 messages for context (prevent token overflow)
        messages.extend(history[-5:]) 
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Call Groq API (Using Llama 3 for speed and quality)
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024,
        )

        bot_response = chat_completion.choices[0].message.content

        return jsonify({"response": bot_response})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == '__main__':
    print("🚀 Server running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)