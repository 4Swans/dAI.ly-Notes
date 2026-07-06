/* ============================================================
   dAI.ly Notes — app.js
   Agentic AI daily notes with voice chat + Dify Workflow
   ============================================================ */
(function () {
  'use strict';

  /* ── State ─────────────────────────────────────────────────── */
  const state = {
    selectedDate: toKey(new Date()),
    visibleMonth: new Date(),
    notes: loadNotes(),
    saveTimer: null,
    conversationId: localStorage.getItem('daily-notes-conversation-id') || '',
    recognition: null,
    ttsEnabled: localStorage.getItem('daily-notes-tts') !== 'false',
    tts: null,
    theme: localStorage.getItem('daily-notes-theme') || '',
    isProcessing: false,
    assistantOpen: localStorage.getItem('daily-notes-assistant-open') !== 'false',
  };

  /* ── Element References ─────────────────────────────────────── */
  const els = {
    monthLabel:             document.getElementById('monthLabel'),
    calendarGrid:           document.getElementById('calendarGrid'),
    mainCalendarGrid:       document.getElementById('mainCalendarGrid'),
    mainMonthLabel:         document.getElementById('mainMonthLabel'),
    mainMonthLabelBtn:      document.getElementById('mainMonthLabelBtn'),
    dateTitle:              document.getElementById('dateTitle'),
    dateSubtitle:           document.getElementById('dateSubtitle'),
    weekLabel:              document.getElementById('weekLabel'),
    noteTitle:              document.getElementById('noteTitle'),
    noteBody:               document.getElementById('noteBody'),
    saveDot:                document.getElementById('saveDot'),
    saveText:               document.getElementById('saveText'),
    wordCount:              document.getElementById('wordCount'),
    lastEdited:             document.getElementById('lastEdited'),
    prevMonth:              document.getElementById('prevMonth'),
    nextMonth:              document.getElementById('nextMonth'),
    newNoteButton:          document.getElementById('newNoteButton'),
    searchInput:            document.getElementById('searchInput'),
    chatStream:             document.getElementById('chatStream'),
    chatForm:               document.getElementById('chatForm'),
    chatInput:              document.getElementById('chatInput'),
    micButton:              document.getElementById('micButton'),
    globalMicButton:        document.getElementById('globalMicButton'),
    connectionStatus:       document.getElementById('connectionStatus'),
    ttsToggle:              document.getElementById('ttsToggle'),
    themeToggle:            document.getElementById('themeToggle'),
    sidebarToggle:          document.getElementById('sidebarToggle'),
    sidebar:                document.getElementById('sidebar'),
    sidebarOverlay:         document.getElementById('sidebarOverlay'),
    voiceInterim:           document.getElementById('voiceInterim'),
    sendButton:             document.getElementById('sendButton'),
    
    // New/Updated Views & Dialogs
    calendarView:           document.getElementById('calendarView'),
    editorView:             document.getElementById('editorView'),
    backToCalendarBtn:      document.getElementById('backToCalendarBtn'),
    
    navCalendarBtn:         document.getElementById('navCalendarBtn'),
    navAssistantToggleBtn:  document.getElementById('navAssistantToggleBtn'),
    navSettingsBtn:         document.getElementById('navSettingsBtn'),
    
    newNoteDialog:          document.getElementById('newNoteDialog'),
    newNoteDate:            document.getElementById('newNoteDate'),
    closeNewNoteDialog:     document.getElementById('closeNewNoteDialog'),
    
    settingsDialog:         document.getElementById('settingsDialog'),
    themeLightBtn:          document.getElementById('themeLightBtn'),
    themeDarkBtn:           document.getElementById('themeDarkBtn'),
  };

  /* ── Formatters ─────────────────────────────────────────────── */
  const dateFormatter    = new Intl.DateTimeFormat('en-US',  { month: 'long', day: 'numeric', year: 'numeric' });
  const subtitleFmt      = new Intl.DateTimeFormat('id-ID',  { weekday: 'long' });
  const monthFormatter   = new Intl.DateTimeFormat('id-ID',  { month: 'long', year: 'numeric' });
  const timeFmt          = new Intl.DateTimeFormat('id-ID',  { hour: '2-digit', minute: '2-digit' });

  /* ── Date Utilities ─────────────────────────────────────────── */
  function toKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  function fromKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function getWeekNumber(date) {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day    = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
  }

  /* ── Storage ────────────────────────────────────────────────── */
  function loadNotes() {
    try {
      return JSON.parse(localStorage.getItem('daily-notes-store') || '{}');
    } catch {
      return {};
    }
  }

  function saveNotes() {
    localStorage.setItem('daily-notes-store', JSON.stringify(state.notes));
  }

  function ensureNote(dateKey) {
    if (!state.notes[dateKey]) {
      state.notes[dateKey] = { title: '', body: '', updatedAt: null };
    }
    return state.notes[dateKey];
  }

  /* ── Calendar Mini ──────────────────────────────────────────── */
  function renderCalendar() {
    const month = state.visibleMonth.getMonth();
    const year  = state.visibleMonth.getFullYear();
    els.monthLabel.textContent = monthFormatter.format(state.visibleMonth);
    els.calendarGrid.innerHTML = '';

    const first  = new Date(year, month, 1);
    const cursor = new Date(year, month, 1 - first.getDay());

    for (let i = 0; i < 42; i++) {
      const dateKey = toKey(cursor);
      const btn     = document.createElement('button');
      btn.type      = 'button';
      btn.className = 'calendar-day';
      btn.textContent = cursor.getDate();
      btn.dataset.date = dateKey;

      if (cursor.getMonth() !== month)              btn.classList.add('muted');
      if (dateKey === state.selectedDate)           btn.classList.add('selected');
      if (dateKey === toKey(new Date()))            btn.classList.add('today');
      if (state.notes[dateKey]?.body || state.notes[dateKey]?.title) btn.classList.add('has-note');

      btn.addEventListener('click', () => {
        selectDate(dateKey);
        showEditorView();
      });
      els.calendarGrid.appendChild(btn);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  /* ── Big Calendar Grid ──────────────────────────────────────── */
  function renderMainCalendar() {
    const month = state.visibleMonth.getMonth();
    const year  = state.visibleMonth.getFullYear();
    
    // Update main header label
    els.mainMonthLabel.textContent = monthFormatter.format(state.visibleMonth);
    els.mainCalendarGrid.innerHTML = '';

    const first  = new Date(year, month, 1);
    // Find previous Sunday to start grid align
    const cursor = new Date(year, month, 1 - first.getDay());

    for (let i = 0; i < 42; i++) {
      const dateKey = toKey(cursor);
      const cell = document.createElement('div');
      cell.className = 'main-grid-cell';
      cell.dataset.date = dateKey;

      if (cursor.getMonth() !== month) cell.classList.add('muted');
      if (dateKey === toKey(new Date())) cell.classList.add('today');
      
      const hasNote = state.notes[dateKey]?.body || state.notes[dateKey]?.title;
      if (hasNote) cell.classList.add('has-note');

      // Cell Number & Dot wrapping
      const numWrap = document.createElement('div');
      numWrap.className = 'cell-number-wrap';
      
      const numSpan = document.createElement('span');
      numSpan.className = 'cell-number';
      numSpan.textContent = cursor.getDate();
      numWrap.appendChild(numSpan);

      const dotSpan = document.createElement('span');
      dotSpan.className = 'cell-dot';
      numWrap.appendChild(dotSpan);

      cell.appendChild(numWrap);

      // Notes content rendering inside cell
      const notesContainer = document.createElement('div');
      notesContainer.className = 'cell-notes-container';

      if (hasNote) {
        const note = state.notes[dateKey];
        if (note.title) {
          const item = document.createElement('div');
          item.className = 'cell-note-item';
          item.textContent = note.title;
          notesContainer.appendChild(item);
        }
        if (note.body) {
          const bodyItem = document.createElement('div');
          bodyItem.className = 'cell-note-item';
          // Filter headings and get first line
          const firstLine = note.body.split('\n').filter(l => l.trim() && !l.startsWith('#'))[0] || '';
          bodyItem.textContent = firstLine || 'Note exists...';
          notesContainer.appendChild(bodyItem);
        }
      }
      cell.appendChild(notesContainer);

      // Click to edit
      cell.addEventListener('click', () => {
        selectDate(dateKey);
        showEditorView();
      });

      els.mainCalendarGrid.appendChild(cell);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  function selectDate(dateKey) {
    state.selectedDate  = dateKey;
    state.visibleMonth  = fromKey(dateKey);
    renderNote();
    renderCalendar();
    renderMainCalendar();
    closeSidebar();
  }

  /* ── View Transitions ───────────────────────────────────────── */
  function showCalendarView() {
    els.calendarView.classList.remove('hidden');
    els.editorView.classList.add('hidden');
    els.navCalendarBtn.classList.add('active');
  }

  function showEditorView() {
    els.calendarView.classList.add('hidden');
    els.editorView.classList.remove('hidden');
    els.navCalendarBtn.classList.remove('active');
  }

  /* ── Toggle AI Assistant Sidebar ────────────────────────────── */
  function toggleAssistant(force) {
    if (force !== undefined) {
      state.assistantOpen = force;
    } else {
      state.assistantOpen = !state.assistantOpen;
    }
    
    localStorage.setItem('daily-notes-assistant-open', state.assistantOpen);
    const shell = document.querySelector('.app-shell');
    
    if (state.assistantOpen) {
      shell.classList.remove('assistant-collapsed');
      els.navAssistantToggleBtn.classList.add('active');
    } else {
      shell.classList.add('assistant-collapsed');
      els.navAssistantToggleBtn.classList.remove('active');
    }
  }

  /* ── Note Rendering ─────────────────────────────────────────── */
  function renderNote() {
    const date = fromKey(state.selectedDate);
    const note = ensureNote(state.selectedDate);
    els.dateTitle.textContent   = dateFormatter.format(date);
    els.dateSubtitle.textContent = `${subtitleFmt.format(date)} · Week ${getWeekNumber(date)}`;
    els.weekLabel.textContent   = state.selectedDate === toKey(new Date()) ? 'Today' : 'Daily note';
    els.noteTitle.value = note.title || '';
    els.noteBody.value  = note.body  || '';
    updateStats(note);
  }

  function updateStats(note) {
    note = note || ensureNote(state.selectedDate);
    const words = (note.body || '').trim().split(/\s+/).filter(Boolean).length;
    els.wordCount.textContent = `${words} Words`;
    els.lastEdited.textContent = note.updatedAt
      ? `Edited ${timeFmt.format(new Date(note.updatedAt))}`
      : 'Ready';
  }

  /* ── Auto-save ──────────────────────────────────────────────── */
  function persistActiveNote() {
    const note = ensureNote(state.selectedDate);
    note.title     = els.noteTitle.value;
    note.body      = els.noteBody.value;
    note.updatedAt = new Date().toISOString();
    saveNotes();
    updateStats(note);
    renderCalendar();
    renderMainCalendar();
  }

  function scheduleSave() {
    els.saveText.textContent = 'Saving...';
    els.saveDot.classList.add('saving');
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
      persistActiveNote();
      els.saveText.textContent = 'Auto saved';
      els.saveDot.classList.remove('saving');
    }, 500);
  }

  /* ── Markdown Mini-Renderer ─────────────────────────────────── */
  function renderMarkdown(text) {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>(\n|$))+/g, (m) => `<ul>${m}</ul>`);
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm,  '<h3>$1</h3>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  /* ── Chat Messages ──────────────────────────────────────────── */
  function addMessage(role, text, meta = '') {
    const wrapper = document.createElement('div');
    wrapper.className = role === 'user' ? 'message user' : 'message ai';

    const small = document.createElement('small');
    small.textContent = meta || (role === 'user' ? 'You' : 'AI Assistant');

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (role === 'ai') {
      bubble.innerHTML = renderMarkdown(text);
    } else {
      bubble.textContent = text;
    }

    wrapper.append(small, bubble);
    els.chatStream.appendChild(wrapper);
    els.chatStream.scrollTop = els.chatStream.scrollHeight;
    return wrapper;
  }

  function addSystemCard(text, type = '') {
    const card = document.createElement('div');
    card.className = ['system-card', type].filter(Boolean).join(' ');
    card.textContent = text;
    els.chatStream.appendChild(card);
    els.chatStream.scrollTop = els.chatStream.scrollHeight;
  }

  /* ── Connection Status ──────────────────────────────────────── */
  function setStatus(label, state) {
    els.connectionStatus.textContent = label;
    els.connectionStatus.className = `connection-pill state-${state}`;
  }

  /* ── Context Builder ────────────────────────────────────────── */
  function currentContext() {
    const note = ensureNote(state.selectedDate);
    return {
      selectedDate: state.selectedDate,
      noteTitle:    note.title || '',
      noteBody:     note.body  || '',
      notes:        Object.fromEntries(Object.entries(state.notes).slice(-80)),
    };
  }

  /* ── Dify Agent Call ────────────────────────────────────────── */
  async function sendToAgent(prompt) {
    if (state.isProcessing) return;
    state.isProcessing = true;

    persistActiveNote();
    addMessage('user', prompt);
    setStatus('Thinking...', 'thinking');
    els.sendButton.disabled = true;

    const pending = addMessage('ai', 'Memproses perintah dan membaca konteks note...', 'AI Assistant');

    try {
      const response = await fetch('/api/agent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          prompt,
          context:        currentContext(),
          conversationId: state.conversationId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Dify request failed');

      if (payload.conversationId) {
        state.conversationId = payload.conversationId;
        localStorage.setItem('daily-notes-conversation-id', payload.conversationId);
      }

      const normalized = normalizeAgentPayload(payload);
      const replyText  = normalized.reply || 'Selesai.';
      const bubble     = pending.querySelector('.bubble');
      bubble.innerHTML = renderMarkdown(replyText);

      applyActions(normalized.actions || []);
      setStatus('Connected', 'connected');

      if (state.ttsEnabled) speak(replyText);

    } catch (error) {
      const bubble = pending.querySelector('.bubble');
      bubble.innerHTML = renderMarkdown(
        `❌ Belum bisa menghubungi agent Dify: **${error.message}**\n\nPastikan server berjalan dan DIFY_API_KEY sudah diisi di file .env`
      );
      setStatus('Error', 'error');
      setTimeout(() => setStatus('Ready', 'ready'), 4000);
    } finally {
      els.sendButton.disabled = false;
      state.isProcessing = false;
    }
  }

  /* ── Payload Normalization ──────────────────────────────────── */
  function normalizeAgentPayload(payload) {
    const raw = payload.result ?? payload.answer ?? payload.data?.outputs ?? payload;

    if (typeof raw === 'string') {
      return parseMaybeJson(raw) || { reply: raw, actions: [] };
    }

    if (raw && typeof raw === 'object') {
      const reply = raw.reply ?? raw.answer ?? raw.text ?? raw.output ?? '';
      let actions = raw.actions ?? raw.action ?? [];

      if (typeof actions === 'string') {
        try { actions = JSON.parse(actions); } catch { actions = []; }
      }
      if (!Array.isArray(actions)) actions = [];

      if (reply || actions.length > 0) return { reply, actions };
    }

    return { reply: 'Workflow selesai, tetapi output belum memiliki field reply/actions.', actions: [] };
  }

  function parseMaybeJson(text) {
    const trimmed = String(text).trim();
    const inner = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    if (!inner.startsWith('{') && !inner.startsWith('[')) return null;
    try {
      const parsed = JSON.parse(inner);
      return Array.isArray(parsed)
        ? { reply: 'Saya menerapkan perubahan yang diminta.', actions: parsed }
        : parsed;
    } catch {
      return null;
    }
  }

  /* ── Action Engine ──────────────────────────────────────────── */
  function applyActions(actions) {
    if (!Array.isArray(actions) || actions.length === 0) return;
    let applied = 0;

    actions.forEach((action) => {
      const date = action.date || state.selectedDate;
      const note = ensureNote(date);
      const now  = new Date().toISOString();

      switch (action.type) {
        case 'set_note':
          note.title     = action.title ?? note.title;
          note.body      = action.body ?? action.content ?? note.body;
          note.updatedAt = now;
          applied++;
          break;

        case 'append_note': {
          const addition = action.text ?? action.content ?? '';
          note.body      = [note.body, addition].filter(Boolean).join(note.body ? '\n\n' : '');
          note.updatedAt = now;
          applied++;
          break;
        }

        case 'replace_text': {
          const find    = action.find ?? '';
          const replace = action.replace ?? '';
          if (find) note.body = note.body.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
          note.updatedAt = now;
          applied++;
          break;
        }

        case 'move_note':
          if (action.to) {
            state.notes[action.to] = { ...note, updatedAt: now };
            if (action.deleteOriginal) delete state.notes[date];
            applied++;
          }
          break;

        case 'delete_note':
          if (state.notes[date]) {
            delete state.notes[date];
            applied++;
          }
          break;

        default:
          console.warn('[dAI.ly] Unknown action type:', action.type);
      }
    });

    saveNotes();
    renderNote();
    renderCalendar();
    renderMainCalendar();

    if (applied > 0) {
      addSystemCard(`✓ ${applied} perubahan diterapkan ke calendar notes.`, 'success');
    }
  }

  /* ── Text-to-Speech ─────────────────────────────────────────── */
  function speak(text) {
    if (!('speechSynthesis' in window) || !state.ttsEnabled) return;
    window.speechSynthesis.cancel();

    const clean = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^[-*#] /gm, '')
      .trim();

    const utt  = new SpeechSynthesisUtterance(clean);
    utt.lang   = 'id-ID';
    utt.rate   = 1.0;
    utt.pitch  = 1.0;
    state.tts  = utt;

    utt.onstart = () => {
      els.ttsToggle.classList.add('speaking');
    };
    utt.onend = utt.onerror = () => {
      els.ttsToggle.classList.remove('speaking');
      state.tts = null;
    };

    window.speechSynthesis.speak(utt);
  }

  function toggleTts() {
    state.ttsEnabled = !state.ttsEnabled;
    localStorage.setItem('daily-notes-tts', state.ttsEnabled);
    const icon = els.ttsToggle.querySelector('.material-symbols-outlined');
    icon.textContent = state.ttsEnabled ? 'volume_up' : 'volume_off';
    els.ttsToggle.title = state.ttsEnabled ? 'TTS On' : 'TTS Off';
    els.ttsToggle.classList.toggle('active', state.ttsEnabled);
    if (!state.ttsEnabled) window.speechSynthesis.cancel();
    addSystemCard(state.ttsEnabled ? '🔊 Text-to-Speech dinyalakan.' : '🔇 Text-to-Speech dimatikan.');
  }

  /* ── Theme Controls (Settings Dialog) ────────────────────────── */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const darkActive = theme === 'dark';
    els.themeDarkBtn.classList.toggle('active', darkActive);
    els.themeLightBtn.classList.toggle('active', !darkActive);
  }

  function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem('daily-notes-theme', theme);
    applyTheme(theme);
  }

  /* ── Voice Recognition ──────────────────────────────────────── */
  function setupSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      els.micButton.title = 'Browser belum mendukung Web Speech API';
      els.globalMicButton.title = els.micButton.title;
      return;
    }

    state.recognition                = new SR();
    state.recognition.lang           = 'id-ID';
    state.recognition.interimResults = true;
    state.recognition.continuous     = true; // Mengizinkan pengenalan suara berkelanjutan tanpa putus di tengah kalimat

    let voiceSilenceTimer = null;

    state.recognition.addEventListener('result', (event) => {
      let interim   = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      // Tampilkan teks sementara secara real-time di kolom input chat agar user tahu apa yang sedang direkam
      if (interim) {
        els.chatInput.value = interim;
        autosizeChatInput();
        els.voiceInterim.textContent = interim;
        els.voiceInterim.classList.add('visible');
      }

      if (finalText.trim()) {
        els.chatInput.value = finalText.trim();
        autosizeChatInput();
        els.voiceInterim.classList.remove('visible');
        els.voiceInterim.textContent = '';

        // Reset timer jeda hening jika ada input kata baru yang final
        clearTimeout(voiceSilenceTimer);
        
        // Cerdas: Kirim otomatis hanya jika user hening/berhenti bicara selama 2.2 detik setelah kalimat final selesai dideteksi
        voiceSilenceTimer = setTimeout(() => {
          const prompt = els.chatInput.value.trim();
          if (prompt && els.micButton.classList.contains('listening')) {
            state.recognition.stop(); // Hentikan mic & trigger eksekusi
            sendToAgent(prompt);
            els.chatInput.value = '';
            resetChatInputHeight();
          }
        }, 2200);
      }
    });

    state.recognition.addEventListener('end', () => {
      clearTimeout(voiceSilenceTimer);
      
      // Jika mic mati secara manual (user klik lagi tombol mic untuk stop), eksekusi teks tersisa
      const prompt = els.chatInput.value.trim();
      if (prompt) {
        sendToAgent(prompt);
        els.chatInput.value = '';
        resetChatInputHeight();
      }

      els.micButton.classList.remove('listening');
      els.globalMicButton.classList.remove('listening');
      els.voiceInterim.classList.remove('visible');
      els.voiceInterim.textContent = '';
      setTimeout(() => { state.isProcessing = false; }, 300);
    });

    state.recognition.addEventListener('error', (e) => {
      clearTimeout(voiceSilenceTimer);
      if (e.error !== 'aborted') {
        addSystemCard(`Voice error: ${e.error}`, 'error');
      }
    });
  }

  function startVoice() {
    if (!state.recognition) {
      addSystemCard('Voice chat membutuhkan Chrome atau Edge. Kamu bisa mengetik perintah ke AI.', 'error');
      return;
    }
    if (state.ttsEnabled) window.speechSynthesis.cancel();

    if (els.micButton.classList.contains('listening')) {
      state.recognition.abort();
      return;
    }

    els.micButton.classList.add('listening');
    els.globalMicButton.classList.add('listening');

    try {
      state.recognition.start();
    } catch (e) {
      state.recognition.abort();
      setTimeout(() => {
        try {
          els.micButton.classList.add('listening');
          els.globalMicButton.classList.add('listening');
          state.recognition.start();
        } catch {
          els.micButton.classList.remove('listening');
          els.globalMicButton.classList.remove('listening');
          addSystemCard('Mic tidak bisa dimulai. Coba klik lagi.', 'error');
        }
      }, 200);
    }
  }

  /* ── Chat Input Height Helpers ──────────────────────────────── */
  function resetChatInputHeight() {
    els.chatInput.style.height = '';
  }

  function autosizeChatInput() {
    els.chatInput.style.height = 'auto';
    const natural = els.chatInput.scrollHeight;
    els.chatInput.style.height = `${Math.min(Math.max(natural, 44), 130)}px`;
  }

  /* ── Mobile Sidebar ─────────────────────────────────────────── */
  function openSidebar() {
    els.sidebar.classList.add('open');
    els.sidebarOverlay.classList.add('visible');
    els.sidebarToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    els.sidebar.classList.remove('open');
    els.sidebarOverlay.classList.remove('visible');
    els.sidebarToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  /* ── Demo Note Seed ─────────────────────────────────────────── */
  function seedDemoNote() {
    if (Object.keys(state.notes).length) return;
    state.notes[state.selectedDate] = {
      title: 'AI-driven workflow planning',
      body: [
        'Rapat pagi ini sangat produktif. Tim membahas workflow Dify untuk Daily Notes.',
        '',
        'Key Takeaways:',
        '- Sambungkan Dify dengan model Gemini 2.0 Flash',
        '- Aktifkan voice command untuk input note secara hands-free',
        '- Calendar harus bisa diedit oleh AI via structured actions',
        '',
        'Next steps: isi DIFY_API_KEY di file .env dan jalankan npm start.',
      ].join('\n'),
      updatedAt: new Date().toISOString(),
    };
    saveNotes();
  }

  /* ── Event Bindings ─────────────────────────────────────────── */
  function bindEvents() {
    // Navigation events
    els.navCalendarBtn.addEventListener('click', () => {
      showCalendarView();
      closeSidebar();
    });

    els.backToCalendarBtn.addEventListener('click', showCalendarView);

    els.navAssistantToggleBtn.addEventListener('click', () => {
      toggleAssistant();
      closeSidebar();
    });

    els.navSettingsBtn.addEventListener('click', () => {
      els.settingsDialog.showModal();
      closeSidebar();
    });

    // Theme selector inside settings
    els.themeLightBtn.addEventListener('click', () => setTheme('light'));
    els.themeDarkBtn.addEventListener('click', () => setTheme('dark'));

    // New Note Dialog Flow
    els.newNoteButton.addEventListener('click', () => {
      els.newNoteDate.value = toKey(new Date());
      els.newNoteDialog.showModal();
    });

    els.closeNewNoteDialog.addEventListener('click', () => {
      els.newNoteDialog.close();
    });

    els.newNoteDialog.addEventListener('submit', (e) => {
      const selected = els.newNoteDate.value;
      if (selected) {
        selectDate(selected);
        showEditorView();
        els.noteBody.focus();
      }
    });

    // Main calendar month dropdown toggle (quick month step)
    els.mainMonthLabelBtn.addEventListener('click', () => {
      // Toggle to next month easily on click for simple demo
      state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() + 1, 1);
      renderCalendar();
      renderMainCalendar();
    });

    // Mini Calendar nav
    els.prevMonth.addEventListener('click', () => {
      state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() - 1, 1);
      renderCalendar();
      renderMainCalendar();
    });
    els.nextMonth.addEventListener('click', () => {
      state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() + 1, 1);
      renderCalendar();
      renderMainCalendar();
    });

    // Note editing
    els.noteTitle.addEventListener('input', scheduleSave);
    els.noteBody.addEventListener('input', scheduleSave);

    // Chat input & form
    els.chatInput.addEventListener('input', autosizeChatInput);
    els.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        els.chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
      if (e.key === 'Escape') {
        if (state.recognition) state.recognition.abort();
      }
    });

    els.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const prompt = els.chatInput.value.trim();
      if (!prompt) return;
      els.chatInput.value = '';
      resetChatInputHeight();
      sendToAgent(prompt);
    });

    document.querySelectorAll('[data-prompt]').forEach((btn) => {
      btn.addEventListener('click', () => sendToAgent(btn.dataset.prompt));
    });

    els.micButton.addEventListener('click', startVoice);
    els.globalMicButton.addEventListener('click', startVoice);
    els.ttsToggle.addEventListener('click', toggleTts);

    // Topbar Search (navigates to match note date)
    els.searchInput.addEventListener('input', () => {
      const query = els.searchInput.value.toLowerCase().trim();
      if (!query) {
        renderCalendar();
        renderMainCalendar();
        return;
      }
      const hit = Object.entries(state.notes).find(([, note]) =>
        `${note.title} ${note.body}`.toLowerCase().includes(query)
      );
      if (hit) {
        selectDate(hit[0]);
        showEditorView();
      }
    });

    els.sidebarToggle.addEventListener('click', openSidebar);
    els.sidebarOverlay.addEventListener('click', closeSidebar);
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    // Apply theme
    applyTheme(state.theme || 'light');

    // Assistant panel init toggle
    toggleAssistant(state.assistantOpen);

    // TTS init
    const ttsIcon = els.ttsToggle.querySelector('.material-symbols-outlined');
    ttsIcon.textContent = state.ttsEnabled ? 'volume_up' : 'volume_off';
    els.ttsToggle.classList.toggle('active', state.ttsEnabled);

    seedDemoNote();
    setupSpeech();
    bindEvents();
    renderNote();
    renderCalendar();
    renderMainCalendar();
    showCalendarView();

    addSystemCard(
      'Hi saya adalah AI Assistant dAI.ly notes',
    );
  }

  init();
})();
