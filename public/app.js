/**
 * ElevenLabs Narrator - Frontend Application Logic
 */

// State Management
const state = {
  apiKey: localStorage.getItem('elevenlabs_api_key') || '',
  hasEnvKey: false,
  models: [],
  voices: [],
  selectedModel: 'eleven_multilingual_v2',
  selectedVoice: 'JBFqnCBsd6RMkjVDRZzb',
  audioUrl: null,
  audioBlob: null,
  isPlaying: false,
  isGenerating: false,
  playbackSpeed: 1,
  history: [],
  audioContext: null,
  analyser: null,
  sourceNode: null,
  visualizerInitialized: false
};

// Preset Sample Texts
const SAMPLE_TEXTS = {
  story: "Deep within the ancient observatory, a telescope pointed toward a celestial coordinate that shouldn't have existed. Maya adjusted the brass dial, holding her breath as a faint harmonic resonance echoed through the stone corridor.",
  tech: "Welcome to the next generation of voice synthesis. Powered by ElevenLabs neural acoustic models, speech can now be generated with ultra-low latency, dynamic emotional cadence, and lifelike presence.",
  meditation: "Take a slow, deep breath in... and let it gently out. Allow your shoulders to relax, and listen to the stillness around you. You are completely safe, calm, and grounded in this moment.",
  podcast: "Hey everyone, welcome back to Sound & Frequency. Today we're exploring the intersection of creative AI, dynamic storytelling, and how synthetic voices are transforming the way we consume ideas."
};

// Model Metadata Map for Rich Previews
const MODEL_DETAILS = {
  'eleven_multilingual_v2': {
    name: 'Eleven Multilingual v2',
    category: 'Multilingual',
    latency: 'Standard (~300ms)',
    languages: '29 Languages',
    bestFor: 'Audiobooks, Storytelling & Long-form Voiceovers',
    description: 'Most lifelike & emotionally rich model. Supports 29 languages. Ideal for audiobooks & storytelling.'
  },
  'eleven_flash_v2_5': {
    name: 'Eleven Flash v2.5',
    category: 'Ultra-Fast',
    latency: 'Ultra-Low (~75ms)',
    languages: '32 Languages',
    bestFor: 'Real-time Dialog, Conversational AI & Rapid Preview',
    description: 'Ultra-low latency (~75ms) model. Fast and responsive with high quality across 32 languages.'
  },
  'eleven_turbo_v2_5': {
    name: 'Eleven Turbo v2.5',
    category: 'Turbo High-Q',
    latency: 'Low Latency (~150ms)',
    languages: '32 Languages',
    bestFor: 'Interactive Voice, High-Speed Narrations & Media',
    description: 'High-speed, low-latency model supporting 32 languages. Great for real-time speech and interactive voice.'
  },
  'eleven_turbo_v2': {
    name: 'Eleven Turbo v2',
    category: 'English Turbo',
    latency: 'Low Latency (~150ms)',
    languages: 'English',
    bestFor: 'Fast English Narration & Video Overlays',
    description: 'English-focused low latency model with natural delivery and strong consistency.'
  },
  'eleven_monolingual_v1': {
    name: 'Eleven Monolingual v1',
    category: 'Classic',
    latency: 'Standard (~350ms)',
    languages: 'English',
    bestFor: 'Classic English Voice Projects',
    description: 'The classic pioneer ElevenLabs model for English narration and voice creation.'
  }
};

