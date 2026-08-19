from collections import defaultdict, Counter
from typing import List, Tuple
import pickle
import re

# ponytail: same normalizer as train.py so teach() and fit() agree on token shape.
_PUNCT_RE = re.compile(r"[^a-z0-9' ]+")

def _normalize(line: str) -> str:
    line = line.lower().strip()
    cleaned = _PUNCT_RE.sub(" ", line)
    return " ".join(cleaned.split())

class NgramEngine:
    SENTINELS = ("<s>", "</s>")

    def __init__(self):
        self.unigrams: Counter = Counter()        # word -> count
        self.bigrams:  dict[Tuple[str], Counter] = defaultdict(Counter)  # (w,) -> {next: count}
        self.trigrams: dict[Tuple[str, str], Counter] = defaultdict(Counter)  # (w1,w2) -> {next: count}
        # Personal tables (populated via teach()).
        self.p_unigrams: Counter = Counter()
        self.p_bigrams:  dict[Tuple[str], Counter] = defaultdict(Counter)
        self.p_trigrams: dict[Tuple[str, str], Counter] = defaultdict(Counter)
        # Blend weight: 0 = pure base, 1 = pure personal. Default 0.3 (per PLAN §2.5).
        self.personal_weight: float = 0.3

    def fit(self, lines: List[str]):
        for line in lines:
            tokens = ["<s>"] + line.split() + ["</s>"]
            for t in tokens: self.unigrams[t] += 1
            for a, b in zip(tokens, tokens[1:]):
                self.bigrams[(a,)][b] += 1
            for a, b, c in zip(tokens, tokens[1:], tokens[2:]):
                self.trigrams[(a, b)][c] += 1

    # ponytail: O(1) per phrase, in-memory only. Persistence is app.py's job via personal.txt.
    def teach(self, phrase: str) -> int:
        """Fold a user-supplied phrase into the personal tables. Returns token count taught."""
        cleaned = _normalize(phrase)
        if not cleaned: return 0
        toks = ["<s>"] + cleaned.split() + ["</s>"]
        for t in toks: self.p_unigrams[t] += 1
        for a, b in zip(toks, toks[1:]):
            self.p_bigrams[(a,)][b] += 1
        for a, b, c in zip(toks, toks[1:], toks[2:]):
            self.p_trigrams[(a, b)][c] += 1
        return len(toks) - 2  # don't count sentinels

    # ponytail: _clean() filters sentinels + dedupes — single source of truth.
    def _clean(self, words, k):
        seen, out = set(), []
        for w in words:
            if w in self.SENTINELS or w in seen: continue
            seen.add(w); out.append(w)
            if len(out) >= k: break
        return out

    def _candidates(self, toks, k):
        """Top-k candidates from a (trigram, bigram, unigram) table triple."""
        if len(toks) >= 3:
            cands = self.trigrams.get((toks[-2], toks[-1]))
            if cands:
                return self._clean([w for w, _ in cands.most_common(k * 3)], k * 2)
        if len(toks) >= 2:
            cands = self.bigrams.get((toks[-1],))
            if cands:
                return self._clean([w for w, _ in cands.most_common(k * 3)], k * 2)
        return self._clean([w for w, _ in self.unigrams.most_common(k * 4)], k * 2)

    def _p_candidates(self, toks, k):
        if not self.p_unigrams: return []
        if len(toks) >= 3:
            cands = self.p_trigrams.get((toks[-2], toks[-1]))
            if cands:
                return self._clean([w for w, _ in cands.most_common(k * 3)], k * 2)
        if len(toks) >= 2:
            cands = self.p_bigrams.get((toks[-1],))
            if cands:
                return self._clean([w for w, _ in cands.most_common(k * 3)], k * 2)
        return self._clean([w for w, _ in self.p_unigrams.most_common(k * 4)], k * 2)

    def predict(self, text: str, k: int = 3) -> List[str]:
        toks = ["<s>"] + text.lower().split()
        # ponytail: if personal has a DIRECT context match (trigram or bigram), trust it.
        # User explicitly taught this continuation — surface it first, fill the rest with base.
        if len(toks) >= 3 and (toks[-2], toks[-1]) in self.p_trigrams:
            p = self._clean([w for w, _ in self.p_trigrams[(toks[-2], toks[-1])].most_common(k * 2)], k)
            if p:
                b = self._candidates(toks, k)
                return (p + [w for w in b if w not in p])[:k]
        if len(toks) >= 2 and (toks[-1],) in self.p_bigrams:
            p = self._clean([w for w, _ in self.p_bigrams[(toks[-1],)].most_common(k * 2)], k)
            if p:
                b = self._candidates(toks, k)
                return (p + [w for w in b if w not in p])[:k]

        base = self._candidates(toks, k)
        personal = self._p_candidates(toks, k)
        if not personal:
            return base[:k]
        # ponytail: fallback blend (no direct match) — taught unigrams still surface above base.
        score: Counter = Counter()
        for i, w in enumerate(base):
            score[w] += (k * 2 - i) * (1 - self.personal_weight)
        for i, w in enumerate(personal):
            score[w] += (k * 4 - i) * self.personal_weight  # boost taught unigrams
        return self._clean([w for w, _ in score.most_common(k * 3)], k)

    def save(self, path: str): pickle.dump(self, open(path, "wb"))
    @classmethod
    def load(cls, path: str) -> "NgramEngine":
        # ponytail: legacy pickles (pre-Phase-1.5) lack personal-table attributes.
        # __setstate__ runs during unpickle; backfill missing attributes there
        # so any entry point (app.py, CLI, tests) Just Works without ceremony.
        return pickle.load(open(path, "rb"))

    def __setstate__(self, state):
        # Restore the unpickled dict, then backfill anything missing.
        self.__dict__.update(state)
        from collections import Counter, defaultdict
        if "p_unigrams" not in self.__dict__ or self.p_unigrams is None:
            self.p_unigrams = Counter()
        if "p_bigrams" not in self.__dict__ or self.p_bigrams is None:
            self.p_bigrams = defaultdict(Counter)
        if "p_trigrams" not in self.__dict__ or self.p_trigrams is None:
            self.p_trigrams = defaultdict(Counter)
        if "personal_weight" not in self.__dict__:
            self.personal_weight = 0.3
