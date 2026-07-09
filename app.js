const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const micButton = document.getElementById('mic-button');
const statusText = document.getElementById('status');

function appendMessage(content, sender, meta) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${sender}`;
  messageEl.textContent = content;

  if (meta) {
    const metaLabel = document.createElement('small');
    metaLabel.textContent = meta;
    messageEl.appendChild(metaLabel);
  }

  chatLog.appendChild(messageEl);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function sendChatMessage(message) {
  appendMessage(message, 'user');
  statusText.textContent = 'Thinking...';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    if (!response.ok) {
      appendMessage(data.error || 'Server error, please try again.', 'bot');
      statusText.textContent = 'Unable to process the request.';
      return;
    }

    appendMessage(data.reply, 'bot', `Detected language: ${data.language}`);
    statusText.textContent = 'Ready for the next message.';
  } catch (error) {
    appendMessage('Unable to reach the server. Make sure the backend is running.', 'bot');
    statusText.textContent = 'Server connection failed.';
  }
}

function handleSubmit() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  sendChatMessage(text);
}

sendButton.addEventListener('click', handleSubmit);
chatInput.addEventListener('keypress', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleSubmit();
  }
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micButton.addEventListener('click', () => {
    if (micButton.classList.contains('listening')) {
      recognition.stop();
      return;
    }

    recognition.start();
    micButton.classList.add('listening');
    micButton.textContent = '🔴';
    statusText.textContent = 'Listening... speak now.';
  });

  recognition.addEventListener('result', event => {
    const transcript = event.results[0][0].transcript;
    micButton.classList.remove('listening');
    micButton.textContent = '🎤';
    statusText.textContent = 'Voice captured. Sending message...';
    chatInput.value = transcript;
    handleSubmit();
  });

  recognition.addEventListener('end', () => {
    micButton.classList.remove('listening');
    micButton.textContent = '🎤';
    statusText.textContent = 'Ready for the next message.';
  });
} else {
  micButton.disabled = true;
  micButton.title = 'Voice input is not supported in this browser';
}