// DOM Elements
const elements = {
  // Header / API Key
  apiKeyBtn: document.getElementById('apiKeyBtn'),
  apiKeyStatusDot: document.getElementById('apiKeyStatusDot'),
  apiKeyBtnText: document.getElementById('apiKeyBtnText'),
  apiKeyModal: document.getElementById('apiKeyModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
  testKeyBtn: document.getElementById('testKeyBtn'),
  saveKeyBtn: document.getElementById('saveKeyBtn'),
  keyStatusBox: document.getElementById('keyStatusBox'),
  keyStatusText: document.getElementById('keyStatusText'),
  testSpinner: document.getElementById('testSpinner'),

  // Text Area & Samples
  narratorTextInput: document.getElementById('narratorTextInput'),
  charCount: document.getElementById('charCount'),
  wordCount: document.getElementById('wordCount'),
  estDuration: document.getElementById('estDuration'),
  clearTextBtn: document.getElementById('clearTextBtn'),
  sampleBtns: document.querySelectorAll('.chip-btn'),

  // Selectors
  modelSelect: document.getElementById('modelSelect'),
  voiceSelect: document.getElementById('voiceSelect'),
  modelCategoryBadge: document.getElementById('modelCategoryBadge'),
  voiceAccentBadge: document.getElementById('voiceAccentBadge'),
  modelDescription: document.getElementById('modelDescription'),
  voiceDescription: document.getElementById('voiceDescription'),

  // Sliders & Fine Tuning
  toggleVoiceSettingsBtn: document.getElementById('toggleVoiceSettingsBtn'),
  voiceSettingsAccordion: document.getElementById('voiceSettingsAccordion'),
  sliderStability: document.getElementById('sliderStability'),
  sliderSimilarity: document.getElementById('sliderSimilarity'),
  sliderStyle: document.getElementById('sliderStyle'),
  checkSpeakerBoost: document.getElementById('checkSpeakerBoost'),
  valStability: document.getElementById('valStability'),
  valSimilarity: document.getElementById('valSimilarity'),
  valStyle: document.getElementById('valStyle'),

  // Action Buttons
  narrateBtn: document.getElementById('narrateBtn'),
  narrateBtnText: document.getElementById('narrateBtnText'),
  narrateSpinner: document.getElementById('narrateSpinner'),
  narratePlayIcon: document.getElementById('narratePlayIcon'),
  stopBtn: document.getElementById('stopBtn'),

  // Player & Waveform
  playerPanel: document.getElementById('playerPanel'),
  playerStatusBadge: document.getElementById('playerStatusBadge'),
  playerTrackTitle: document.getElementById('playerTrackTitle'),
  waveformCanvas: document.getElementById('waveformCanvas'),
  currentTime: document.getElementById('currentTime'),
  totalDuration: document.getElementById('totalDuration'),
  seekSlider: document.getElementById('seekSlider'),
  scrubProgress: document.getElementById('scrubProgress'),
  playPauseToggleBtn: document.getElementById('playPauseToggleBtn'),
  playPauseIcon: document.getElementById('playPauseIcon'),
  replayBtn: document.getElementById('replayBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  speedBtns: document.querySelectorAll('.speed-btn'),
  volumeSlider: document.getElementById('volumeSlider'),
  nativeAudio: document.getElementById('nativeAudio'),

  // Sidebar Specs & History
  specModelName: document.getElementById('specModelName'),
  specModelLatency: document.getElementById('specModelLatency'),
  specModelLanguages: document.getElementById('specModelLanguages'),
  specModelBestFor: document.getElementById('specModelBestFor'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),

  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================
// Initialization
// ==========================================
async function initApp() {
  setupEventListeners();
  loadSavedHistory();
  await checkServerStatus();
  await fetchModels();
  await fetchVoices();
  updateApiKeyStatusUI();
  updateTextMetrics();
  initIdleWaveform();

  // Load a welcoming sample text by default so the user can test with 1 click immediately
  elements.narratorTextInput.value = SAMPLE_TEXTS.story;
  updateTextMetrics();
}

// Check server status & whether server .env key is available
async function checkServerStatus() {
  try {
    const res = await fetch('/api/status');
    if (res.ok) {
      const data = await res.json();
      state.hasEnvKey = Boolean(data.hasEnvKey);
    }
  } catch (err) {
    console.warn('Server status check warning:', err);
  }
}

// Fetch available ElevenLabs models
async function fetchModels() {
  try {
    const headers = {};
    if (state.apiKey) headers['x-api-key'] = state.apiKey;
    const res = await fetch('/api/models', { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        state.models = data.models;
        renderModelOptions();
      }
    }
  } catch (err) {
    console.error('Failed to fetch models:', err);
  }
}

// Render Model Select Options
function renderModelOptions() {
  if (!state.models.length) return;
  const select = elements.modelSelect;
  const currentVal = select.value;
  select.innerHTML = '';

  state.models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.model_id;
    const badgeText = m.badge ? ` (${m.badge})` : '';
    opt.textContent = `${m.name}${badgeText}`;
    select.appendChild(opt);
  });

  if (state.models.some(m => m.model_id === currentVal)) {
    select.value = currentVal;
  } else {
    select.value = state.models[0].model_id;
  }

  handleModelChange();
}

// Fetch available voices
async function fetchVoices() {
  try {
    const headers = {};
    if (state.apiKey) headers['x-api-key'] = state.apiKey;
    const res = await fetch('/api/voices', { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.voices && Array.isArray(data.voices)) {
        state.voices = data.voices;
        renderVoiceOptions();
      }
    }
  } catch (err) {
    console.error('Failed to fetch voices:', err);
  }
}

// Render Voice Select Options
function renderVoiceOptions() {
  if (!state.voices.length) return;
  const select = elements.voiceSelect;
  const currentVal = select.value;
  select.innerHTML = '';

  state.voices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.voice_id;
    const labelList = [];
    if (v.labels?.accent) labelList.push(v.labels.accent);
    if (v.labels?.gender) labelList.push(v.labels.gender);
    if (v.labels?.['use case']) labelList.push(v.labels['use case']);
    const labelStr = labelList.length ? ` (${labelList.join(' • ')})` : '';
    opt.textContent = `${v.name}${labelStr}`;
    select.appendChild(opt);
  });

  if (state.voices.some(v => v.voice_id === currentVal)) {
    select.value = currentVal;
  } else {
    select.value = state.voices[0].voice_id;
  }

  handleVoiceChange();
}

