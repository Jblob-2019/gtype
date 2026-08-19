const input = document.getElementById('typeInput');
const ghost = document.getElementById('ghostLayer');
const wrap = document.getElementById('barWrap');
const meta = document.getElementById('meta');
let currentSuggestion = "";

async function fetchPrediction(text) {
  if (!text.trim()) return "";
  try {
    const r = await fetch("http://localhost:4000/predict", {
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

let debounceTimer;

// ponytail: dynamic-sizing engine.
// - Measure the *next* height by stuffing val into the ghost layer (which has identical font/wrap).
// - Reset textarea height so scrollHeight reflects content, not previous size.
// - Grow bar height up to max (CSS cap = min(50vh, 320px)); let textarea scroll within past that.
function autosize(val) {
  // Mirror the val into the ghost layer so it occupies the natural width/height the
  // textarea would, with the SAME font + wrap. The ghost layer is `visibility: hidden`
  // but still takes layout space — perfect for measurement.
  ghost.textContent = val + (currentSuggestion ? currentSuggestion : "") + "​"; // zero-width ensures trailing newline counted
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

async function render(){
  const val = input.value;
  const trailingSpace = val.endsWith(" ") || val === "";

  if (trailingSpace) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      currentSuggestion = await fetchPrediction(val);
      updateUI(val);
      autosize(val);
    }, 150);
  } else {
    currentSuggestion = "";
    updateUI(val);
    autosize(val);
  }
}

function updateUI(val) {
  // ponytail: suggestion span lives INSIDE the hidden ghost layer as a real inline
  // element. The layer has `visibility:hidden` (drives autosize); the span overrides
  // with `visibility:visible`. Result: suggestion flows inline with val, wraps the
  // same way, occupies the natural horizontal slot the textarea caret is in.
  ghost.textContent = val;
  if (currentSuggestion) {
    const span = document.createElement('span');
    span.className = 'suggestion';
    span.textContent = currentSuggestion;
    ghost.appendChild(span);
  }
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
  if (e.key === 'Tab' && currentSuggestion){
    e.preventDefault();
    acceptAndContinue();
  }
  if (e.key === 'Escape'){
    if (!teachPop.hidden) { closeTeach(); return; }
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
    const r = await fetch("http://localhost:4000/teach", {
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

render();
input.focus();
