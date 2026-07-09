const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const franc = require('franc-min');
const translate = require('@vitalets/google-translate-api');

const app = express();
const port = process.env.PORT || 3000;

const englishResponses = {
  greeting: 'Hello! I can chat with you in English, Hindi, Tamil, Spanish, French, and more. Ask me anything.',
  thanks: 'You are welcome! Feel free to ask another question in any language.',
  help: 'I can answer simple questions, provide guidance, and keep the conversation going in your language.',
  farewell: 'Goodbye! Come back anytime if you want to chat more.',
  default: 'I can help with general questions in your language. Tell me what you would like to know.'
};

function detectLanguage(text) {
  const langTag = franc(text, { minLength: 3 });
  return langTag === 'und' ? 'en' : langTag;
}

function chooseEnglishResponse(text) {
  const normalized = text.toLowerCase();

  if (/\b(hi|hello|hey|hola|bonjour|namaste|வணக்கம்|नमस्ते)\b/.test(normalized)) {
    return englishResponses.greeting;
  }

  if (/\b(thank|thanks|merci|gracias|धन्यवाद|நன்றி)\b/.test(normalized)) {
    return englishResponses.thanks;
  }

  if (/\b(help|assist|support|क्या|உதவி|ayuda|aide)\b/.test(normalized)) {
    return englishResponses.help;
  }

  if (/\b(bye|goodbye|see you|adios|au revoir|பிரியாவிடை|विदा)\b/.test(normalized)) {
    return englishResponses.farewell;
  }

  return englishResponses.default;
}

async function generateResponse(message) {
  const detected = detectLanguage(message);
  const englishReply = chooseEnglishResponse(message);

  if (detected.startsWith('en')) {
    return { reply: englishReply, language: 'English' };
  }

  try {
    const translated = await translate(englishReply, { to: detected });
    return { reply: translated.text, language: detected };
  } catch (err) {
    console.warn('Translation failed, returning English fallback:', err.message || err);
    return { reply: englishReply, language: detected };
  }
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string.' });
  }

  try {
    const response = await generateResponse(message);
    res.json(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Unable to process the message at this time.' });
  }
});

app.listen(port, () => {
  console.log(`Language-agnostic chatbot server running on http://localhost:${port}`);
});
