const input = document.getElementById('typeInput');
const ghost = document.getElementById('ghostLayer');
const grammar = document.getElementById('grammarLayer');
const wrap = document.getElementById('barWrap');
const meta = document.getElementById('meta');
let currentSuggestion = "";
let currentGrammarCorrection = "";
async function fetchPrediction(text) {
  if (!text.trim()) return "";
  try {
    const r = await fetch("http://127.0.0.1:4000/predict", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text}),
    });
    const {suggestions} = await r.json();
    return suggestions.length > 0 ? suggestions[0] : "";
  } catch (e) {
    return "";
  }
}

async function fetchGrammar(text) {
  if (!text.trim()) return "";
  try {
    const r = await fetch("http://127.0.0.1:4000/grammar", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text}),
    });
    const data = await r.json();
    return data.corrected || "";
  } catch (e) {
    return "";
  }
}

let debounceTimer;
let grammarDebounceTimer;

// ponytail: dynamic-sizing engine.
function autosize(val) {
  // The ghost layer is already updated by updateUI, so it occupies the natural width/height.
  input.style.height = 'auto';
  const needed = input.scrollHeight;
  // Bar parent grows via .bar max-height; we set the textarea to match scrollHeight,
  // capped by parent's clientHeight (which itself is capped by CSS max-height).
  const parentMax = wrap.querySelector('.bar').clientHeight - 40; // minus padding
  const target = Math.min(needed, parentMax);
  input.style.height = target + 'px';
  // Keep latest text scrolled into view
  input.scrollTop = input.scrollHeight;
}

async function fetchPredictionArray(text) {
  if (!text.trim()) return [];
  try {
    const r = await fetch("http://127.0.0.1:4000/predict", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text}),
    });
    const {suggestions} = await r.json();
    return suggestions || [];
  } catch (e) {
    return [];
  }
}

let lastContext = null;
let cachedSuggestions = [];

async function render(){
  const val = input.value;
  
  clearTimeout(grammarDebounceTimer);
  if (val.trim()) {
    grammarDebounceTimer = setTimeout(async () => {
      const corrected = await fetchGrammar(val);
      if (input.value === val) { // Ensure input hasn't changed
        if (corrected && corrected !== val) {
          input.value = corrected;
          currentGrammarCorrection = "";
          renderGrammar(corrected, "");
          updateUI(corrected);
          autosize(corrected);
        }
      }
    }, 400);
  } else {
    currentGrammarCorrection = "";
    renderGrammar(val, "");
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    let context = val;
    let partialWord = "";
    if (!val.endsWith(" ")) {
       const lastSpaceIdx = val.lastIndexOf(" ");
       if (lastSpaceIdx !== -1) {
         context = val.substring(0, lastSpaceIdx + 1);
         partialWord = val.substring(lastSpaceIdx + 1);
       } else {
         context = "";
         partialWord = val;
       }
    }
    
    let suggestions = [];
    if (context === lastContext) {
      suggestions = cachedSuggestions;
    } else {
      suggestions = await fetchPredictionArray(context);
      lastContext = context;
      cachedSuggestions = suggestions;
    }
    
    if (input.value === val) { // Avoid race conditions
      currentSuggestion = "";
      if (partialWord) {
         for (let s of suggestions) {
           if (s && s.toLowerCase().startsWith(partialWord.toLowerCase())) {
             currentSuggestion = s.substring(partialWord.length);
             break;
           }
         }
      } else {
         currentSuggestion = suggestions.length > 0 ? suggestions[0] : "";
      }
      updateUI(val);
      autosize(val);
    }
  }, 0);
}

function renderGrammar(val, corrected) {
  grammar.innerHTML = "";
  if (!corrected || val.trim() === corrected.trim()) return;
  
  const valTokens = val.split(/(\s+)/);
  const corrTokens = corrected.split(/(\s+)/);
  
  const valWords = valTokens.filter((_, i) => i % 2 === 0);
  const corrWords = corrTokens.filter((_, i) => i % 2 === 0);
  
  let wordIdx = 0;
  for (let i = 0; i < valTokens.length; i++) {
    if (i % 2 !== 0) { // whitespace
      grammar.appendChild(document.createTextNode(valTokens[i]));
    } else {
      const w = valTokens[i];
      if (w === "") continue;
      if (wordIdx < corrWords.length && w !== corrWords[wordIdx]) {
        const span = document.createElement('span');
        span.className = 'mistake';
        span.textContent = w;
        grammar.appendChild(span);
      } else {
        grammar.appendChild(document.createTextNode(w));
      }
      wordIdx++;
    }
  }
}

