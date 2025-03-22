// app.js - Hoofdscript voor VoiceSum MVP

// DOM Elementen
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const processButton = document.getElementById('process-button');
const uploadCard = document.getElementById('upload-card');
const processingCard = document.getElementById('processing-card');
const resultCard = document.getElementById('result-card');
const tutorialCard = document.getElementById('tutorial-card');
const settingsCard = document.getElementById('settings-card');
const processingStatus = document.getElementById('processing-status');
const resultText = document.getElementById('result-text');
const summaryTab = document.getElementById('summary-tab');
const fullTab = document.getElementById('full-tab');
const whatsappButton = document.getElementById('whatsapp-button');
const copyButton = document.getElementById('copy-button');
const settingsButton = document.getElementById('settings-button');
const backButton = document.getElementById('back-button');
const saveHistoryToggle = document.getElementById('save-history-toggle');
const defaultViewSelect = document.getElementById('default-view-select');
const deleteAudioToggle = document.getElementById('delete-audio-toggle');

// State variabelen
let selectedFile = null;
let fullTranscription = '';
let summary = '';
let currentView = 'summary';
let settings = loadSettings();

// Initialisatie
function init() {
  // Instellingen laden
  updateUIFromSettings();
  
  // Event listeners instellen
  setupEventListeners();
  
  // Controleren op gedeelde bestanden bij opstarten
  checkForSharedFiles();
  
  // Service Worker registreren
  registerServiceWorker();
}

// Instellingen laden uit localStorage
function loadSettings() {
  const defaultSettings = {
    saveHistory: false,
    defaultView: 'summary',
    deleteAudio: true
  };
  
  try {
    const savedSettings = localStorage.getItem('voicesum_settings');
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
}

// Instellingen opslaan naar localStorage
function saveSettings() {
  try {
    localStorage.setItem('voicesum_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// UI bijwerken op basis van instellingen
function updateUIFromSettings() {
  saveHistoryToggle.checked = settings.saveHistory;
  defaultViewSelect.value = settings.defaultView;
  deleteAudioToggle.checked = settings.deleteAudio;
}

// Event listeners instellen
function setupEventListeners() {
  // Drag & drop functionaliteit
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });
  
  dropArea.addEventListener('drop', handleDrop, false);
  
  // Bestand selecteren via klikken
  dropArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFiles(e.target.files);
    }
  });
  
  // Verwerken knop
  processButton.addEventListener('click', processAudio);
  
  // Tab functionaliteit
  summaryTab.addEventListener('click', () => {
    showSummaryTab();
  });
  
  fullTab.addEventListener('click', () => {
    showFullTab();
  });
  
  // Deel functionaliteit
  whatsappButton.addEventListener('click', shareToWhatsApp);
  copyButton.addEventListener('click', copyToClipboard);
  
  // Instellingen
  settingsButton.addEventListener('click', showSettings);
  backButton.addEventListener('click', hideSettings);
  
  // Instellingen wijzigingen
  saveHistoryToggle.addEventListener('change', (e) => {
    settings.saveHistory = e.target.checked;
    saveSettings();
  });
  
  defaultViewSelect.addEventListener('change', (e) => {
    settings.defaultView = e.target.value;
    saveSettings();
  });
  
  deleteAudioToggle.addEventListener('change', (e) => {
    settings.deleteAudio = e.target.checked;
    saveSettings();
  });
}

// Helper functies voor drag & drop
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  dropArea.classList.add('dragover');
}

function unhighlight() {
  dropArea.classList.remove('dragover');
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  if (dt.files && dt.files.length) {
    handleFiles(dt.files);
  }
}

// Verwerk gekozen bestanden
function handleFiles(files) {
  if (files.length === 0) return;
  
  const file = files[0];
  
  // Controleer of het een audiobestand is
  if (!file.type.startsWith('audio/')) {
    showNotification('Fout', 'Selecteer een audiobestand (.mp3, .m4a, etc.)');
    return;
  }
  
  // Toon bestandsinformatie
  selectedFile = file;
  fileInfo.classList.remove('hidden');
  fileName.textContent = file.name;
  processButton.disabled = false;
}