// ==========================================
// Event Listeners
// ==========================================
function setupEventListeners() {
  // Text area inputs
  elements.narratorTextInput.addEventListener('input', updateTextMetrics);
  elements.clearTextBtn.addEventListener('click', () => {
    elements.narratorTextInput.value = '';
    elements.narratorTextInput.focus();
    updateTextMetrics();
  });

  // Sample prompt chips
  elements.sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.sample;
      if (SAMPLE_TEXTS[key]) {
        elements.narratorTextInput.value = SAMPLE_TEXTS[key];
        elements.narratorTextInput.focus();
        updateTextMetrics();
        showToast('Sample text inserted', 'info');
      }
    });
  });

  // Select dropdowns
  elements.modelSelect.addEventListener('change', handleModelChange);
  elements.voiceSelect.addEventListener('change', handleVoiceChange);

  // Sliders
  elements.sliderStability.addEventListener('input', e => {
    elements.valStability.textContent = parseFloat(e.target.value).toFixed(2);
  });
  elements.sliderSimilarity.addEventListener('input', e => {
    elements.valSimilarity.textContent = parseFloat(e.target.value).toFixed(2);
  });
  elements.sliderStyle.addEventListener('input', e => {
    elements.valStyle.textContent = parseFloat(e.target.value).toFixed(2);
  });

  // Accordion toggle
  elements.toggleVoiceSettingsBtn.addEventListener('click', () => {
    const isOpen = elements.voiceSettingsAccordion.classList.toggle('open');
    elements.toggleVoiceSettingsBtn.setAttribute('aria-expanded', isOpen);
  });

  // Play / Narrate Action
  elements.narrateBtn.addEventListener('click', startNarration);
  elements.stopBtn.addEventListener('click', stopNarration);

  // Native Audio player events
  elements.nativeAudio.addEventListener('timeupdate', updatePlaybackProgress);
  elements.nativeAudio.addEventListener('loadedmetadata', updateDurationDisplay);
  elements.nativeAudio.addEventListener('play', () => setPlaybackState(true));
  elements.nativeAudio.addEventListener('pause', () => setPlaybackState(false));
  elements.nativeAudio.addEventListener('ended', onAudioEnded);
  elements.nativeAudio.addEventListener('error', onAudioError);

  // Custom Player Controls
  elements.playPauseToggleBtn.addEventListener('click', togglePlayPause);
  elements.replayBtn.addEventListener('click', replayAudio);
  elements.seekSlider.addEventListener('input', onSeekInput);
  elements.downloadBtn.addEventListener('click', downloadCurrentAudio);

  // Speed controls
  elements.speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.playbackSpeed = parseFloat(btn.dataset.speed);
      elements.nativeAudio.playbackRate = state.playbackSpeed;
    });
  });

  // Volume
  elements.volumeSlider.addEventListener('input', e => {
    elements.nativeAudio.volume = parseFloat(e.target.value);
  });

  // API Key Modal Controls
  elements.apiKeyBtn.addEventListener('click', openApiKeyModal);
  elements.closeModalBtn.addEventListener('click', closeApiKeyModal);
  elements.apiKeyModal.addEventListener('click', e => {
    if (e.target === elements.apiKeyModal) closeApiKeyModal();
  });
  elements.toggleKeyVisibilityBtn.addEventListener('click', toggleApiKeyVisibility);
  elements.saveKeyBtn.addEventListener('click', saveApiKey);
  elements.testKeyBtn.addEventListener('click', testApiKey);

  // History controls
  elements.clearHistoryBtn.addEventListener('click', clearHistory);
}

