# 🚀 Guida Pubblicazione GitHub - TicketWatcher WA2

## 📋 Prerequisiti

Prima di iniziare, assicurati di avere:

- [ ] Account GitHub (registrati su https://github.com)
- [ ] Git installato sul tuo computer
- [ ] Tutti i file del progetto scaricati

---

## 🎯 Opzione 1: GitHub Web (Più Semplice)

### Passo 1: Crea Repository su GitHub

1. Vai su https://github.com
2. Clicca sul pulsante **"New"** (verde, in alto a sinistra) o vai su https://github.com/new
3. Compila i campi:
   - **Repository name**: `ticketwatcher-wa2`
   - **Description**: `Sistema notifica multi-canale per MARS WA2`
   - **Public** ✅ (per condividerlo) o **Private** (se vuoi tenerlo privato)
   - ✅ Seleziona **"Add a README file"** (poi lo sostituiremo)
   - ✅ Seleziona **"Add .gitignore"** → Template: **None** (lo caricheremo noi)
   - ✅ Seleziona **"Choose a license"** → **MIT License**
4. Clicca **"Create repository"**

### Passo 2: Carica i File

**Metodo Upload Web**:

1. Nel repository appena creato, clicca su **"Add file"** → **"Upload files"**
2. Trascina o seleziona questi file:
   - `README.md` (sostituisce quello esistente)
   - `ticketwatcher.user.js`
   - `CHANGELOG.md`
   - `TicketWatcher_WA2_Doc_v2.4.1.md` (rinomina in `DOCUMENTATION.md`)
   - `gitignore.txt` (rinomina in `.gitignore`)
   - `LICENSE` (se non l'hai già aggiunto)
3. Nella casella commit scrivi: `Release v2.4.1 - Sistema notifica completo`
4. Clicca **"Commit changes"**

✅ Fatto! Il tuo progetto è online su GitHub!

---

## 🎯 Opzione 2: Git Command Line (Avanzato)

### Passo 1: Installa Git (se non l'hai)

**Windows**:
- Scarica da https://git-scm.com/download/win
- Installa con impostazioni predefinite

**Mac**:
```bash
brew install git
```

**Linux**:
```bash
sudo apt-get install git  # Debian/Ubuntu
sudo yum install git      # RedHat/CentOS
```

### Passo 2: Configura Git (prima volta)

```bash
git config --global user.name "Tuo Nome"
git config --global user.email "tua.email@example.com"
```

### Passo 3: Crea Repository su GitHub

1. Vai su https://github.com/new
2. Nome repository: `ticketwatcher-wa2`
3. **NON** selezionare "Add a README file" (lo faremo da command line)
4. Clicca "Create repository"

### Passo 4: Prepara Cartella Locale

1. Crea una cartella per il progetto:
   ```bash
   mkdir ticketwatcher-wa2
   cd ticketwatcher-wa2
   ```

2. Copia tutti i file scaricati in questa cartella:
   - `README.md`
   - `ticketwatcher.user.js`
   - `CHANGELOG.md`
   - `DOCUMENTATION.md` (rinomina `TicketWatcher_WA2_Doc_v2.4.1.md`)
   - `.gitignore` (rinomina `gitignore.txt`)
   - `LICENSE`

### Passo 5: Inizializza Repository e Commit

```bash
# Inizializza repository Git
git init

# Aggiungi tutti i file
git add .

# Primo commit
git commit -m "Release v2.4.1 - Sistema notifica completo"

# Rinomina branch a 'main' (standard GitHub)
git branch -M main

# Collega al repository GitHub (SOSTITUISCI 'tuousername' con il tuo username!)
git remote add origin https://github.com/tuousername/ticketwatcher-wa2.git

# Pusha su GitHub
git push -u origin main
```

### Passo 6: Autenticazione GitHub

Quando fai `git push` per la prima volta, ti chiederà le credenziali:

**Opzione A - Personal Access Token (Consigliato)**:

1. Vai su https://github.com/settings/tokens
2. Clicca **"Generate new token"** → **"Generate new token (classic)"**
3. Nome: `TicketWatcher Development`
4. Seleziona scope: `repo` (Full control of private repositories)
5. Clicca **"Generate token"**
6. **COPIA IL TOKEN** (lo vedrai una sola volta!)
7. Quando Git chiede la password, incolla il token invece della password

**Opzione B - GitHub CLI (gh)**:

```bash
# Installa GitHub CLI
# Windows: scoop install gh
# Mac: brew install gh
# Linux: vedi https://github.com/cli/cli#installation

# Autentica
gh auth login

# Poi pusha normalmente
git push -u origin main
```

---

## 📝 Comandi Git Utili Futuri

### Aggiornare il Repository

Dopo aver modificato dei file:

```bash
# Vedi cosa è cambiato
git status

# Aggiungi i file modificati
git add .

# Oppure aggiungi file specifici
git add README.md ticketwatcher.user.js

# Commit con messaggio
git commit -m "Fix: Risolto problema X"

# Pusha su GitHub
git push
```

### Creare una Nuova Versione (Tag)

```bash
# Crea tag per versione
git tag -a v2.4.1 -m "Release v2.4.1"

# Pusha il tag
git push origin v2.4.1
```

### Vedere Storia Commit

```bash
git log --oneline
```

### Annullare Modifiche

```bash
# Annulla modifiche non ancora in commit
git checkout -- nome_file.js

# Annulla ultimo commit (mantiene modifiche)
git reset --soft HEAD~1
```

---

## 🔗 Dopo la Pubblicazione

### 1. Aggiorna URL nel README

Nel file `README.md`, sostituisci `yourusername` con il tuo vero username GitHub:

```markdown
[![Version](https://img.shields.io/badge/version-2.4.1-green.svg)](https://github.com/TUOUSERNAME/ticketwatcher-wa2)
```

### 2. Abilita GitHub Pages (Opzionale)

Per avere una pagina web del progetto:

1. Repository → **Settings**
2. **Pages** (menu laterale)
3. Source: **Deploy from a branch**
4. Branch: **main** → Folder: **/ (root)**
5. Clicca **Save**

Il sito sarà disponibile su: `https://tuousername.github.io/ticketwatcher-wa2/`

### 3. Aggiungi Topics

Nel repository GitHub:
1. Clicca sulla rotellina ⚙️ accanto a "About"
2. Aggiungi topics: `tampermonkey`, `userscript`, `javascript`, `mars`, `notifications`
3. Salva

### 4. Abilita Issues

Per permettere agli utenti di segnalare bug:
1. Repository → **Settings**
2. **Features** → Abilita **Issues** ✅

---

## 🎉 Link Finali

Dopo la pubblicazione avrai:

- **Repository**: `https://github.com/tuousername/ticketwatcher-wa2`
- **Installazione diretta**: `https://github.com/tuousername/ticketwatcher-wa2/raw/main/ticketwatcher.user.js`
- **Releases**: `https://github.com/tuousername/ticketwatcher-wa2/releases`

Gli utenti potranno installare lo script cliccando su:
```
https://github.com/tuousername/ticketwatcher-wa2/raw/main/ticketwatcher.user.js
```

Tampermonkey rileverà automaticamente lo script e chiederà se installarlo!

---

## ❓ Troubleshooting

### Errore: "fatal: not a git repository"
Sei nella cartella sbagliata. Vai nella cartella del progetto: `cd ticketwatcher-wa2`

### Errore: "remote: Permission denied"
Token/password sbagliati. Rigenera il Personal Access Token.

### Errore: "rejected (non-fast-forward)"
Qualcuno ha modificato il repository online. Scarica prima le modifiche:
```bash
git pull origin main
git push
```

### Come cancellare tutto e ricominciare?
```bash
rm -rf .git
git init
# Poi riparti dal Passo 5
```

---

## 📞 Supporto

Se hai problemi:
1. Controlla di aver seguito tutti i passi
2. Verifica di aver sostituito `tuousername` con il tuo username
3. Controlla che i file siano nella cartella giusta
4. Leggi gli errori: Git è molto esplicito sui problemi

---

**Buona pubblicazione! 🚀**
