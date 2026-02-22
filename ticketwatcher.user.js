// ==UserScript==
// @name         TicketWatcher WA2 v2.4.1 FINAL
// @namespace    http://tampermonkey.net/
// @version      2.4.1
// @description  Sistema notifica multi-canale per MARS WA2 - Polling aggressivo + localStorage persistente
// @author       Salvo
// @match        http://10.48.9.239/mars_ntw/*
// @grant        none
// @run-at       document-start
// @homepage     https://github.com/yourusername/ticketwatcher-wa2
// @updateURL    https://github.com/yourusername/ticketwatcher-wa2/raw/main/ticketwatcher.user.js
// @downloadURL  https://github.com/yourusername/ticketwatcher-wa2/raw/main/ticketwatcher.user.js
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