// ==========================================
// Handlers for Model & Voice Selection
// ==========================================
function handleModelChange() {
  const modelId = elements.modelSelect.value;
  state.selectedModel = modelId;

  const info = MODEL_DETAILS[modelId] || {
    name: modelId,
    category: 'Custom',
    latency: 'Standard',
    languages: 'Multilingual',
    bestFor: 'General Voice Narration',
    description: 'ElevenLabs Voice Synthesis Model'
  };

  elements.modelCategoryBadge.textContent = info.category;
  elements.modelDescription.textContent = info.description;

  // Update right sidebar specs
  elements.specModelName.textContent = info.name;
  elements.specModelLatency.textContent = info.latency;
  elements.specModelLanguages.textContent = info.languages;
  elements.specModelBestFor.textContent = info.bestFor;
}

function handleVoiceChange() {
  const voiceId = elements.voiceSelect.value;
  state.selectedVoice = voiceId;

  const voice = state.voices.find(v => v.voice_id === voiceId);
  if (voice) {
    const labels = voice.labels || {};
    const labelParts = [];
    if (labels.accent) labelParts.push(labels.accent);
    if (labels.gender) labelParts.push(labels.gender);
    elements.voiceAccentBadge.textContent = labelParts.join(' • ') || 'Premier Voice';
    elements.voiceDescription.textContent = voice.description || 'ElevenLabs High-Fidelity Voice';
  }
}

// ==========================================
// Text Metrics Calculator
// ==========================================
function updateTextMetrics() {
  const text = elements.narratorTextInput.value || '';
  const charLength = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Approx speech rate: 150 words / min = 2.5 words / sec
  const estSeconds = Math.round(words / 2.5);

  elements.charCount.textContent = `${charLength} characters`;
  elements.wordCount.textContent = `${words} words`;
  elements.estDuration.textContent = `~${estSeconds}s estimated audio`;
}

// ==========================================
// API Key Status & Management
// ==========================================
function updateApiKeyStatusUI() {
  const hasKey = Boolean(state.apiKey || state.hasEnvKey);
  if (hasKey) {
    elements.apiKeyStatusDot.classList.add('active');
    elements.apiKeyBtnText.textContent = state.apiKey ? 'API Key (Active)' : 'API Ready (Built-in)';
  } else {
    elements.apiKeyStatusDot.classList.remove('active');
    elements.apiKeyBtnText.textContent = 'Set API Key';
  }
}

function openApiKeyModal() {
  elements.apiKeyInput.value = state.apiKey || '';
  elements.keyStatusBox.style.display = 'none';
  elements.apiKeyModal.style.display = 'flex';
  elements.apiKeyInput.focus();
}

function closeApiKeyModal() {
  elements.apiKeyModal.style.display = 'none';
}

function toggleApiKeyVisibility() {
  const type = elements.apiKeyInput.type === 'password' ? 'text' : 'password';
  elements.apiKeyInput.type = type;
}

