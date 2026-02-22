# TicketWatcher — Documentazione v2.4.1

> Sistema notifica multi-canale per MARS WA2

**Versione**: 2.4.1 | **Target**: FiberCop TGS | **URL**: `http://10.48.9.239/mars_ntw/`

## ⚠️ Novità v2.4.1

- ✅ **Gestione decrementi**: Ticket presi in carico non generano false notifiche
- ✅ **Permessi Tampermonkey**: Sezione completa su "Site access" e "Allow User Scripts"  
- ✅ **Avviso "Limited permissions"**: Spiegazione e soluzione
- ✅ **Test fetch**: Verifica polling funzionante
- ✅ **FAQ ampliata**: Q13 su permessi

---

## 📑 Indice

1. [Panoramica](#1-panoramica)  
2. [Come Funziona](#2-come-funziona)  
3. [Prerequisiti](#3-prerequisiti)  
4. [Installazione Tampermonkey](#4-installazione-tampermonkey)
5. [Notifiche OS su HTTP](#5-notifiche-os-su-http)  
6. [Script v2.4.1](#6-script-v241)  
7. [Configurazione](#7-configurazione)  
8. [Verifica](#8-verifica)
9. [Test](#9-test)  
10. [Diagnostica](#10-diagnostica)  
11. [Comandi Utili](#11-comandi-utili)  
12. [Troubleshooting](#12-troubleshooting) 
13. [FAQ](#13-faq)

---

## 1. Panoramica

**Problema**: Contatore ticket si aggiorna silenziosamente, nessuna notifica operatori.

**Soluzione**: 4 canali notifica simultanei:
- 🔴 Popup rosso  
- 🔔 10 beep  
- 🖥️ Notifica OS Windows  
- 🗣️ Voce italiana TTS

**Caratteristiche**:
- Polling server 30s
- localStorage persistente  
- Blocco meta refresh
- Badge verde sempre visibile
- Gestione ticket presi in carico

---

## 4. Installazione Tampermonkey

### 4.1 Installa Estensione

Chrome: https://chrome.google.com/webstore → Tampermonkey

### 4.2 Modalità Sviluppatore

**Chrome 138+**: Tampermonkey → Gestisci estensione → "Consenti Userscript"  
**Chrome <138**: `chrome://extensions` → "Modalità sviluppatore" ON

### 4.3 ⚠️ Permessi "Site Access" (CRITICO)

**Opzione A - Specifico (Consigliato)**:
1. Tampermonkey → Dettagli  
2. "Site access" → "On specific sites"  
3. Aggiungi: `http://10.48.9.239/*`

**Opzione B - Universale**:
"Site access" → "On all sites"

> 📌 Con "On specific sites" vedrai "Limited permissions" — è normale e non blocca lo script.

### 4.4 Allow User Scripts

Tampermonkey → Dettagli → Toggle "Allow User Scripts" ON (blu)

### 4.5 Crea Script

Tampermonkey → Crea nuovo → Incolla script sezione 6 → Ctrl+S

---

## 6. Script v2.4.1

```javascript
// ==UserScript==
// @name         TicketWatcher WA2 v2.4.1
// @version      2.4.1
// @match        http://10.48.9.239/mars_ntw/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';
  console.log('[TW] 🚀 Script v2.4.1 FINAL caricato');
  const STORAGE_KEY = 'tw_mars_last_value';
  
  // Blocca meta refresh
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
  if (document.documentElement) metaObserver.observe(document.documentElement, { childList: true, subtree: true });

  // CONFIG
  const CONFIG = {
    selector: 'a[href*="lista=WA2"]',
    pollInterval: 2000,
    fetchInterval: 30000,
    popupDuration: 8000,
    beepFreq: 660,
    beepDuration: 1.2,
    beepCount: 10,
    osNotifica: true,
    osTitle: '🔔 Nuova Mars!',
    osBody: 'È arrivata una nuova richiesta di assistenza.',
    osIcon: 'https://cdn-icons-png.flaticon.com/512/1827/1827392.png',
    ttsAbilitato: true,
    ttsMessaggio: 'Attenzione! Nuova Mars ricevuta.',
    ttsLingua: 'it-IT',
    ttsVolume: 1.0,
    ttsVelocita: 0.9,
    ttsTono: 1.0,
  };

  let lastValue = null, mutationObs = null, domPoller = null, fetchPoller = null, audioCtx = null, activePopup = null;

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
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'sine'; osc.frequency.value = CONFIG.beepFreq;
        gain.gain.setValueAtTime(0.6, time + i * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.35 + CONFIG.beepDuration);
        osc.start(time + i * 0.35);
        osc.stop(time + i * 0.35 + CONFIG.beepDuration);
      }
    } catch (e) { console.warn('[TW] Audio non disponibile:', e.message); }
  }

  function richiediPermessoNotifiche() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => console.info(`[TW] Permesso notifiche OS: ${p}`));
    }
  }

  function showOsNotification(oldVal, newVal) {
    if (!CONFIG.osNotifica || !('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(CONFIG.osTitle, {
      body: `${CONFIG.osBody}\nContatore: ${oldVal} → ${newVal}`,
      icon: CONFIG.osIcon,
      requireInteraction: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
  }

  function speak(oldVal, newVal) {
    if (!CONFIG.ttsAbilitato || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(CONFIG.ttsMessaggio);
    msg.lang = CONFIG.ttsLingua; msg.volume = CONFIG.ttsVolume; msg.rate = CONFIG.ttsVelocita; msg.pitch = CONFIG.ttsTono;
    window.speechSynthesis.speak(msg);
  }

  function injectStyles() {
    if (document.getElementById('twStyles')) return;
    const style = document.createElement('style');
    style.id = 'twStyles';
    style.textContent = `@keyframes twSlideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes twSlideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}`;
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
    popup.innerHTML = `<div style="display:flex;align-items:center;gap:12px;"><span style="font-size:2rem;">🔔</span><div><div style="font-weight:700;font-size:1.1rem;">Nuova Mars ricevuta!</div><div style="margin-top:4px;opacity:0.9;">Ticket: <b>${oldVal}</b> → <b style="color:#ffd700">${newVal}</b></div><div style="font-size:0.78rem;margin-top:4px;opacity:0.7;">${new Date().toLocaleTimeString()}</div></div><button id="twClose" style="margin-left:auto;background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:1.1rem;">✕</button></div>`;
    Object.assign(popup.style, {
      position: 'fixed', top: '20px', right: '20px', zIndex: '2147483647',
      background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: '#fff',
      padding: '16px 20px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      minWidth: '300px', fontFamily: 'system-ui', animation: 'twSlideIn 0.3s ease'
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
    return el ? parseInt(el.textContent.trim(), 10) : null;
  }

  function notifyNewTicket(oldVal, newVal) {
    console.info(`%c[TW] 🔔 NUOVO TICKET! ${oldVal} → ${newVal}`, 'background:#e74c3c;color:#fff;padding:8px;font-weight:bold;font-size:14px');
    playBeep(); showPopup(oldVal, newVal); showOsNotification(oldVal, newVal); speak(oldVal, newVal);
    lastValue = newVal; localStorage.setItem(STORAGE_KEY, newVal);
  }

  function checkValue() {
    const current = readValue();
    if (current === null || isNaN(current)) return;
    if (lastValue === null) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        lastValue = parseInt(stored, 10);
        console.info(`[TW] 📦 Recuperato da storage: ${lastValue}`);
        if (current > lastValue) { notifyNewTicket(lastValue, current); return; }
      }
      lastValue = current; localStorage.setItem(STORAGE_KEY, current);
      console.info(`[TW] ✅ Avviato — WA2 attuale: ${current}`);
      return;
    }
    if (current > lastValue) {
      notifyNewTicket(lastValue, current);
    } else if (current < lastValue) {
      console.info(`[TW] ✅ Ticket gestito: ${lastValue} → ${current}`);
      lastValue = current; localStorage.setItem(STORAGE_KEY, current);
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
        const parser = new DOMParser(), doc = parser.parseFromString(html, 'text/html');
        const newEl = doc.querySelector(CONFIG.selector), oldEl = document.querySelector(CONFIG.selector);
        if (newEl && oldEl) {
          const newVal = parseInt(newEl.textContent.trim(), 10), oldVal = parseInt(oldEl.textContent.trim(), 10);
          if (newVal !== oldVal) { console.log(`[TW] 🔄 Fetch rileva cambio: ${oldVal} → ${newVal}`); oldEl.textContent = newVal; }
          else console.log(`[TW] 🔄 Fetch: nessun cambio (${newVal})`);
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
    badge.id = 'twBadge'; badge.innerHTML = '🎫'; badge.title = 'TicketWatcher v2.4.1 ATTIVO';
    Object.assign(badge.style, {
      position: 'fixed', bottom: '10px', left: '10px', zIndex: '2147483646',
      background: '#27ae60', color: '#fff', width: '32px', height: '32px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
      cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', transition: 'transform 0.2s'
    });
    badge.addEventListener('mouseenter', () => badge.style.transform = 'scale(1.2)');
    badge.addEventListener('mouseleave', () => badge.style.transform = 'scale(1)');
    badge.addEventListener('click', () => {
      const val = readValue(), stored = localStorage.getItem(STORAGE_KEY);
      alert(`TicketWatcher v2.4.1 ATTIVO ✅\n\nValore attuale: ${val}\nValore salvato: ${stored}\nPolling: ogni ${CONFIG.fetchInterval/1000}s\n\nUltimo check: ${new Date().toLocaleTimeString()}`);
    });
    document.body.appendChild(badge);
    console.log('[TW] 🎫 Badge verde attivo');
  }

  function init() {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); return; }
    document.querySelectorAll('meta[http-equiv="refresh"]').forEach(meta => { console.log('[TW] 🛑 Meta refresh rimosso'); meta.remove(); });
    injectStyles(); richiediPermessoNotifiche(); checkValue(); startMutationObserver();
    domPoller = setInterval(checkValue, CONFIG.pollInterval); startFetchPolling(); showBadge();
    console.info('%c[TW v2.4.1] 🎫 ATTIVO - Polling 30s + localStorage', 'color:#27ae60;font-weight:bold;font-size:16px');
  }
  init();
})();
```

---

## 8. Verifica

### Badge Verde 🎫

In basso a sinistra deve apparire badge verde. Click → info script.

### Console

```
[TW] 🚀 Script v2.4.1 FINAL caricato
[TW] ✅ Avviato — WA2 attuale: X
[TW v2.4.1] 🎫 ATTIVO
```

### Test Fetch

```javascript
fetch(window.location.href, { cache: 'no-store' })
  .then(() => console.log('✅ Fetch OK'))
  .catch(e => console.error('❌ Fetch bloccato:', e))
```

---

## 12. Troubleshooting

### Badge Non Appare

**Causa**: Permessi Tampermonkey mancanti  
**Fix**: Verifica sezione 4.3 e 4.4

### Avviso "Limited Permissions"

**Causa**: "On specific sites" configurato  
**Fix**: Normale — non blocca funzionamento. Per eliminare: "Site access" → "On all sites"

### Script Non Iniettato

**Checklist**:
- ✅ "Allow User Scripts" ON?
- ✅ `http://10.48.9.239/*` in "Site access"?
- ✅ Toggle script verde?

---

## 13. FAQ

**Q13: Perché "Limited runtime host permissions"?**

Appare con "On specific sites". Normale — script funziona su siti autorizzati. Per eliminare: "Site access" → "On all sites".

---

**Checklist Installazione**:
```
□ Tampermonkey installato
□ "Consenti Userscript" / "Modalità sviluppatore" ON
□ "Allow User Scripts" ON
□ Site access: http://10.48.9.239/* aggiunto
□ Script v2.4.1 salvato
□ chrome://flags HTTP exception
□ Permesso notifiche OS concesso
□ Badge verde visibile
□ Console: [TW v2.4.1] ATTIVO
□ Test fetch: ✅ OK
□ ticketSim.add() → 4 notifiche
```

---

**Versioni**: v1.0 → v2.0 → v2.2 → v2.3 → v2.4 → **v2.4.1 (FINALE)**

*TicketWatcher WA2 v2.4.1 - FiberCop TGS - Febbraio 2026*
