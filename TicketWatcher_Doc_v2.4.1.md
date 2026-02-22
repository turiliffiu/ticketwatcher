# TicketWatcher — Documentazione Finale v2.4.1

> Sistema di notifica multi-canale per richieste di assistenza MARS

---

## Indice

1. [Panoramica](#1-panoramica)
2. [Come Funziona](#2-come-funziona)
3. [Prerequisiti](#3-prerequisiti)
4. [Installazione Tampermonkey](#4-installazione-tampermonkey)
5. [Abilitare Notifiche OS su HTTP](#5-abilitare-notifiche-os-su-http)
6. [Script Principale v2.4.1](#6-script-principale-v241)
7. [Configurazione Parametri](#7-configurazione-parametri)
8. [Verifica Funzionamento](#8-verifica-funzionamento)
9. [Script di Test](#9-script-di-test)
10. [Script di Diagnostica](#10-script-di-diagnostica)
11. [Comandi Utili](#11-comandi-utili)
12. [Troubleshooting](#12-troubleshooting)
13. [FAQ](#13-faq)

---

## 1. Panoramica

### Problema
L'applicazione web MARS aggiorna silenziosamente un contatore numerico quando arriva una nuova richiesta di assistenza. Gli operatori non si accorgono delle nuove richieste perché:
- Nessuna notifica visiva o sonora
- Il contatore si aggiorna solo dopo refresh della pagina (non in tempo reale)
- Meta refresh automatico ogni 5 minuti può far perdere il tracking

### Soluzione
Script JavaScript iniettato tramite Tampermonkey che attiva **4 canali di notifica simultanei**:

| Canale | Descrizione | Visibilità |
|--------|-------------|------------|
| 🔴 **Popup** | Banner rosso in alto a destra | Solo sulla pagina |
| 🔔 **Beep** | 10 segnali sonori consecutivi | Udibile ovunque |
| 🖥️ **OS Notification** | Notifica di sistema Windows | Anche con browser minimizzato |
| 🗣️ **Text-to-Speech** | Voce italiana sintetizzata | Udibile ovunque |

### Caratteristiche Tecniche
- ✅ **Polling aggressivo**: Controlla il server ogni 30 secondi
- ✅ **localStorage persistente**: Sopravvive ai refresh della pagina
- ✅ **Blocco meta refresh**: Impedisce ricaricamenti automatici
- ✅ **Badge visivo**: Indicatore verde sempre visibile quando attivo
- ✅ **Gestione ticket presi in carico**: Riconosce decrementi contatore senza false notifiche
- ✅ **Zero configurazione server**: Funziona solo lato client

---

## 2. Come Funziona

### Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    MARS Application                         │
│              http://10.48.9.239/mars_ntw/                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTML con contatore WA2
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Browser Chrome/Edge                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Tampermonkey Extension                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         TicketWatcher v2.4.1 Script             │  │  │
│  │  │                                                 │  │  │
│  │  │  • DOM Observer (controlla elemento)            │  │  │
│  │  │  • Fetch Polling (ogni 30s)                     │  │  │
│  │  │  • localStorage (persistenza valore)            │  │  │
│  │  │  • Meta refresh blocker                         │  │  │
│  │  │  • Smart decrement detection                    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                │
│         Quando rileva incremento contatore                  │
│                            ▼                                │
│  ┌─────────────┬──────────────┬──────────────┬───────────┐  │
│  │   Popup     │   Beep       │  OS Notif    │   TTS     │  │
│  │   Rosso     │   x10        │  Windows     │   Voce    │  │
│  └─────────────┴──────────────┴──────────────┴───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Flusso di Rilevamento

**Scenario 1: Ticket arriva mentre la pagina è aperta**
```
1. Tecnico crea ticket → Backend registra (contatore: 5 → 6)
2. MARS non aggiorna il DOM automaticamente
3. Dopo max 30s → Script fa fetch() al server
4. Fetch rileva nuovo valore: 6
5. Script aggiorna DOM da 5 → 6
6. MutationObserver rileva il cambio
7. Confronta con localStorage (5)
8. 6 > 5 → 🔔 TUTTE LE NOTIFICHE SCATTANO
```

**Scenario 2: Operatore fa refresh manuale**
```
1. Ticket già presente sul server (contatore: 6)
2. Operatore preme F5
3. Script si riavvia e legge DOM: 6
4. Script legge localStorage: 5 (valore precedente salvato)
5. 6 > 5 → 🔔 TUTTE LE NOTIFICHE SCATTANO
6. Salva 6 in localStorage per prossimo check
```

**Scenario 3: Refresh automatico bloccato**
```
1. Meta refresh dopo 5 minuti → BLOCCATO dallo script
2. Pagina non ricarica mai automaticamente
3. Script continua a girare ininterrottamente
4. Fetch polling mantiene i dati aggiornati
```

**Scenario 4: Operatore prende in gestione ticket**
```
1. Contatore attuale: 5 (5 ticket in coda)
2. Operatore prende in carico un ticket
3. Backend aggiorna: 5 → 4
4. Fetch rileva nuovo valore: 4
5. Script confronta: 4 < 5 (decremento)
6. Console: "[TW] ✅ Ticket gestito: 5 → 4"
7. ❌ NESSUNA NOTIFICA (comportamento corretto)
8. Aggiorna localStorage: 4
9. Script continua a monitorare da 4 in poi
```

---

## 3. Prerequisiti

- **Browser**: Google Chrome o Microsoft Edge
- **Estensione**: Tampermonkey
- **Permessi**: Modalità sviluppatore Chrome + Notifiche OS
- **Connessione**: Accesso a `http://10.48.9.239/mars_ntw/`

---

## 4. Installazione Tampermonkey

### 4.1 Installa l'estensione

| Browser | Link diretto |
|---------|--------------|
| Chrome | https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo |
| Edge | https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd |
| Firefox | https://addons.mozilla.org/it/firefox/addon/tampermonkey/ |

### 4.2 Abilita Modalità Sviluppatore

**Chrome 138 o superiore:**
1. Clicca destro sull'icona Tampermonkey → **"Gestisci estensione"**
2. Attiva il toggle **"Consenti Userscript"**

**Chrome versioni precedenti (137 e inferiori):**
1. Vai su `chrome://extensions`
2. Attiva il toggle **"Modalità sviluppatore"** in alto a destra

> ⚠️ **CRITICO**: Senza questo passaggio Tampermonkey non inietta gli script e lo script non funzionerà mai.

### 4.3 Crea il nuovo script

1. Clicca sull'icona Tampermonkey nella toolbar
2. Seleziona **"Crea nuovo script"**
3. Cancella tutto il contenuto predefinito
4. Incolla lo script v2.4.1 dalla sezione 6
5. Salva con **Ctrl+S**
6. Verifica che sia attivo (toggle verde)

---

## 5. Abilitare Notifiche OS su HTTP

> ⚠️ Chrome blocca le notifiche di sistema sui siti HTTP non sicuri. Questa procedura va eseguita **una sola volta** per permettere le notifiche OS.

### 5.1 Aggiungi eccezione in Chrome Flags

1. Apri una nuova scheda e vai su:
```
chrome://flags/#unsafely-treat-insecure-origin-as-secure
```

2. Nel campo di testo che appare incolla esattamente:
```
http://10.48.9.239
```

3. Nel menu a tendina accanto seleziona **"Enabled"**

4. Clicca il pulsante blu **"Relaunch"** in basso a destra
   - Chrome si chiuderà e riaprirà automaticamente

5. Torna sulla pagina MARS: `http://10.48.9.239/mars_ntw/giac_cap.php`

### 5.2 Concedi il permesso notifiche

Al primo caricamento della pagina con lo script attivo, Chrome mostrerà un popup in alto a sinistra:

```
🔔 10.48.9.239 vuole mostrarti notifiche    [Blocca]  [Consenti]
```

**Clicca "Consenti"**

### 5.3 Verifica permesso

In console F12 esegui:
```javascript
console.log('Permesso notifiche:', Notification.permission)
```

Risultato atteso: `granted`

### 5.4 Test notifica manuale

```javascript
new Notification('🔔 Test MARS', { body: 'Notifica OS funzionante!' })
```

Deve apparire una notifica nell'angolo in basso a destra del desktop Windows.

### 5.5 Recupero se hai cliccato "Blocca"

Se per errore hai cliccato "Blocca":

1. Clicca sul **lucchetto 🔒** nella barra degli indirizzi (a sinistra dell'URL)
2. Trova **"Notifiche"**
3. Cambia da **"Bloccato"** a **"Consenti"**
4. Ricarica la pagina con **F5**

---

## 6. Script Principale v2.4.1

Copia questo script completo nell'editor Tampermonkey e salva con `Ctrl+S`:

```javascript
// ==UserScript==
// @name         TicketWatcher v2.4.1 FINAL
// @namespace    http://tampermonkey.net/
// @version      2.4.1
// @description  Polling aggressivo + localStorage persistente + gestione decrementi
// @author       Tu
// @match        http://10.48.9.239/mars_ntw/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  console.log('[TW] 🚀 Script v2.4.1 FINAL caricato');

  const STORAGE_KEY = 'tw_mars_last_value';

  // ━━━ BLOCCA META REFRESH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const metaObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'META' && node.httpEquiv === 'refresh') {
          console.log('%c[TW] 🛑 Meta refresh bloccato', 'background:#e74c3c;color:#fff;padding:4px;font-weight:bold');
          node.remove();
        }
      });
    });
  });
  
  if (document.documentElement) {
    metaObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  // ━━━ CONFIGURAZIONE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const CONFIG = {
    selector:       'a[href*="lista=WA2"]',
    pollInterval:   2000,        // check DOM ogni 2s
    fetchInterval:  30000,       // fetch server ogni 30s
    popupDuration:  8000,
    beepFreq:       660,
    beepDuration:   1.2,
    beepCount:      10,
    osNotifica:     true,
    osTitle:        '🔔 Nuova Mars!',
    osBody:         'È arrivata una nuova richiesta di assistenza.',
    osIcon:         'https://cdn-icons-png.flaticon.com/512/1827/1827392.png',
    ttsAbilitato:   true,
    ttsMessaggio:   'Attenzione! Nuova Mars ricevuta.',
    ttsLingua:      'it-IT',
    ttsVolume:      1.0,
    ttsVelocita:    0.9,
    ttsTono:        1.0,
  };

  let lastValue    = null;
  let mutationObs  = null;
  let domPoller    = null;
  let fetchPoller  = null;
  let audioCtx     = null;
  let activePopup  = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      document.removeEventListener('click', initAudio);
    }
  }
  document.addEventListener('click', initAudio);

  function playBeep() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const time = audioCtx.currentTime;
      for (let i = 0; i < CONFIG.beepCount; i++) {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = CONFIG.beepFreq;
        gain.gain.setValueAtTime(0.6, time + i * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.35 + CONFIG.beepDuration);
        osc.start(time + i * 0.35);
        osc.stop(time + i * 0.35 + CONFIG.beepDuration);
      }
    } catch (e) {
      console.warn('[TW] Audio non disponibile:', e.message);
    }
  }

  function richiediPermessoNotifiche() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        console.info(`[TW] Permesso notifiche OS: ${p}`);
      });
    }
  }

  function showOsNotification(oldVal, newVal) {
    if (!CONFIG.osNotifica) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      console.warn('[TW] Permesso OS non concesso');
      return;
    }
    const n = new Notification(CONFIG.osTitle, {
      body: `${CONFIG.osBody}\nContatore: ${oldVal} → ${newVal}`,
      icon: CONFIG.osIcon,
      requireInteraction: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
  }

  function speak(oldVal, newVal) {
    if (!CONFIG.ttsAbilitato) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(CONFIG.ttsMessaggio);
    msg.lang   = CONFIG.ttsLingua;
    msg.volume = CONFIG.ttsVolume;
    msg.rate   = CONFIG.ttsVelocita;
    msg.pitch  = CONFIG.ttsTono;
    window.speechSynthesis.speak(msg);
  }

  function injectStyles() {
    if (document.getElementById('twStyles')) return;
    const style = document.createElement('style');
    style.id = 'twStyles';
    style.textContent = `
      @keyframes twSlideIn  { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes twSlideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(120%);opacity:0} }
    `;
    if (!document.head) {
      const head = document.createElement('head');
      document.documentElement.insertBefore(head, document.body);
    }
    document.head.appendChild(style);
    console.log('[TW] ✅ Style iniettato');
  }

  function showPopup(oldVal, newVal) {
    if (activePopup) activePopup.remove();
    const popup = document.createElement('div');
    popup.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:2rem;">🔔</span>
        <div>
          <div style="font-weight:700;font-size:1.1rem;">Nuova Mars ricevuta!</div>
          <div style="margin-top:4px;opacity:0.9;">
            Ticket: <b>${oldVal}</b> → <b style="color:#ffd700">${newVal}</b>
          </div>
          <div style="font-size:0.78rem;margin-top:4px;opacity:0.7;">${new Date().toLocaleTimeString()}</div>
        </div>
        <button id="twClose" style="margin-left:auto;background:rgba(255,255,255,0.2);
          border:none;color:#fff;width:28px;height:28px;border-radius:50%;
          cursor:pointer;font-size:1.1rem;">✕</button>
      </div>
    `;
    Object.assign(popup.style, {
      position:     'fixed',
      top:          '20px',
      right:        '20px',
      zIndex:       '2147483647',
      background:   'linear-gradient(135deg, #e74c3c, #c0392b)',
      color:        '#fff',
      padding:      '16px 20px',
      borderRadius: '12px',
      boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
      minWidth:     '300px',
      fontFamily:   'system-ui, sans-serif',
      animation:    'twSlideIn 0.3s ease',
    });
    document.body.appendChild(popup);
    activePopup = popup;
    const close = () => {
      popup.style.animation = 'twSlideOut 0.3s ease forwards';
      setTimeout(() => { popup.remove(); if (activePopup === popup) activePopup = null; }, 300);
    };
    popup.querySelector('#twClose').addEventListener('click', close);
    if (CONFIG.popupDuration > 0) setTimeout(close, CONFIG.popupDuration);
  }

  function readValue() {
    const el = document.querySelector(CONFIG.selector);
    if (!el) return null;
    return parseInt(el.textContent.trim(), 10);
  }

  function notifyNewTicket(oldVal, newVal) {
    console.info(`%c[TW] 🔔 NUOVO TICKET! ${oldVal} → ${newVal}`, 'background:#e74c3c;color:#fff;padding:8px;font-weight:bold;font-size:14px');
    playBeep();
    showPopup(oldVal, newVal);
    showOsNotification(oldVal, newVal);
    speak(oldVal, newVal);
    lastValue = newVal;
    localStorage.setItem(STORAGE_KEY, newVal);
  }

  function checkValue() {
    const current = readValue();
    if (current === null || isNaN(current)) return;
    
    if (lastValue === null) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        lastValue = parseInt(stored, 10);
        console.info(`[TW] 📦 Recuperato da storage: ${lastValue}`);
        if (current > lastValue) {
          notifyNewTicket(lastValue, current);
          return;
        }
      }
      lastValue = current;
      localStorage.setItem(STORAGE_KEY, current);
      console.info(`[TW] ✅ Avviato — WA2 attuale: ${current}`);
      return;
    }
    
    if (current > lastValue) {
      notifyNewTicket(lastValue, current);
    } else if (current < lastValue) {
      // Decremento = qualcuno ha preso in gestione un ticket
      console.info(`[TW] ✅ Ticket gestito: ${lastValue} → ${current}`);
      lastValue = current;
      localStorage.setItem(STORAGE_KEY, current);
    }
  }

  function startMutationObserver() {
    mutationObs = new MutationObserver(checkValue);
    mutationObs.observe(document.body, { childList: true, subtree: true });
    console.log('[TW] MutationObserver attivo');
  }

  function fetchAndUpdate() {
    fetch(window.location.href, { cache: 'no-store' })
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newEl = doc.querySelector(CONFIG.selector);
        const oldEl = document.querySelector(CONFIG.selector);
        if (newEl && oldEl) {
          const newVal = parseInt(newEl.textContent.trim(), 10);
          const oldVal = parseInt(oldEl.textContent.trim(), 10);
          if (newVal !== oldVal) {
            console.log(`[TW] 🔄 Fetch rileva cambio: ${oldVal} → ${newVal}`);
            oldEl.textContent = newVal;
          } else {
            console.log(`[TW] 🔄 Fetch: nessun cambio (${newVal})`);
          }
        }
      })
      .catch(err => console.warn('[TW] Errore fetch:', err));
  }

  function startFetchPolling() {
    fetchPoller = setInterval(fetchAndUpdate, CONFIG.fetchInterval);
    console.log(`[TW] 🔄 Polling server ogni ${CONFIG.fetchInterval/1000}s`);
  }

  function showBadge() {
    if (document.getElementById('twBadge')) return;
    const badge = document.createElement('div');
    badge.id = 'twBadge';
    badge.innerHTML = '🎫';
    badge.title = 'TicketWatcher v2.4.1 ATTIVO - Click per info';
    Object.assign(badge.style, {
      position: 'fixed', bottom: '10px', left: '10px', zIndex: '2147483646',
      background: '#27ae60', color: '#fff', width: '32px', height: '32px',
      borderRadius: '50%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '18px', cursor: 'pointer',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)', transition: 'transform 0.2s',
    });
    badge.addEventListener('mouseenter', () => badge.style.transform = 'scale(1.2)');
    badge.addEventListener('mouseleave', () => badge.style.transform = 'scale(1)');
    badge.addEventListener('click', () => {
      const val = readValue();
      const stored = localStorage.getItem(STORAGE_KEY);
      const msg = `TicketWatcher v2.4.1 ATTIVO ✅\n\nValore attuale: ${val}\nValore salvato: ${stored}\nPolling: ogni ${CONFIG.fetchInterval/1000}s\n\nUltimo check: ${new Date().toLocaleTimeString()}`;
      alert(msg);
    });
    document.body.appendChild(badge);
    console.log('[TW] 🎫 Badge verde attivo (click per info)');
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    document.querySelectorAll('meta[http-equiv="refresh"]').forEach(meta => {
      console.log('[TW] 🛑 Meta refresh rimosso');
      meta.remove();
    });
    injectStyles();
    richiediPermessoNotifiche();
    checkValue();
    startMutationObserver();
    domPoller = setInterval(checkValue, CONFIG.pollInterval);
    startFetchPolling();
    showBadge();
    console.info('%c[TW v2.4.1] 🎫 ATTIVO - Polling 30s + localStorage', 'color:#27ae60;font-weight:bold;font-size:16px');
  }

  init();

})();
```

---

## 7. Configurazione Parametri

Tutti i parametri sono configurabili nel blocco `CONFIG` all'inizio dello script.

### 7.1 Parametri Generali

| Parametro | Valore | Descrizione |
|-----------|--------|-------------|
| `selector` | `a[href*="lista=WA2"]` | Selettore CSS dell'elemento da monitorare |
| `pollInterval` | `2000` | Intervallo controllo DOM in millisecondi |
| `fetchInterval` | `30000` | Intervallo polling server (30s = rilevamento rapido) |
| `popupDuration` | `8000` | Durata popup in ms (0 = chiusura manuale) |

### 7.2 Parametri Audio

| Parametro | Valore | Descrizione |
|-----------|--------|-------------|
| `beepFreq` | `660` | Frequenza Hz (440=grave, 880=acuto, 1200=molto acuto) |
| `beepDuration` | `1.2` | Durata singolo beep in secondi |
| `beepCount` | `10` | Numero di beep consecutivi |

**Preset audio consigliati:**

| Tipo | beepFreq | beepDuration | beepCount | Descrizione |
|------|----------|--------------|-----------|-------------|
| Discreto | 880 | 0.3 | 3 | Notifica leggera |
| Standard | 660 | 1.2 | 10 | **Attuale - bilanciato** |
| Allarme | 440 | 1.5 | 5 | Suono grave insistente |
| Urgente | 1200 | 0.4 | 15 | Campanello acuto ripetuto |

### 7.3 Parametri Notifica OS

| Parametro | Valore | Descrizione |
|-----------|--------|-------------|
| `osNotifica` | `true` | Abilita/disabilita notifiche OS |
| `osTitle` | `🔔 Nuova Mars!` | Titolo notifica |
| `osBody` | `È arrivata una nuova richiesta...` | Corpo del messaggio |
| `osIcon` | URL icona | URL immagine icona notifica |

### 7.4 Parametri Text-to-Speech

| Parametro | Valore | Descrizione |
|-----------|--------|-------------|
| `ttsAbilitato` | `true` | Abilita/disabilita voce |
| `ttsMessaggio` | `Attenzione! Nuova Mars ricevuta.` | Testo da leggere |
| `ttsLingua` | `it-IT` | Codice lingua voce |
| `ttsVolume` | `1.0` | Volume 0.0 (muto) → 1.0 (massimo) |
| `ttsVelocita` | `0.9` | Velocità 0.5 (lento) → 2.0 (veloce) |
| `ttsTono` | `1.0` | Tono voce 0.0 (grave) → 2.0 (acuto) |

**Preset TTS:**

| Tipo | Messaggio | Velocità | Descrizione |
|------|-----------|----------|-------------|
| Standard | Attenzione! Nuova Mars ricevuta. | 0.9 | **Attuale** |
| Formale | Una nuova richiesta di assistenza è in attesa. | 0.8 | Tono professionale |
| Urgente | Attenzione operatore! Ticket urgente in arrivo! | 1.2 | Allerta immediata |
| Breve | Nuovo ticket. | 1.0 | Minimale |

---

## 8. Verifica Funzionamento

### 8.1 Badge Visivo

Dopo aver installato lo script, sulla pagina MARS vedrai un **badge verde 🎫** in basso a sinistra.

- ✅ **Badge presente** = Script attivo e funzionante
- ❌ **Badge assente** = Script non caricato (vedi Troubleshooting)

**Click sul badge** → Mostra popup con:
- Valore contatore attuale
- Valore salvato in localStorage
- Intervallo polling
- Ultimo check

### 8.2 Messaggi Console

Apri console F12 e cerca questi messaggi all'avvio:

```
[TW] 🚀 Script v2.4.1 FINAL caricato
[TW] 🛑 Meta refresh rimosso
[TW] ✅ Style iniettato
[TW] ✅ Avviato — WA2 attuale: X  (o 📦 Recuperato da storage: X)
[TW] MutationObserver attivo
[TW] 🔄 Polling server ogni 30s
[TW] 🎫 Badge verde attivo (click per info)
[TW v2.4.1] 🎫 ATTIVO - Polling 30s + localStorage
```

Se vedi tutti questi messaggi → **Lo script è attivo e funzionante**.

### 8.3 Verifica Rapida Script Attivo

Incolla in console:

```javascript
console.log(document.querySelector('#twStyles') ? '✅ SCRIPT ATTIVO' : '❌ SCRIPT MORTO')
```

Output atteso: `✅ SCRIPT ATTIVO`

### 8.4 Verifica Permessi

```javascript
console.log('Notifiche OS:', Notification.permission)
console.log('TTS:', 'speechSynthesis' in window ? 'Disponibile' : 'Non disponibile')
```

Output atteso:
```
Notifiche OS: granted
TTS: Disponibile
```

---

## 9. Script di Test

### 9.1 Simulatore Ticket

Per testare TUTTE le notifiche senza aspettare un ticket reale:

```javascript
(function() {
  const link = document.querySelector('a[href*="lista=WA2"]');
  if (!link) { console.error('❌ Elemento non trovato!'); return; }
  let fakeCount = parseInt(link.textContent.trim(), 10) || 0;
  console.info(`🧪 Simulatore pronto. Valore attuale: ${fakeCount}`);
  window.ticketSim = {
    add(n = 1) {
      fakeCount += n;
      link.textContent = fakeCount;
      console.info(`➕ Simulato: contatore ora = ${fakeCount}`);
    },
    decrease(n = 1) {
      fakeCount -= n;
      link.textContent = fakeCount;
      console.info(`➖ Simulato ticket gestito: contatore ora = ${fakeCount}`);
    },
    reset() {
      const current = parseInt(link.textContent.trim(), 10);
      fakeCount = current;
      console.info(`🔄 Reset a ${fakeCount}`);
    }
  };
  console.info('%c🧪 ticketSim pronto! Comandi: add(), decrease(), reset()', 'color:#f39c12;font-weight:bold;font-size:14px');
})();
```

**Comandi:**
```javascript
ticketSim.add()         // Simula 1 nuovo ticket → TUTTE LE NOTIFICHE
ticketSim.add(3)        // Simula 3 ticket in una volta
ticketSim.decrease()    // Simula ticket preso in gestione → NESSUNA NOTIFICA
ticketSim.reset()       // Reset allo stato attuale
```

**Risultato atteso add():**
- 🔴 Popup rosso in alto a destra
- 🔔 10 beep sonori consecutivi
- 🖥️ Notifica OS in basso a destra desktop Windows
- 🗣️ Voce italiana: "Attenzione! Nuova Mars ricevuta."
- Console: `[TW] 🔔 NUOVO TICKET! X → Y`

**Risultato atteso decrease():**
- ❌ Nessuna notifica (comportamento corretto)
- Console: `[TW] ✅ Ticket gestito: X → Y`

### 9.2 Test Notifica OS Singola

```javascript
new Notification('🔔 Test MARS', { 
  body: 'Test notifica di sistema', 
  requireInteraction: true 
})
```

### 9.3 Test TTS Singolo

```javascript
const msg = new SpeechSynthesisUtterance('Test voce italiana');
msg.lang = 'it-IT';
speechSynthesis.speak(msg);
```

### 9.4 Test Audio Beep Singolo

```javascript
const ctx = new AudioContext();
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.connect(gain);
gain.connect(ctx.destination);
osc.frequency.value = 800;
gain.gain.value = 0.5;
osc.start();
osc.stop(ctx.currentTime + 0.3);
```

---

## 10. Script di Diagnostica

### 10.1 Diagnostica Completa

Se qualcosa non funziona, esegui questo script diagnostico:

```javascript
(function diagnostica() {
  console.log('%c═══════════════════════════════════════', 'color:#3498db;font-weight:bold;font-size:14px');
  console.log('%c   DIAGNOSTICA TICKETWATCHER v2.4.1   ', 'color:#3498db;font-weight:bold;font-size:14px');
  console.log('%c═══════════════════════════════════════', 'color:#3498db;font-weight:bold;font-size:14px');
  
  const risultati = {};
  
  // 1. Script attivo
  risultati.stylePresente = !!document.querySelector('#twStyles');
  console.log('1. Style tag #twStyles:', risultati.stylePresente ? '✅ PRESENTE' : '❌ ASSENTE');
  
  // 2. Badge visibile
  risultati.badgePresente = !!document.querySelector('#twBadge');
  console.log('2. Badge verde 🎫:', risultati.badgePresente ? '✅ PRESENTE' : '❌ ASSENTE');
  
  // 3. Elemento DOM
  const el = document.querySelector('a[href*="lista=WA2"]');
  risultati.elementoTrovato = !!el;
  console.log('3. Elemento WA2:', el ? `✅ TROVATO (valore: ${el.textContent.trim()})` : '❌ NON TROVATO');
  
  // 4. localStorage
  const stored = localStorage.getItem('tw_mars_last_value');
  risultati.storageValore = stored;
  console.log('4. localStorage:', stored ? `✅ Valore salvato: ${stored}` : '⚠️ Nessun valore salvato');
  
  // 5. Permessi
  risultati.permessoOS = Notification.permission;
  console.log('5. Permesso OS:', 
    Notification.permission === 'granted' ? '✅ CONCESSO' : 
    `❌ ${Notification.permission.toUpperCase()}`);
  
  risultati.tts = 'speechSynthesis' in window;
  console.log('6. Text-to-Speech:', risultati.tts ? '✅ DISPONIBILE' : '❌ NON DISPONIBILE');
  
  // 7. URL
  risultati.url = window.location.href;
  const matchCorrect = window.location.href.startsWith('http://10.48.9.239/mars_ntw/');
  console.log('7. URL match:', matchCorrect ? '✅ CORRETTO' : '❌ NON CORRETTO');
  console.log('   URL:', window.location.href);
  
  // 8. Riepilogo
  console.log('\n%c═══ RIEPILOGO ═══', 'color:#e74c3c;font-weight:bold;font-size:14px');
  
  const problemi = [];
  if (!risultati.stylePresente) problemi.push('Style tag mancante');
  if (!risultati.badgePresente) problemi.push('Badge non visibile');
  if (!risultati.elementoTrovato) problemi.push('Elemento DOM non trovato');
  if (risultati.permessoOS !== 'granted') problemi.push('Permesso OS non concesso');
  
  if (problemi.length === 0) {
    console.log('%c✅ TUTTO OK - Script funzionante!', 'color:#27ae60;font-weight:bold;font-size:16px');
  } else {
    console.log('%c❌ PROBLEMI RILEVATI:', 'color:#e74c3c;font-weight:bold;font-size:14px');
    problemi.forEach(p => console.log(`   • ${p}`));
  }
  
  console.log('%c═══════════════════════════════════════', 'color:#3498db;font-weight:bold');
  
  return risultati;
})();
```

### 10.2 Monitor Continuo

Per monitorare lo script in tempo reale:

```javascript
(function monitor() {
  let checkNum = 0;
  console.log('%c[MONITOR] 📊 Avviato - log ogni 30s', 'background:#9b59b6;color:#fff;padding:4px 8px;font-weight:bold');
  
  setInterval(() => {
    checkNum++;
    const el = document.querySelector('a[href*="lista=WA2"]');
    const val = el ? el.textContent.trim() : 'N/A';
    const stored = localStorage.getItem('tw_mars_last_value');
    const badge = !!document.querySelector('#twBadge');
    
    console.log(`[MONITOR] Check #${checkNum} - Valore: ${val} | Storage: ${stored} | Badge: ${badge ? '✅' : '❌'}`);
  }, 30000);
})();
```

---

## 11. Comandi Utili

### 11.1 Verifica Stato

```javascript
// Script attivo?
console.log(document.querySelector('#twStyles') ? '✅ ATTIVO' : '❌ MORTO')

// Badge presente?
console.log(document.querySelector('#twBadge') ? '✅ BADGE OK' : '❌ BADGE MANCANTE')

// Valore attuale
const el = document.querySelector('a[href*="lista=WA2"]');
console.log('Valore WA2:', el ? el.textContent.trim() : 'NON TROVATO')

// Storage
console.log('Storage:', localStorage.getItem('tw_mars_last_value'))
```

### 11.2 Reset localStorage

Se vuoi ricominciare da zero:

```javascript
localStorage.removeItem('tw_mars_last_value')
console.log('✅ Storage pulito - ricarica la pagina')
```

### 11.3 Forza Notifica Test

```javascript
// Forza una notifica completa (usa con cautela)
const el = document.querySelector('a[href*="lista=WA2"]');
const current = parseInt(el.textContent.trim(), 10);
const fake = current - 1;
localStorage.setItem('tw_mars_last_value', fake);
el.textContent = current;
console.log(`✅ Preparato: storage=${fake}, DOM=${current}. Ricarica per testare.`)
```

### 11.4 Informazioni Tampermonkey

```javascript
// Cerca script Tampermonkey nel DOM
const scripts = document.querySelectorAll('script');
const tmScripts = Array.from(scripts).filter(s => s.src && s.src.includes('userscript'));
console.log('Script Tampermonkey trovati:', tmScripts.length);
tmScripts.forEach(s => console.log('  •', s.src));
```

---

## 12. Troubleshooting

### 12.1 Problemi Comuni

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| Badge 🎫 non appare | Script non iniettato | Verifica Modalità Sviluppatore in Tampermonkey |
| `❌ SCRIPT MORTO` in console | Style non iniettato | Ricarica pagina con F5 |
| Popup non appare ma beep sì | Blocco popup browser | Verifica impostazioni popup per `10.48.9.239` |
| Notifica OS non appare | Permesso negato o HTTP bloccato | Segui sezione 5 (chrome://flags) |
| TTS non parla | Audio bloccato o non supportato | Clicca sulla pagina prima del test |
| Script non rileva ticket | Polling troppo lento | Riduci `fetchInterval` a 15000 (15s) |
| Notifica al refresh | Normale con localStorage | Atteso: rileva ticket tra F5 |
| Beep non parte | AudioContext sospeso | Clicca sulla pagina per sbloccare audio |
| Notifica quando ticket gestito | Bug versione precedente | Assicurati di avere v2.4.1 |

### 12.2 Script non si Carica

**Sintomi**: Nessun messaggio in console, badge assente

**Checklist:**
1. ✅ Tampermonkey installato?
2. ✅ Modalità sviluppatore attiva?
3. ✅ Script salvato in Tampermonkey?
4. ✅ Toggle script verde (attivo)?
5. ✅ URL corrisponde a `http://10.48.9.239/mars_ntw/*`?

**Test:**
```javascript
// Verifica presenza Tampermonkey
console.log('Tampermonkey script:', 
  Array.from(document.querySelectorAll('script'))
    .filter(s => s.src && s.src.includes('userscript')).length
)
```

Se ritorna `0` → Tampermonkey non sta iniettando lo script.

### 12.3 Notifiche OS non Funzionano

**Causa 1**: Permesso bloccato
```javascript
console.log(Notification.permission) // deve essere "granted"
```

Se `denied` o `default` → Segui sezione 5.

**Causa 2**: HTTP non abilitato in chrome://flags

Vai su `chrome://flags/#unsafely-treat-insecure-origin-as-secure` e verifica che `http://10.48.9.239` sia nella lista e settato su "Enabled".

**Causa 3**: Browser non supporta notifiche
```javascript
console.log('Notification' in window) // deve essere true
```

### 12.4 Script si "Spegne" Dopo un Po'

**Sintomo**: Badge sparisce, console non logga più

**Causa**: Meta refresh non bloccato o page unload

**Verifica**:
```javascript
// Cerca meta refresh
document.querySelectorAll('meta[http-equiv="refresh"]').length
// Deve essere 0 se lo script funziona
```

**Soluzione**: Assicurati che lo script v2.4.1 sia installato (non versioni precedenti).

### 12.5 localStorage non Persiste

**Causa**: Modalità Incognito o impostazioni privacy

**Test**:
```javascript
localStorage.setItem('test', '123');
console.log(localStorage.getItem('test')); // deve stampare "123"
localStorage.removeItem('test');
```

Se fallisce → localStorage disabilitato. Contatta IT per whitelist `10.48.9.239`.

### 12.6 Polling Troppo Lento

Se i ticket arrivano ma lo script li rileva troppo tardi:

**Soluzione**: Riduci `fetchInterval` nello script da `30000` a `15000` (15 secondi):

```javascript
const CONFIG = {
  // ...
  fetchInterval:  15000,  // ← cambio da 30000 a 15000
  // ...
};
```

**Trade-off**: Polling più frequente = più richieste al server.

---

## 13. FAQ

### Q1: Lo script funziona se chiudo il browser?
**No.** Lo script gira solo quando il browser è aperto sulla pagina MARS. Tuttavia, il valore è salvato in localStorage quindi al riaprire rileva i ticket arrivati nel frattempo.

### Q2: Posso usare lo script su più computer?
**Sì.** Installa Tampermonkey e lo script su ogni postazione. Il localStorage è locale per ogni browser.

### Q3: Lo script rallenta la pagina?
**No.** L'overhead è minimo:
- MutationObserver: nativo del browser, molto efficiente
- Polling: 1 richiesta ogni 30s
- localStorage: operazione istantanea

### Q4: Cosa succede se il contatore diminuisce?
Il contatore diminuisce quando un operatore prende in gestione un ticket - è comportamento normale. Lo script aggiorna silenziosamente il valore salvato senza notificare (nessun alert per ticket presi in carico).

**Esempio**: Contatore passa da 5 → 4 (qualcuno ha preso un ticket)
- Script aggiorna localStorage a 4
- Nessuna notifica sonora/visiva (comportamento corretto)
- Console: `[TW] ✅ Ticket gestito: 5 → 4`
- Script continua a monitorare da 4 in poi

### Q5: Posso disattivare una delle notifiche?
**Sì.** Nel CONFIG dello script:
- `osNotifica: false` → disabilita notifiche OS
- `ttsAbilitato: false` → disabilita voce
- `beepCount: 0` → disabilita beep
- `popupDuration: 0` e rimuovi il popup → disabilita popup (non consigliato)

### Q6: Il badge verde mi dà fastidio, posso nasconderlo?
Puoi commentare la chiamata a `showBadge()` nella funzione `init()`:

```javascript
function init() {
  // ...
  // showBadge();  ← commenta questa riga
  // ...
}
```

Però senza badge non hai indicatore visivo immediato che lo script sia attivo.

### Q7: Posso cambiare il messaggio vocale?
**Sì.** Modifica `ttsMessaggio` nel CONFIG:

```javascript
ttsMessaggio: 'Operatore, nuova Mars urgente in arrivo!',
```

### Q8: Lo script funziona su altri browser?
- ✅ Chrome / Edge → **Funziona perfettamente**
- ✅ Firefox → **Funziona** (richiede Tampermonkey per Firefox)
- ❌ Safari → Non testato (Tampermonkey limitato su Safari)

### Q9: Il tecnico ha creato un ticket, quando lo rilevo?
**Massimo 30 secondi** dopo la creazione (intervallo polling). Se fai F5 manualmente prima dei 30s, lo rilevi subito.

### Q10: Posso monitorare più contatori contemporaneamente?
**Sì**, ma richiede modifiche allo script. Devi duplicare la logica `checkValue()` per ogni selettore. Contattami per assistenza.

### Q11: Lo script registra i dati da qualche parte?
**No.** Tutti i dati rimangono locali nel browser:
- localStorage locale (chiave: `tw_mars_last_value`)
- Nessuna comunicazione esterna
- Nessun tracking o analytics

### Q12: Cosa succede se cancello i dati del browser?
Perdi il valore salvato in localStorage. Alla prossima apertura lo script ripartirà dal valore attuale come "nuovo inizio".

### Q13: Perché "Limited runtime host permissions"?
Appare con "On specific sites". Normale — script funziona su siti autorizzati. Per eliminare: "Site access" → "On all sites".

---

## Checklist Installazione Completa

Prima di dichiarare l'installazione completata, verifica tutti questi punti:

```
□ Tampermonkey installato
□ Modalità Sviluppatore / Consenti Userscript attivato
□ Script v2.4.1 incollato in Tampermonkey
□ Script salvato con Ctrl+S
□ Toggle script verde (attivo)
□ @match impostato su http://10.48.9.239/mars_ntw/*
□ chrome://flags HTTP exception aggiunta per http://10.48.9.239
□ Chrome riavviato dopo flag
□ Permesso notifiche OS concesso (popup "Consenti")
□ Pagina MARS aperta: http://10.48.9.239/mars_ntw/giac_cap.php
□ Badge verde 🎫 visibile in basso a sinistra
□ Console F12 mostra: [TW v2.4.1] 🎫 ATTIVO
□ Test con ticketSim.add() → tutte e 4 le notifiche funzionano
□ Test con ticketSim.decrease() → nessuna notifica (corretto)
□ Click sul badge → mostra info corrette
□ Verifica: document.querySelector('#twStyles') → ritorna elemento
□ Verifica: Notification.permission → "granted"
```

Se tutti i punti sono ✅ → **Installazione completata con successo!**

---

## Note Finali

### Versioni

| Versione | Data | Cambiamenti |
|----------|------|-------------|
| v1.0 | Feb 2026 | Versione iniziale console-only |
| v2.0 | Feb 2026 | + Notifiche OS + TTS |
| v2.2 | Feb 2026 | + Blocco meta refresh + fetch polling |
| v2.3 | Feb 2026 | Fix style injection + badge |
| v2.4 | Feb 2026 | localStorage persistente + polling 30s |
| **v2.4.1** | **Feb 2026** | **Gestione corretta decrementi contatore (FINALE)** |

### Supporto

Per problemi tecnici:
1. Esegui diagnostica completa (sezione 10.1)
2. Verifica troubleshooting (sezione 12)
3. Controlla FAQ (sezione 13)
4. Contatta supporto IT con output diagnostica

### Crediti

- **Progetto**: TicketWatcher
- **Target**: Applicazione MARS - FiberCop TGS
- **Ambiente**: `http://10.48.9.239/mars_ntw/giac_cap.php`
- **Tecnologie**: JavaScript, Tampermonkey, Web Audio API, Notifications API, Speech Synthesis API, localStorage

---

*Documentazione TicketWatcher WA2 v2.4.1 - Febbraio 2026 - Testato e funzionante in produzione*