async function testApiKey() {
  const keyToTest = elements.apiKeyInput.value.trim() || state.apiKey;
  if (!keyToTest) {
    displayKeyStatus('Please enter an API Key to test.', 'error');
    return;
  }

  elements.testSpinner.style.display = 'inline-block';
  elements.testKeyBtn.disabled = true;

  try {
    const res = await fetch('/api/validate-key', {
      headers: { 'x-api-key': keyToTest }
    });

    const data = await res.json();
    if (res.ok && data.valid) {
      const remainingChars = (data.characterLimit - data.characterCount).toLocaleString();
      displayKeyStatus(`Connected! Plan: ${data.tier} • ${remainingChars} chars remaining`, 'success');
      showToast('ElevenLabs API Key is valid & connected!', 'success');
    } else {
      displayKeyStatus(data.error || 'Invalid API Key', 'error');
    }
  } catch (err) {
    displayKeyStatus('Failed to connect to verification server: ' + err.message, 'error');
  } finally {
    elements.testSpinner.style.display = 'none';
    elements.testKeyBtn.disabled = false;
  }
}

function displayKeyStatus(message, type) {
  elements.keyStatusBox.style.display = 'flex';
  elements.keyStatusBox.className = `key-status-box ${type}`;
  elements.keyStatusText.textContent = message;
}

function saveApiKey() {
  const key = elements.apiKeyInput.value.trim();
  state.apiKey = key;
  if (key) {
    localStorage.setItem('elevenlabs_api_key', key);
    showToast('API Key saved successfully!', 'success');
  } else {
    localStorage.removeItem('elevenlabs_api_key');
    showToast('Local API Key cleared.', 'info');
  }
  updateApiKeyStatusUI();
  closeApiKeyModal();

  // Refresh dynamic models & voices using the new key
  fetchModels();
  fetchVoices();
}

