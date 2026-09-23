/**
 * Small, dependency-free fuzzy search helpers shared by the panel command
 * palette and any inline list search inputs.
 *
 * The scoring is intentionally simple and deterministic so results stay
 * predictable: exact substring matches rank highest, followed by ordered
 * subsequence ("fuzzy") matches.
 */

/** A value that can be matched against a query — either a plain string or a
 *  bag of searchable fields. */
export type Matchable =
    | string
    | {
          label?: string;
          hint?: string;
          keywords?: string[];
          category?: string;
      };

/** Lowercase + strip diacritics so accented characters match their base form. */
export const normalize = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

/** Collect every searchable fragment from a {@link Matchable}. */
const collectHaystacks = (item: Matchable): string[] => {
    if (typeof item === 'string') return [item];
    const parts: string[] = [];
    if (item.label) parts.push(item.label);
    if (item.hint) parts.push(item.hint);
    if (item.category) parts.push(item.category);
    if (item.keywords) parts.push(...item.keywords);
    return parts;
};

/**
 * Score how well `query` matches `item`.
 *
 * @returns a non-negative number — `0` means "no match", higher is better.
 *          An empty query returns a small non-zero score so every item is
 *          considered a (tie) match.
 */
export const scoreMatch = (item: Matchable, query: string): number => {
    const q = normalize(query);
    if (!q) return 1;

    const haystacks = collectHaystacks(item).map(normalize);
    let best = 0;

    for (const hay of haystacks) {
        if (!hay) continue;

        // Exact substring — best signal.
        const index = hay.indexOf(q);
        if (index !== -1) {
            // Whole-string match beats a mid-string match; word-start adds a bonus.
            const wholeBonus = hay === q ? 100 : 0;
            const startBonus = index === 0 ? 30 : hay[index - 1] === ' ' ? 15 : 0;
            const lengthPenalty = Math.min(hay.length, 60);
            best = Math.max(best, 100 + wholeBonus + startBonus - lengthPenalty + q.length);
            continue;
        }

        // Ordered subsequence (fuzzy) match.
        let hayIndex = 0;
        let consecutive = 0;
        let fuzzyScore = 0;
        let matched = true;
        for (const char of q) {
            const found = hay.indexOf(char, hayIndex);
            if (found === -1) {
                matched = false;
                break;
            }
            consecutive = found === hayIndex ? consecutive + 1 : 0;
            fuzzyScore += 1 + consecutive;
            hayIndex = found + 1;
        }
        if (matched) {
            best = Math.max(best, fuzzyScore);
        }
    }

    return best;
};

/**
 * Split `text` into segments for highlighting the parts that match `query`.
 *
 * Returns an array of `{ text, match }` segments in original order, so callers
 * can render matched spans differently without losing the source casing.
 */
export const splitHighlight = (
    text: string,
    query: string
): Array<{ text: string; match: boolean }> => {
    const q = normalize(query);
    if (!text) return [{ text: '', match: false }];
    if (!q) return [{ text, match: false }];

    // Prefer a direct (case/diacritic-insensitive) substring highlight.
    const hay = normalize(text);
    const directStart = hay.indexOf(q);
    if (directStart !== -1) {
        const end = directStart + q.length;
        const segments: Array<{ text: string; match: boolean }> = [];
        if (directStart > 0) segments.push({ text: text.slice(0, directStart), match: false });
        segments.push({ text: text.slice(directStart, end), match: true });
        if (end < text.length) segments.push({ text: text.slice(end), match: false });
        return segments;
    }

    // Fall back to highlighting matched characters of a fuzzy (subsequence) hit.
    const segments: Array<{ text: string; match: boolean }> = [];
    let hayIndex = 0;
    for (const char of text) {
        const charNorm = normalize(char);
        let isMatch = false;
        if (hayIndex < q.length && charNorm === q[hayIndex]) {
            isMatch = true;
            hayIndex += 1;
        }
        const prev = segments[segments.length - 1];
        if (prev && prev.match === isMatch) {
            prev.text += char;
        } else {
            segments.push({ text: char, match: isMatch });
        }
    }

    // Nothing matched as a subsequence — return the whole string unmatched.
    if (!segments.some((s) => s.match)) return [{ text, match: false }];
    return segments;
};