// Audio verwerken
async function processAudio() {
  if (!selectedFile) return;
  
  // Toon verwerkingsscherm
  uploadCard.classList.add('hidden');
  tutorialCard.classList.add('hidden');
  processingCard.classList.remove('hidden');
  
  try {
    // Simuleer verwerking
    processingStatus.textContent = "Bezig met transcriberen...";
    await sleep(1500);
    
    processingStatus.textContent = "Bezig met samenvatten...";
    await sleep(1500);
    
    // Gebruik het echte bestandsnaam en grootte voor demo
    const realFileName = selectedFile.name || "audio";
    const fileSize = Math.round(selectedFile.size / 1024); // KB
    
    fullTranscription = `Dit is een demonstratie transcriptie voor het bestand "${realFileName}" (${fileSize}KB).
    
De echte transcriptie zou hier verschijnen als de API volledig was geconfigureerd. Voor een werkende versie is een geldige OpenAI API key nodig in de Vercel environment variables.

In een echte implementatie zou dit audiobestand worden verzonden naar OpenAI's Whisper spraakherkenning API, die het zou omzetten naar tekst.`;
    
    summary = `• Demonstratie voor: ${realFileName}\n• Bestandsgrootte: ${fileSize}KB\n\nDit is een voorbeeld samenvatting. De echte versie zou belangrijke punten uit het audiobestand weergeven.\n\nVoor echte transcriptie is een werkende OpenAI API configuratie nodig.`;
    
    // Sla geschiedenis op indien ingeschakeld
    if (settings.saveHistory) {
      saveToHistory(fullTranscription, summary, selectedFile.name);
    }
    
    // Verwijder audio indien ingeschakeld
    if (settings.deleteAudio) {
      selectedFile = null;
    }
    
    // Toon resultaten
    processingCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
    
    // Standaard weergave instellen op basis van voorkeuren
    if (settings.defaultView === 'full') {
      showFullTab();
    } else {
      showSummaryTab();
    }
  } catch (error) {
    console.error('Error processing audio:', error);
    
    // Toon foutmelding
    alert('Er is een fout opgetreden bij het verwerken van het audiobestand.');
    
    // Terug naar uploaden
    processingCard.classList.add('hidden');
    uploadCard.classList.remove('hidden');
    tutorialCard.classList.remove('hidden');
  }
}
  if (!selectedFile) return;
  
  // Toon verwerkingsscherm
  uploadCard.classList.add('hidden');
  tutorialCard.classList.add('hidden');
  processingCard.classList.remove('hidden');
  
  try {
    // Converteer audiobestand naar base64
    const base64Audio = await fileToBase64(selectedFile);
    
    // Stuur naar de API
    processingStatus.textContent = "Bezig met transcriberen...";
    const response = await fetch('/api/process-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio: base64Audio,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        language: 'nl'
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const result = await response.json();
    
    // Sla resultaten op
    fullTranscription = result.transcription;
    summary = result.summary;
    
    // Sla geschiedenis op indien ingeschakeld
    if (settings.saveHistory) {
      saveToHistory(fullTranscription, summary, selectedFile.name);
    }
    
    // Verwijder audio indien ingeschakeld
    if (settings.deleteAudio) {
      selectedFile = null;
    }
    
    // Toon resultaten
    processingCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
    
    // Standaard weergave instellen op basis van voorkeuren
    if (settings.defaultView === 'full') {
      showFullTab();
    } else {
      showSummaryTab();
    }
  } catch (error) {
    console.error('Error processing audio:', error);
    showNotification('Fout', 'Er is een fout opgetreden bij het verwerken van het audiobestand.');
    
    // Terug naar uploaden
    processingCard.classList.add('hidden');
    uploadCard.classList.remove('hidden');
    tutorialCard.classList.remove('hidden');
  }
}