// ==========================================
// ElevenLabs Narration Workflow (The Play Action)
// ==========================================
async function startNarration() {
  const text = elements.narratorTextInput.value.trim();

  // Validation: Check text
  if (!text) {
    showToast('Please enter or paste text to narrate.', 'error');
    elements.narratorTextInput.focus();
    return;
  }

  // Validation: Check API key
  const hasKey = Boolean(state.apiKey || state.hasEnvKey);
  if (!hasKey) {
    showToast('Please configure your ElevenLabs API Key to generate narration.', 'error');
    openApiKeyModal();
    return;
  }

  // Audio generation start state
  setGeneratingUI(true);
  updatePlayerStatus('Generating narration with ElevenLabs...', 'generating');

  try {
    const payload = {
      text,
      model_id: elements.modelSelect.value,
      voice_id: elements.voiceSelect.value,
      voice_settings: {
        stability: parseFloat(elements.sliderStability.value),
        similarity_boost: parseFloat(elements.sliderSimilarity.value),
        style: parseFloat(elements.sliderStyle.value),
        use_speaker_boost: elements.checkSpeakerBoost.checked
      }
    };

    const headers = { 'Content-Type': 'application/json' };
    if (state.apiKey) headers['x-api-key'] = state.apiKey;

    const response = await fetch('/api/narrate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMsg = 'Failed to generate narration.';
      try {
        const errJson = await response.json();
        errorMsg = errJson.error || errorMsg;
      } catch {
        errorMsg = await response.text() || errorMsg;
      }
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    state.audioBlob = blob;

    // Clean up previous blob URL
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    state.audioUrl = URL.createObjectURL(blob);
    elements.nativeAudio.src = state.audioUrl;
    elements.nativeAudio.playbackRate = state.playbackSpeed;

    // Enable player controls
    elements.seekSlider.disabled = false;
    elements.playPauseToggleBtn.disabled = false;
    elements.replayBtn.disabled = false;
    elements.downloadBtn.disabled = false;
    elements.stopBtn.style.display = 'inline-flex';

    // Update track metadata
    const selectedVoiceName = elements.voiceSelect.options[elements.voiceSelect.selectedIndex]?.text.split('(')[0].trim() || 'Voice';
    const selectedModelName = elements.modelSelect.options[elements.modelSelect.selectedIndex]?.text.split('(')[0].trim() || 'Model';
    elements.playerTrackTitle.textContent = `"${text.substring(0, 48)}..." • ${selectedVoiceName} (${selectedModelName})`;

    // Initialize Web Audio Visualizer on first user interaction
    ensureVisualizerConnected();

    // Start playback automatically
    await elements.nativeAudio.play();
    setPlaybackState(true);
    updatePlayerStatus('Playing Narration', 'playing');
    showToast('Narration generated successfully!', 'success');

    // Add to history
    addToHistory({
      text,
      model: selectedModelName,
      modelId: payload.model_id,
      voice: selectedVoiceName,
      voiceId: payload.voice_id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      blobUrl: state.audioUrl
    });

  } catch (error) {
    console.error('Narration generation error:', error);
    showToast(error.message, 'error');
    updatePlayerStatus('Narration generation failed', 'error');
  } finally {
    setGeneratingUI(false);
  }
}

function stopNarration() {
  elements.nativeAudio.pause();
  elements.nativeAudio.currentTime = 0;
  setPlaybackState(false);
  updatePlayerStatus('Stopped', 'ready');
  elements.stopBtn.style.display = 'none';
}

function setGeneratingUI(generating) {
  state.isGenerating = generating;
  elements.narrateBtn.disabled = generating;
  if (generating) {
    elements.narrateSpinner.style.display = 'inline-block';
    elements.narratePlayIcon.style.display = 'none';
    elements.narrateBtnText.textContent = 'Generating Speech...';
  } else {
    elements.narrateSpinner.style.display = 'none';
    elements.narratePlayIcon.style.display = 'inline-block';
    elements.narrateBtnText.textContent = 'Start Narration';
  }
}

function updatePlayerStatus(text, type = 'ready') {
  elements.playerStatusBadge.textContent = text;
  elements.playerStatusBadge.className = `now-playing-badge ${type}`;
}

// ==========================================
// Custom Player Controls & Playback
// ==========================================
function togglePlayPause() {
  if (!state.audioUrl) return;

  if (elements.nativeAudio.paused) {
    ensureVisualizerConnected();
    elements.nativeAudio.play();
    setPlaybackState(true);
    updatePlayerStatus('Playing Narration', 'playing');
    elements.stopBtn.style.display = 'inline-flex';
  } else {
    elements.nativeAudio.pause();
    setPlaybackState(false);
    updatePlayerStatus('Paused', 'ready');
  }
}

function replayAudio() {
  if (!state.audioUrl) return;
  elements.nativeAudio.currentTime = 0;
  elements.nativeAudio.play();
  setPlaybackState(true);
  updatePlayerStatus('Playing Narration', 'playing');
}

function setPlaybackState(playing) {
  state.isPlaying = playing;
  if (playing) {
    elements.playPauseIcon.innerHTML = `
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    `;
    elements.playerPanel.classList.add('playing');
  } else {
    elements.playPauseIcon.innerHTML = `
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    `;
    elements.playerPanel.classList.remove('playing');
  }
}

function onAudioEnded() {
  setPlaybackState(false);
  updatePlayerStatus('Finished', 'ready');
  elements.stopBtn.style.display = 'none';
  elements.seekSlider.value = 0;
  elements.currentTime.textContent = '00:00';
}

function onAudioError(err) {
  console.error('Audio playback error:', err);
  setPlaybackState(false);
  updatePlayerStatus('Audio error', 'error');
}

function updatePlaybackProgress() {
  const current = elements.nativeAudio.currentTime || 0;
  const total = elements.nativeAudio.duration || 0;

  elements.currentTime.textContent = formatTime(current);

  if (total > 0 && !isNaN(total)) {
    const percent = (current / total) * 100;
    elements.seekSlider.value = percent;
  }
}

function updateDurationDisplay() {
  const duration = elements.nativeAudio.duration || 0;
  elements.totalDuration.textContent = formatTime(duration);
}

function onSeekInput(e) {
  const percent = parseFloat(e.target.value);
  const total = elements.nativeAudio.duration;
  if (total && !isNaN(total)) {
    elements.nativeAudio.currentTime = (percent / 100) * total;
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function downloadCurrentAudio() {
  if (!state.audioBlob && !state.audioUrl) return;

  const a = document.createElement('a');
  a.href = state.audioUrl;
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.download = `elevenlabs-narration-${timestamp}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Download started!', 'success');
}

// ==========================================
// Web Audio API Real-time Waveform Visualizer
// ==========================================
function ensureVisualizerConnected() {
  if (state.visualizerInitialized) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    state.audioContext = new AudioContextClass();
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 256;
    state.analyser.smoothingTimeConstant = 0.8;

    state.sourceNode = state.audioContext.createMediaElementSource(elements.nativeAudio);
    state.sourceNode.connect(state.analyser);
    state.analyser.connect(state.audioContext.destination);

    state.visualizerInitialized = true;
    startVisualizerLoop();
  } catch (err) {
    console.warn('AudioContext visualizer initialization notice:', err);
  }
}

function startVisualizerLoop() {
  const canvas = elements.waveformCanvas;
  const ctx = canvas.getContext('2d');
  const bufferLength = state.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    requestAnimationFrame(draw);

    // Dynamic canvas resize support
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (state.isPlaying && state.audioContext?.state === 'running') {
      state.analyser.getByteFrequencyData(dataArray);

      const barCount = 48;
      const barWidth = (width / barCount) - 3;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        const barHeight = Math.max(4, (val / 255) * (height - 12));
        const x = i * (barWidth + 3);
        const y = (height - barHeight) / 2;

        // Gradient matching warm palette (#d5bdaf, #e3d5ca, #d6ccc2)
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#2e2621'); // Deep espresso top
        grad.addColorStop(0.4, '#9d7a64'); // Deep warm taupe
        grad.addColorStop(1, '#d5bdaf'); // Soft taupe base

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }
    } else {
      // Idle animated resting wave
      drawIdleWave(ctx, width, height);
    }
  }

  draw();
}

let idlePhase = 0;
function drawIdleWave(ctx, width, height) {
  idlePhase += 0.03;
  const barCount = 44;
  const barWidth = (width / barCount) - 3;

  for (let i = 0; i < barCount; i++) {
    const wave = Math.sin(idlePhase + i * 0.25) * 6 + 10;
    const x = i * (barWidth + 3);
    const y = (height - wave) / 2;

    ctx.fillStyle = 'rgba(157, 122, 100, 0.4)';
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, wave, 2);
    ctx.fill();
  }
}

function initIdleWaveform() {
  const canvas = elements.waveformCanvas;
  const ctx = canvas.getContext('2d');
  drawIdleWave(ctx, canvas.width, canvas.height);
}

// ==========================================
// History / Saved Clips
// ==========================================
function addToHistory(item) {
  state.history.unshift(item);
  if (state.history.length > 8) state.history.pop();
  renderHistory();
}

function renderHistory() {
  const container = elements.historyList;
  if (!state.history.length) {
    container.innerHTML = `
      <div class="empty-history">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2v20M17 5v14M7 8v8M2 11v2M22 11v2"></path>
        </svg>
        <p>Your generated narrations will appear here for instant replay.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  state.history.forEach((h, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'history-item';
    itemEl.innerHTML = `
      <div class="history-meta">
        <div class="history-text">${escapeHtml(h.text)}</div>
        <div class="history-details">
          <span>${h.voice}</span> • <span>${h.model}</span> • <span>${h.timestamp}</span>
        </div>
      </div>
      <div class="history-play-icon" title="Replay take">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </div>
    `;

    itemEl.addEventListener('click', () => {
      elements.narratorTextInput.value = h.text;
      updateTextMetrics();

      if (h.blobUrl) {
        state.audioUrl = h.blobUrl;
        elements.nativeAudio.src = h.blobUrl;
        ensureVisualizerConnected();
        elements.nativeAudio.play();
        setPlaybackState(true);
        updatePlayerStatus(`Playing take #${index + 1}`, 'playing');
        elements.playerTrackTitle.textContent = `"${h.text.substring(0, 48)}..." • ${h.voice}`;
        elements.stopBtn.style.display = 'inline-flex';
        elements.downloadBtn.disabled = false;
        elements.seekSlider.disabled = false;
        elements.playPauseToggleBtn.disabled = false;
        elements.replayBtn.disabled = false;
      }
    });

    container.appendChild(itemEl);
  });
}

function clearHistory() {
  state.history = [];
  renderHistory();
  showToast('History cleared', 'info');
}

function loadSavedHistory() {
  renderHistory();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = type === 'success' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : type === 'error'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9d7a64" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }, 4000);
}

// Boot up app on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