function updateUI(val) {
  // ponytail: suggestion span lives INSIDE the hidden ghost layer as a real inline
  // element. The layer has `color:transparent` (drives autosize); the span overrides
  // with a color. Result: suggestion flows inline with val, wraps the
  // same way, occupies the natural horizontal slot the textarea caret is in.
  ghost.textContent = val;
  if (currentSuggestion) {
    const span = document.createElement('span');
    span.className = 'suggestion';
    span.textContent = currentSuggestion;
    ghost.appendChild(span);
  }
  ghost.appendChild(document.createTextNode("​")); // zero-width space ensures trailing newline counted
  
  wrap.classList.toggle('active', !!currentSuggestion);
  // Meta line: char count + line count
  const chars = val.length;
  const lines = val ? val.split('\n').length : 0;
  meta.textContent = chars ? `${chars} chars • ${lines} line${lines !== 1 ? 's' : ''}` : '';
}

input.addEventListener('input', render);

// ponytail: Tab accepts the current word AND immediately refetches the next
// predicted word using the just-updated context. Repeatedly tapping Tab walks the
// engine through the predicted sentence — each press reveals one more word of the
// most likely continuation. Stops when the engine returns no suggestion.
async function acceptAndContinue(){
  if (!currentSuggestion) return;
  const word = currentSuggestion;
  const span = ghost.querySelector('.suggestion');
  if (span) span.classList.add('flash');
  await new Promise(r => setTimeout(r, 140));
  // Commit the word, then immediately ask the engine what's likely to come next.
  // currentSuggestion is reset to "" so render() doesn't fire a debounced fetch —
  // we want the next prediction NOW, with the just-updated context.
  input.value = input.value + word + " ";
  currentSuggestion = "";
  updateUI(input.value);
  autosize(input.value);
  // Synchronous fetch (no debounce) — the user is actively typing intent here.
  const next = await fetchPrediction(input.value);
  if (next) {
    currentSuggestion = next;
    updateUI(input.value);
    autosize(input.value);
  } else {
    updateUI(input.value);
    autosize(input.value);
  }
  input.focus();
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    if (currentSuggestion) {
      const val = input.value;
      const lastSpaceIdx = val.lastIndexOf(" ");
      if (!val.endsWith(" ") && lastSpaceIdx !== -1) {
         input.value = val.substring(0, lastSpaceIdx + 1) + currentSuggestion + " ";
      } else {
         input.value = val + currentSuggestion + " ";
      }
      currentSuggestion = "";
      render();
    }
    return;
  }
  if (e.key === 'Escape'){
    if (!teachPop.hidden) { closeTeach(); return; }
    if (!rewritePanel.hidden) { closeRewritePanel(); return; }
    input.value = "";
    render();
  }
});

// ResizeObserver: re-autosize on window resize (viewport changes the bar's available width).
new ResizeObserver(() => autosize(input.value)).observe(wrap);

// ── Teach (Phase 1.5) ──────────────────────────────────────────────
const teachBtn  = document.getElementById('teachBtn');
const teachPop  = document.getElementById('teachPop');
const teachInput= document.getElementById('teachInput');
const teachList = document.getElementById('teachList');
const teachToast= document.getElementById('teachToast');
const teachSingleBtn = document.getElementById('teachSingleBtn');
const teachListToggle= document.getElementById('teachListToggle');
const teachListBtn   = document.getElementById('teachListBtn');

function openTeach() {
  teachPop.hidden = false;
  teachInput.focus();
}
function closeTeach() {
  teachPop.hidden = true;
  teachList.hidden = true;
  teachListBtn.hidden = true;
  teachListToggle.hidden = false;
  input.focus();
}

teachBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (teachPop.hidden) openTeach(); else closeTeach();
});

document.addEventListener('click', (e) => {
  if (!teachPop.hidden && !teachPop.contains(e.target) && e.target !== teachBtn) {
    closeTeach();
  }
});

teachInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); teachSingleBtn.click(); }
});

teachListToggle.addEventListener('click', () => {
  teachList.hidden = false;
  teachListBtn.hidden = false;
  teachListToggle.hidden = true;
  teachList.focus();
});

