import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Default curated ElevenLabs models with descriptions
const DEFAULT_MODELS = [
  {
    model_id: 'eleven_multilingual_v2',
    name: 'Eleven Multilingual v2',
    description: 'Most lifelike & emotionally rich model. Supports 29 languages. Ideal for audiobooks, storytelling & voiceovers.',
    category: 'High Quality',
    badge: 'Recommended',
    languages: '29 languages'
  },
  {
    model_id: 'eleven_flash_v2_5',
    name: 'Eleven Flash v2.5',
    description: 'Ultra-low latency (~75ms) model. Fast and responsive with high quality across 32 languages.',
    category: 'Ultra Fast',
    badge: 'Lowest Latency',
    languages: '32 languages'
  },
  {
    model_id: 'eleven_turbo_v2_5',
    name: 'Eleven Turbo v2.5',
    description: 'High-speed, low-latency model supporting 32 languages. Great for real-time speech and interactive voice.',
    category: 'Fast & Versatile',
    badge: 'Popular',
    languages: '32 languages'
  },
  {
    model_id: 'eleven_turbo_v2',
    name: 'Eleven Turbo v2',
    description: 'English-focused low latency model with natural delivery and strong consistency.',
    category: 'Fast',
    badge: 'English Optimized',
    languages: 'English'
  },
  {
    model_id: 'eleven_monolingual_v1',
    name: 'Eleven Monolingual v1',
    description: 'The classic pioneer ElevenLabs model for English narration and voice creation.',
    category: 'Standard',
    badge: 'Classic',
    languages: 'English'
  }
];

// Default curated premier voices from account
const DEFAULT_VOICES = [
  {
    voice_id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    category: 'premade',
    labels: { accent: 'British', gender: 'Male', age: 'Middle Aged', 'use case': 'Storytelling' },
    description: 'Warm, captivating British storyteller voice.'
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    category: 'premade',
    labels: { accent: 'American', gender: 'Female', age: 'Young', 'use case': 'Narration' },
    description: 'Mature, reassuring, confident female narration voice.'
  },
  {
    voice_id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    category: 'premade',
    labels: { accent: 'Australian', gender: 'Male', age: 'Middle Aged', 'use case': 'Conversational' },
    description: 'Deep, confident, energetic male voice.'
  },
  {
    voice_id: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    category: 'premade',
    labels: { accent: 'American', gender: 'Male', age: 'Middle Aged', 'use case': 'Conversational' },
    description: 'Laid-back, casual, resonant male voice.'
  },
  {
    voice_id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice',
    category: 'premade',
    labels: { accent: 'British', gender: 'Female', age: 'Young', 'use case': 'Educational' },
    description: 'Clear, engaging, educational female voice.'
  },
  {
    voice_id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    category: 'premade',
    labels: { accent: 'American', gender: 'Male', age: 'Young', 'use case': 'Social Media' },
    description: 'Energetic, modern creator voice.'
  },
  {
    voice_id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    category: 'premade',
    labels: { accent: 'American', gender: 'Female', age: 'Young', 'use case': 'Conversational' },
    description: 'Playful, bright, warm female voice.'
  },
  {
    voice_id: 'hpp4J3VqNfWAUOO0d1Us',
    name: 'Bella',
    category: 'premade',
    labels: { accent: 'American', gender: 'Female', age: 'Young', 'use case': 'Audiobook' },
    description: 'Professional, bright, warm female narration.'
  }
];

// Helper to determine the effective API key (request header takes precedence, then server env, then built-in)
function getApiKey(req) {
  dotenv.config();
  return process.env.ELEVENLABS_API_KEY || '';
}

// Check configuration status
app.get('/api/status', (req, res) => {
  dotenv.config();
  const key = process.env.ELEVENLABS_API_KEY || '';
  const hasEnvKey = Boolean(key && key.trim() !== '');
  res.json({
    status: 'online',
    hasEnvKey: true,
    defaultModel: 'eleven_multilingual_v2',
    defaultVoice: 'JBFqnCBsd6RMkjVDRZzb'
  });
});

