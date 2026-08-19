import argparse, pickle, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from engine import NgramEngine

def normalize(line: str) -> str:
    line = line.lower().strip()
    # Strip all punctuation except apostrophes inside words
    cleaned = "".join(c for c in line if c.isalpha() or c == "'" or c.isspace() or c.isdigit())
    return " ".join(cleaned.split())

def load_corpus(path: Path, encoding: str = "utf-8") -> list[str]:
    """Read + normalize a one-phrase-per-line corpus. Skips blanks and `#` comments."""
    raw = path.read_text(encoding=encoding, errors="ignore").splitlines()
    return [normalize(l) for l in raw
            if l.strip() and not l.strip().startswith("#") and len(l.split()) >= 2]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cornell",   default="../data/cornell/movie_lines.txt",
                    help="Cornell movie_lines.txt (encoding iso-8859-1)")
    ap.add_argument("--starter",   default="../data/starter_corpus.txt",
                    help="Hand-curated starter corpus (utf-8)")
    ap.add_argument("--defaults",  default="../data/default_phrases.txt",
                    help="Default phrases shipped in repo (utf-8)")
    ap.add_argument("--out", dest="outp", default="data/model.pkl")
    args = ap.parse_args()

    Path(args.outp).parent.mkdir(parents=True, exist_ok=True)

    # ponytail: default phrases + starter are duplicated during training so they
    # outweigh the noisy Cornell tail and dominate common-phrase predictions.
    STARTER_BOOST = 50
    DEFAULT_BOOST = 50

    lines = []
    if Path(args.defaults).exists():
        defaults = load_corpus(Path(args.defaults))
        lines.extend(defaults * DEFAULT_BOOST)
        print(f"defaults×{DEFAULT_BOOST}: {len(defaults)*DEFAULT_BOOST}")
    else:
        print(f"warn: {args.defaults} not found — skipping")

    if Path(args.starter).exists():
        starter = load_corpus(Path(args.starter))
        lines.extend(starter * STARTER_BOOST)
        print(f"starter×{STARTER_BOOST}: {len(starter)*STARTER_BOOST}")
    else:
        print(f"warn: {args.starter} not found — skipping")

    if Path(args.cornell).exists():
        cornell = [l for l in load_corpus(Path(args.cornell), encoding="iso-8859-1") if len(l.split()) >= 3]
        lines.extend(cornell)
        print(f"cornell: {len(cornell)}")
    else:
        print(f"warn: {args.cornell} not found — training with defaults+starter only")

    lines = list({l for l in lines if l})  # dedupe exact lines, drop empties
    print(f"total unique phrases: {len(lines)}")

    eng = NgramEngine()
    eng.fit(lines)
    eng.save(args.outp)
    print(f"Saved model -> {args.outp}")

if __name__ == "__main__": main()