async function postTeach(phrases) {
  try {
    const r = await fetch("http://127.0.0.1:4000/teach", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({phrases}),
    });
    return await r.json();
  } catch (e) { return null; }
}

let toastTimer;
function showToast(msg) {
  teachToast.textContent = msg;
  teachToast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { teachToast.hidden = true; }, 1400);
}

teachSingleBtn.addEventListener('click', async () => {
  const phrase = teachInput.value.trim();
  if (!phrase) return;
  const res = await postTeach([phrase]);
  if (res) showToast(`Taught "${phrase}" ✓`);
  teachInput.value = "";
  teachInput.focus();
});

teachListBtn.addEventListener('click', async () => {
  const lines = teachList.value.split("\n").map(s => s.trim()).filter(Boolean);
  if (!lines.length) return;
  const res = await postTeach(lines);
  if (res) showToast(`Taught ${res.taught || lines.length} ✓`);
  teachList.value = "";
  closeTeach();
});

// ── Tone rewrite (Phase 2 — LLM integration) ──────────────────────
const TONES = ["formal", "friendly", "informal"];
const toneBtn    = document.getElementById('toneBtn');
const rewritePanel= document.getElementById('rewritePanel');
const rewriteTone = document.getElementById('rewriteTone');
const rewriteOutput = document.getElementById('rewriteOutput');
const rewriteReplace= document.getElementById('rewriteReplace');
const rewriteCycle = document.getElementById('rewriteCycle');
const rewriteClose = document.getElementById('rewriteClose');

let currentTone = "friendly";
let pendingRewrite = "";   // last successful rewrite, what Replace actually swaps in

function setTone(t){
  currentTone = t;
  toneBtn.dataset.tone = t;
  rewriteTone.textContent = t;
}

async function doRewrite(){
  const text = input.value.trim();
  if (!text){
    rewriteOutput.textContent = "Type a sentence first.";
    rewriteOutput.classList.add('placeholder');
    rewriteReplace.disabled = true;
    return;
  }
  rewriteOutput.classList.remove('placeholder');
  rewriteOutput.textContent = `…${currentTone}…`;
  rewriteReplace.disabled = true;
  pendingRewrite = "";
  try {
    const r = await fetch("http://127.0.0.1:4000/rewrite", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text, tone: currentTone}),
    });
    const {rewritten, source} = await r.json();
    if (!rewritten){
      rewriteOutput.textContent = "Ollama couldn't rewrite this — try again or check that Ollama is running.";
      rewriteOutput.classList.add('placeholder');
      return;
    }
    pendingRewrite = rewritten;
    rewriteOutput.textContent = rewritten;
    rewriteOutput.classList.remove('placeholder');
    rewriteReplace.disabled = false;
    rewriteOutput.title = `rewritten by ${source}`;
  } catch (e) {
    rewriteOutput.textContent = `Network error: ${e.message}`;
    rewriteOutput.classList.add('placeholder');
  }
}

function openRewritePanel(){
  rewritePanel.hidden = false;
  doRewrite();
}
function closeRewritePanel(){
  rewritePanel.hidden = true;
  pendingRewrite = "";
}

toneBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  // ponytail: button recolors per current tone (visual cue). Click cycles to next.
  if (rewritePanel.hidden){
    openRewritePanel();
  } else {
    const idx = TONES.indexOf(currentTone);
    setTone(TONES[(idx + 1) % TONES.length]);
    doRewrite();
  }
});

rewriteCycle.addEventListener('click', () => {
  const idx = TONES.indexOf(currentTone);
  setTone(TONES[(idx + 1) % TONES.length]);
  doRewrite();
});

rewriteClose.addEventListener('click', closeRewritePanel);

rewriteReplace.addEventListener('click', () => {
  if (!pendingRewrite) return;
  input.value = pendingRewrite;
  currentSuggestion = "";     // old ghost no longer relevant
  updateUI(input.value);
  autosize(input.value);
  input.focus();
  closeRewritePanel();
  showToast(`Replaced with ${currentTone} version ✓`);
});

document.addEventListener('click', (e) => {
  if (!rewritePanel.hidden && !rewritePanel.contains(e.target) && e.target !== toneBtn){
    closeRewritePanel();
  }
});

render();
input.focus();