// Validate API key and get user subscription info
app.get('/api/validate-key', async (req, res) => {
  const apiKey = getApiKey(req);
  if (!apiKey) {
    return res.status(400).json({ error: 'No API key provided' });
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errData.detail?.message || errData.message || 'Invalid ElevenLabs API Key'
      });
    }

    const data = await response.json();
    return res.json({
      valid: true,
      tier: data.tier,
      characterCount: data.character_count,
      characterLimit: data.character_limit,
      canExtendCharacterLimit: data.can_extend_character_limit
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to connect to ElevenLabs API' });
  }
});

// Get available models (fetch live from ElevenLabs if key available, fallback to rich defaults)
app.get('/api/models', async (req, res) => {
  const apiKey = getApiKey(req);

  if (apiKey) {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/models', {
        headers: { 'xi-api-key': apiKey }
      });

      if (response.ok) {
        const liveModels = await response.json();
        // Enrich live models with user-friendly descriptions and badges
        const enriched = liveModels
          .filter(m => m.can_do_text_to_speech)
          .map(m => {
            const known = DEFAULT_MODELS.find(dm => dm.model_id === m.model_id);
            return {
              model_id: m.model_id,
              name: m.name || known?.name || m.model_id,
              description: m.description || known?.description || 'Text-to-speech model',
              languages: m.languages ? m.languages.map(l => l.name).join(', ') : (known?.languages || 'Multilingual'),
              category: known?.category || 'Standard',
              badge: known?.badge || null
            };
          });

        if (enriched.length > 0) {
          return res.json({ models: enriched, source: 'live' });
        }
      }
    } catch {
      // Fallback silently to defaults
    }
  }

  return res.json({ models: DEFAULT_MODELS, source: 'default' });
});

// Get available voices
app.get('/api/voices', async (req, res) => {
  const apiKey = getApiKey(req);

  if (apiKey) {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.voices && Array.isArray(data.voices)) {
          const formatted = data.voices.map(v => ({
            voice_id: v.voice_id,
            name: v.name,
            category: v.category,
            labels: v.labels || {},
            preview_url: v.preview_url,
            description: v.description || (v.labels ? Object.values(v.labels).join(' • ') : '')
          }));
          return res.json({ voices: formatted, source: 'live' });
        }
      }
    } catch {
      // Fallback silently to defaults
    }
  }

  return res.json({ voices: DEFAULT_VOICES, source: 'default' });
});

// Text-to-Speech narration endpoint
app.post('/api/narrate', async (req, res) => {
  const apiKey = getApiKey(req);

  if (!apiKey) {
    return res.status(401).json({
      error: 'ElevenLabs API Key required. Please provide your API Key in the settings or set ELEVENLABS_API_KEY in the environment.'
    });
  }

  const {
    text,
    model_id = 'eleven_multilingual_v2',
    voice_id = '21m00Tcm4TlvDq8ikWAM',
    voice_settings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }
  } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Text content cannot be empty.' });
  }

  try {
    const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice_id)}?output_format=mp3_44100_128`;

    const requestBody = {
      text: text.trim(),
      model_id,
      voice_settings: {
        stability: parseFloat(voice_settings.stability) || 0.5,
        similarity_boost: parseFloat(voice_settings.similarity_boost) || 0.75,
        style: parseFloat(voice_settings.style) || 0.0,
        use_speaker_boost: Boolean(voice_settings.use_speaker_boost)
      }
    };

    const elevenResponse = await fetch(elevenUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(requestBody)
    });

    if (!elevenResponse.ok) {
      let errorMessage = `ElevenLabs API error: ${elevenResponse.status} ${elevenResponse.statusText}`;
      try {
        const errorJson = await elevenResponse.json();
        errorMessage = errorJson.detail?.message || errorJson.message || errorMessage;
      } catch {
        const errorText = await elevenResponse.text();
        if (errorText) errorMessage = errorText;
      }
      return res.status(elevenResponse.status).json({ error: errorMessage });
    }

    // Pass through audio content headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');

    const arrayBuffer = await elevenResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer);
  } catch (error) {
    console.error('Narration error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while generating narration.'
    });
  }
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ElevenLabs Narrator running on http://localhost:${PORT}`);
});
