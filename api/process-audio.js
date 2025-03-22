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
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="notification-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="notification-message">
        <strong>Fout</strong>: Er is een fout opgetreden bij het verwerken van het audiobestand.
      </div>
    `;
    document.body.appendChild(notification);
    
    // Verwijder na 4 seconden
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 4000);
    
    // Terug naar uploaden
    processingCard.classList.add('hidden');
    uploadCard.classList.remove('hidden');
    tutorialCard.classList.remove('hidden');
  }
}