// Helper functie om bestand naar base64 te converteren
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Toon samenvatting tab
function showSummaryTab() {
  summaryTab.classList.add('active');
  fullTab.classList.remove('active');
  resultText.textContent = summary;
  currentView = 'summary';
}

// Toon volledige tekst tab
function showFullTab() {
  fullTab.classList.add('active');
  summaryTab.classList.remove('active');
  resultText.textContent = fullTranscription;
  currentView = 'full';
}

// Deel via WhatsApp
function shareToWhatsApp() {
  const text = currentView === 'summary' ? summary : fullTranscription;
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

// Kopieer naar klembord
async function copyToClipboard() {
  const text = currentView === 'summary' ? summary : fullTranscription;
  
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Succes', 'Tekst gekopieerd naar klembord');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    
    // Fallback methode voor browsers die geen clipboard API ondersteunen
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // Vermijd scrollen naar beneden
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      const message = successful ? 'Tekst gekopieerd naar klembord' : 'Kopiëren naar klembord mislukt';
      showNotification(successful ? 'Succes' : 'Fout', message);
    } catch (err) {
      showNotification('Fout', 'Kopiëren naar klembord mislukt');
    }
    
    document.body.removeChild(textArea);
  }
}

// Toon instellingen
function showSettings() {
  uploadCard.classList.add('hidden');
  resultCard.classList.add('hidden');
  tutorialCard.classList.add('hidden');
  settingsCard.classList.remove('hidden');
}

// Verberg instellingen
function hideSettings() {
  settingsCard.classList.add('hidden');
  
  // Toon de juiste kaart op basis van de huidige staat
  if (!resultCard.classList.contains('hidden')) {
    // Als resultaten zichtbaar waren, toon die weer
    resultCard.classList.remove('hidden');
  } else {
    // Anders toon de upload en tutorial kaarten
    uploadCard.classList.remove('hidden');
    tutorialCard.classList.remove('hidden');
  }
}

// Sla transcriptie op in geschiedenis
function saveToHistory(transcription, summary, audioName) {
  try {
    // Haal bestaande geschiedenis op
    let history = [];
    const savedHistory = localStorage.getItem('voicesum_history');
    if (savedHistory) {
      history = JSON.parse(savedHistory);
    }
    
    // Voeg nieuwe item toe
    history.unshift({
      id: Date.now(),
      fileName: audioName,
      transcription: transcription,
      summary: summary,
      date: new Date().toISOString()
    });
    
    // Beperk tot maximaal 10 items
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    // Opslaan
    localStorage.setItem('voicesum_history', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

// Controleer op gedeelde bestanden bij het starten
function checkForSharedFiles() {
  // Deze functie zou in een echte implementatie controleren op bestanden die gedeeld zijn via het deelmenu
}

// Registreer Service Worker voor PWA functionaliteit
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('ServiceWorker registration successful with scope:', registration.scope);
      }).catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
    });
  }
}
// Toon notificatie
function showNotification(title, message) {
  // Verwijder bestaande notificaties
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    document.body.removeChild(notification);
  });
  
  // Maak nieuwe notificatie
  const notification = document.createElement('div');
  notification.className = 'notification';
  
  notification.innerHTML = `
    <div class="notification-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    </div>
    <div class="notification-message">
      <strong>${title}</strong>: ${message}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Verwijder na 4 seconden
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 4000);
}
// Toon notificatie
function showNotification(title, message) {
  // Verwijder bestaande notificaties
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    document.body.removeChild(notification);
  });
  
  // Maak nieuwe notificatie
  const notification = document.createElement('div');
  notification.className = 'notification';
  
  notification.innerHTML = `
    <div class="notification-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    </div>
    <div class="notification-message">
      <strong>${title}</strong>: ${message}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Verwijder na 4 seconden
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 4000);
}

// Helper functie om te wachten
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialiseer de app
init();