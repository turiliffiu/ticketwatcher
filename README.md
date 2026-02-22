# TicketWatcher WA2

> Sistema di notifica multi-canale per applicazione MARS - Rilevamento automatico nuove richieste di assistenza

[![Version](https://img.shields.io/badge/version-2.4.1-green.svg)](https://github.com/turiliffiu/ticketwatcher)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-compatible-orange.svg)](https://www.tampermonkey.net/)

## 🎯 Problema

L'applicazione web MARS aggiorna silenziosamente un contatore numerico quando arrivano nuove richieste di assistenza. Gli operatori non si accorgono delle nuove richieste perché:

- ❌ Nessuna notifica visiva o sonora
- ❌ Il contatore si aggiorna solo dopo refresh della pagina
- ❌ Meta refresh automatico ogni 5 minuti fa perdere il tracking

## ✨ Soluzione

Script JavaScript iniettato tramite **Tampermonkey** che attiva **4 canali di notifica simultanei**:

| Canale | Descrizione | Beneficio |
|--------|-------------|-----------|
| 🔴 **Popup** | Banner rosso in alto a destra | Notifica visiva immediata |
| 🔔 **Beep** | 10 segnali sonori consecutivi | Alert udibile anche senza monitor |
| 🖥️ **OS Notification** | Notifica di sistema Windows | Funziona con browser minimizzato |
| 🗣️ **TTS** | Voce italiana sintetizzata | Notifica vocale multilingua |

## 🚀 Features

- ✅ **Polling aggressivo**: Controlla il server ogni 30 secondi
- ✅ **localStorage persistente**: Sopravvive ai refresh della pagina
- ✅ **Blocco meta refresh**: Impedisce ricaricamenti automatici
- ✅ **Badge visivo**: Indicatore verde sempre visibile quando attivo
- ✅ **Smart detection**: Riconosce ticket presi in carico (nessuna falsa notifica)
- ✅ **Zero configurazione server**: Funziona esclusivamente lato client

## 📦 Installazione Rapida

### 1. Installa Tampermonkey

- [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- [Firefox](https://addons.mozilla.org/it/firefox/addon/tampermonkey/)

### 2. Configura Permessi

**Chrome 138+**:
- Tampermonkey → Gestisci estensione → "Consenti Userscript" ON

**Chrome <138**:
- `chrome://extensions` → "Modalità sviluppatore" ON

**Site Access**:
- Tampermonkey → Dettagli → Site access → "On specific sites"
- Aggiungi: `http://YOUR_MARS_IP/*`

### 3. Installa Script

1. Apri Tampermonkey → "Crea nuovo script"
2. Copia il contenuto di [`ticketwatcher.user.js`](./ticketwatcher.user.js)
3. Incolla nell'editor e salva (Ctrl+S)
4. Verifica toggle verde (attivo)

### 4. Abilita Notifiche OS su HTTP (solo Chrome)

```
chrome://flags/#unsafely-treat-insecure-origin-as-secure
```

Aggiungi: `http://YOUR_MARS_IP` → Enabled → Relaunch

## 📖 Documentazione

- **[Documentazione Completa](./DOCUMENTATION.md)** - Guida dettagliata con troubleshooting
- **[Script Principale](./ticketwatcher.user.js)** - Codice sorgente commentato
- **[Changelog](./CHANGELOG.md)** - Storia delle versioni

## 🧪 Test

Dopo l'installazione, testa con il simulatore:

```javascript
// Incolla in console F12
(function() {
  const link = document.querySelector('a[href*="lista=WA2"]');
  if (!link) { console.error('❌ Elemento non trovato!'); return; }
  let fakeCount = parseInt(link.textContent.trim(), 10) || 0;
  window.ticketSim = {
    add(n = 1) { fakeCount += n; link.textContent = fakeCount; console.info(`➕ Simulato: ${fakeCount}`); }
  };
  console.info('🧪 ticketSim pronto! Usa: ticketSim.add()');
})();

// Poi esegui
ticketSim.add()  // Deve attivare tutte e 4 le notifiche
```

## ⚙️ Configurazione

Tutte le impostazioni si trovano nel blocco `CONFIG` dello script:

```javascript
const CONFIG = {
  selector:       'a[href*="lista=WA2"]',  // Selettore elemento
  pollInterval:   2000,                     // Check DOM ogni 2s
  fetchInterval:  30000,                    // Polling server ogni 30s
  beepFreq:       660,                      // Frequenza beep (Hz)
  beepCount:      10,                       // Numero beep
  ttsMessaggio:   'Attenzione! Nuova Mars ricevuta.',
  // ...
};
```

## 🔧 Troubleshooting

### Badge verde 🎫 non appare

- Verifica Modalità Sviluppatore / "Consenti Userscript" attivo
- Controlla "Site access" in Tampermonkey
- Console F12 deve mostrare: `[TW v2.4.1] 🎫 ATTIVO`

### Avviso "Limited permissions"

Normale con "On specific sites" — non impedisce il funzionamento. Per eliminare: Site access → "On all sites"

### Notifiche OS non funzionano

- Verifica `chrome://flags` per HTTP exception
- Console: `Notification.permission` deve essere `"granted"`

**[Troubleshooting completo →](./DOCUMENTATION.md#12-troubleshooting)**

## 📊 Compatibilità

| Browser | Supporto | Note |
|---------|----------|------|
| Chrome | ✅ Completo | Consigliato |
| Edge | ✅ Completo | Basato su Chromium |
| Firefox | ✅ Completo | Richiede Tampermonkey per Firefox |
| Safari | ⚠️ Limitato | Tampermonkey limitato su Safari |

## 🤝 Contribuire

Contributi benvenuti! Per favore:

1. Fork del repository
2. Crea un branch (`git checkout -b feature/NuovaFeature`)
3. Commit delle modifiche (`git commit -m 'Aggiunge NuovaFeature'`)
4. Push al branch (`git push origin feature/NuovaFeature`)
5. Apri una Pull Request

## 📝 License

Questo progetto è rilasciato sotto licenza MIT. Vedi [`LICENSE`](LICENSE) per dettagli.

## 👤 Autore

**Salvo**  
Progetto: TicketWatcher  
Target: Applicazione MARS - FiberCop TGS

---

## 🔖 Versioni

- **v2.4.1** (2026-02) - Gestione decrementi + doc permessi Tampermonkey  
- **v2.4** (2026-02) - localStorage persistente + polling 30s  
- **v2.3** (2026-02) - Fix style injection + badge visivo  
- **v2.2** (2026-02) - Blocco meta refresh + fetch polling  
- **v2.0** (2026-02) - Notifiche OS + Text-to-Speech  
- **v1.0** (2026-02) - Versione iniziale console-only

---

⭐ Se questo progetto ti è stato utile, lascia una stella!
