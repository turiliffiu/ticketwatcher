# Changelog

Tutte le modifiche notevoli a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.1] - 2026-02-19

### Added
- Documentazione completa permessi Tampermonkey ("Site access" e "Allow User Scripts")
- Spiegazione avviso "Limited runtime host permissions"
- Test verifica fetch funzionante nella sezione diagnostica
- FAQ Q13 sui permessi Tampermonkey

### Changed
- Messaggio console decremento contatore da warning a info (`✅ Ticket gestito`)
- Migliorata sezione troubleshooting con problema permessi
- Checklist installazione aggiornata con verifica permessi

### Fixed
- Documentazione ora copre completamente i permessi richiesti da Tampermonkey
- Chiarimento sul comportamento normale dell'avviso "Limited permissions"

## [2.4.0] - 2026-02-18

### Added
- localStorage persistente per salvare ultimo valore contatore
- Rilevamento ticket anche dopo refresh manuale della pagina
- Polling aggressivo ogni 30 secondi (prima 5 minuti)

### Changed
- Intervallo fetch ridotto da 300s a 30s per rilevamento più rapido
- Script sopravvive ai refresh manuali grazie a localStorage

## [2.3.0] - 2026-02-17

### Added
- Badge visivo verde 🎫 sempre visibile quando script attivo
- Click sul badge mostra info stato script

### Fixed
- Style CSS ora iniettato all'avvio invece che al primo popup
- Risolto problema "script morto" in diagnostica

## [2.2.0] - 2026-02-17

### Added
- Blocco automatico meta refresh (impedisce ricaricamenti ogni 5 minuti)
- Fetch polling per mantenere dati aggiornati senza refresh pagina
- MutationObserver per rilevare cambiamenti DOM

### Changed
- Script non viene più perso durante meta refresh
- Pagina non si ricarica più automaticamente

## [2.0.0] - 2026-02-16

### Added
- Notifiche OS Windows (requireInteraction: true)
- Text-to-Speech italiano con voce sintetizzata
- Configurazione completa parametri TTS (volume, velocità, tono)
- Parametri configurabili per tutte le notifiche

### Changed
- Da 2 canali (popup + beep) a 4 canali (popup + beep + OS + TTS)

## [1.0.0] - 2026-02-15

### Added
- Versione iniziale
- Monitoraggio contatore WA2 con polling ogni 2 secondi
- Popup rosso visuale
- 10 beep sonori consecutivi
- Log console colorati
