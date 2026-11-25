import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Cloud,
  CloudOff,
  Eye,
  EyeOff,
  Grid,
  HelpCircle,
  Home,
  Languages,
  Loader2,
  Pencil,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import {
  MUTHOLAAH_LEVEL_1_ITEMS,
  MUTHOLAAH_SEASONS,
  MutholaahItem
} from './data/mutolaahLevel1';
import { getActiveStudentSession } from './utils/studentAccountStore';

const STORAGE_COMPLETED_KEY = 'tl_mutolaah_lv1_completed_v1';
const STORAGE_MEANINGS_KEY = 'tl_mutolaah_lv1_meanings_v1';
const STORAGE_STATE_KEY = 'tl_mutolaah_lv1_state_v1';
const MUTHOLAAH_API_URL = './api.php?entity=mutolaah_progress';

type WordMeaningsMap = Record<string, Record<string, string>>;
type WordClickMode = 'meaning' | 'harakat';

function resolveProgressOwnerKey(): string {
  const session = getActiveStudentSession();
  const identifier = session?.email?.trim() || session?.registrationNumber?.trim();
  if (identifier) {
    return `student:${identifier.toLowerCase()}`;
  }
  return 'global';
}

type ArabicFontSize = 'md' | 'lg' | 'xl';
type HarakatLevel = 100 | 50 | 0;
type WordHarakatState = 'full' | 'partial' | 'none';

const ARABIC_SIZE_CLASSES: Record<ArabicFontSize, string> = {
  md: 'text-2xl sm:text-[1.75rem]',
  lg: 'text-3xl sm:text-[2.1rem]',
  xl: 'text-3xl sm:text-[2.5rem]'
};

/**
 * Menghapus tanda baca/harakat Arab (fathah, kasrah, dhammah, sukun, syaddah, tanwin, dll.)
 * agar siswa dapat berlatih membaca teks Arab gundul.
 */
function stripArabicHarakat(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * Menghapus sebagian harokat di dalam satu kata (misal tersisa 1-2 harokat per kata),
 * dengan mengelompokkan tanda baca pada satu huruf agar tidak terpecah janggal.
 */
function stripPartialWordHarakat(word: string, rng: () => number): string {
  const clusterRegex = /[\u064B-\u065F\u0670]+/g;
  const matches: Array<{ index: number; text: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = clusterRegex.exec(word)) !== null) {
    matches.push({ index: m.index, text: m[0] });
  }
  if (matches.length === 0) return word;
  if (matches.length === 1) {
    // Kata dengan 1 harokat: kadang tampil kadang hilang sesuai acakan
    return rng() < 0.5 ? word : stripArabicHarakat(word);
  }

  const keepCount = Math.max(1, Math.floor(matches.length / 2));
  const indices = matches.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const keepSet = new Set(indices.slice(0, keepCount));

  let result = '';
  let cursor = 0;
  matches.forEach((match, i) => {
    result += word.slice(cursor, match.index);
    if (keepSet.has(i)) {
      result += match.text;
    }
    cursor = match.index + match.text.length;
  });
  result += word.slice(cursor);
  return result;
}
function seededRandom(seedStr: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function MutholaahApp() {
  const [activeSeason, setActiveSeason] = useState<1 | 2>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.season === 1 || parsed.season === 2) return parsed.season;
      }
    } catch {
      // ignore storage errors
    }
    return 1;
  });

  const [seasonIndices, setSeasonIndices] = useState<Record<1 | 2, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          1: typeof parsed.idx1 === 'number' ? parsed.idx1 : 0,
          2: typeof parsed.idx2 === 'number' ? parsed.idx2 : 0
        };
      }
    } catch {
      // ignore storage errors
    }
    return { 1: 0, 2: 0 };
  });

  const progressOwnerKey = useMemo(() => resolveProgressOwnerKey(), []);
  const ownerStorageKey = `${STORAGE_COMPLETED_KEY}:${progressOwnerKey}`;
  const ownerMeaningsStorageKey = `${STORAGE_MEANINGS_KEY}:${progressOwnerKey}`;

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved =
        localStorage.getItem(ownerStorageKey) ??
        (progressOwnerKey === 'global'
          ? localStorage.getItem(STORAGE_COMPLETED_KEY)
          : null);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const [wordMeanings, setWordMeanings] = useState<WordMeaningsMap>(() => {
    try {
      const saved = localStorage.getItem(ownerMeaningsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return {};
  });

  const [dbSyncStatus, setDbSyncStatus] = useState<
    'idle' | 'loading' | 'saving' | 'saved' | 'error'
  >('loading');
  const completedIdsRef = useRef<string[]>(completedIds);
  completedIdsRef.current = completedIds;
  const wordMeaningsRef = useRef<WordMeaningsMap>(wordMeanings);
  wordMeaningsRef.current = wordMeanings;

  const [harakatLevel, setHarakatLevel] = useState<HarakatLevel>(100);
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [wordHarakatOverrides, setWordHarakatOverrides] = useState<
    Record<number, WordHarakatState>
  >({});
  const [wordClickMode, setWordClickMode] = useState<WordClickMode>('meaning');
  const [showWordMeanings, setShowWordMeanings] = useState<boolean>(true);
  const [editingWord, setEditingWord] = useState<{
    tokenIndex: number;
    arabicWord: string;
  } | null>(null);
  const [meaningDraft, setMeaningDraft] = useState<string>('');
  const meaningInputRef = useRef<HTMLInputElement | null>(null);
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const [showNumberGrid, setShowNumberGrid] = useState<boolean>(false);
  const [showTasks, setShowTasks] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<ArabicFontSize>('lg');

  const seasonItems = useMemo(
    () => MUTHOLAAH_LEVEL_1_ITEMS.filter((item) => item.season === activeSeason),
    [activeSeason]
  );

  const currentIndex = Math.min(
    Math.max(0, seasonIndices[activeSeason] ?? 0),
    Math.max(0, seasonItems.length - 1)
  );

  const currentItem: MutholaahItem | undefined = seasonItems[currentIndex];
  const seasonMeta = MUTHOLAAH_SEASONS.find((s) => s.season === activeSeason)!;

  useEffect(() => {
    try {
      localStorage.setItem(ownerStorageKey, JSON.stringify(completedIds));
      if (progressOwnerKey === 'global') {
        localStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(completedIds));
      }
    } catch {
      // ignore storage errors
    }
  }, [completedIds, ownerStorageKey, progressOwnerKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        ownerMeaningsStorageKey,
        JSON.stringify(wordMeanings)
      );
    } catch {
      // ignore storage errors
    }
  }, [wordMeanings, ownerMeaningsStorageKey]);

  const syncProgressToDatabase = useCallback(
    async (nextIds: string[], nextMeanings: WordMeaningsMap) => {
      setDbSyncStatus('saving');
      try {
        const res = await fetch(MUTHOLAAH_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [progressOwnerKey]: {
              completedIds: nextIds,
              wordMeanings: nextMeanings,
              updatedAt: new Date().toISOString()
            }
          })
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (json?.status !== 'ok') {
          throw new Error(json?.message || 'Gagal menyimpan ke database');
        }
        setDbSyncStatus('saved');
      } catch {
        setDbSyncStatus('error');
      }
    },
    [progressOwnerKey]
  );

  // Load saved completion progress & word meanings from database on mount
  useEffect(() => {
    let cancelled = false;
    async function loadFromDatabase() {
      setDbSyncStatus('loading');
      try {
        const res = await fetch(`${MUTHOLAAH_API_URL}&_t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const remoteEntry = data && typeof data === 'object' ? data[progressOwnerKey] : null;
        if (remoteEntry && typeof remoteEntry === 'object') {
          if (Array.isArray(remoteEntry.completedIds)) {
            setCompletedIds(remoteEntry.completedIds);
          }
          if (
            remoteEntry.wordMeanings &&
            typeof remoteEntry.wordMeanings === 'object' &&
            !Array.isArray(remoteEntry.wordMeanings)
          ) {
            setWordMeanings(remoteEntry.wordMeanings);
          }
          setDbSyncStatus('saved');
        } else if (
          completedIdsRef.current.length > 0 ||
          Object.keys(wordMeaningsRef.current).length > 0
        ) {
          await syncProgressToDatabase(
            completedIdsRef.current,
            wordMeaningsRef.current
          );
        } else {
          setDbSyncStatus('saved');
        }
      } catch {
        if (!cancelled) {
          setDbSyncStatus('error');
        }
      }
    }
    loadFromDatabase();
    return () => {
      cancelled = true;
    };
  }, [progressOwnerKey, syncProgressToDatabase]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_STATE_KEY,
        JSON.stringify({
          season: activeSeason,
          idx1: seasonIndices[1],
          idx2: seasonIndices[2]
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [activeSeason, seasonIndices]);

  // Reset translation visibility, per-word overrides & word editor when switching number
  useEffect(() => {
    setShowTranslation(false);
    setWordHarakatOverrides({});
    setEditingWord(null);
    setMeaningDraft('');
  }, [activeSeason, currentIndex]);

  useEffect(() => {
    if (editingWord) {
      setTimeout(() => {
        meaningInputRef.current?.focus();
      }, 20);
    }
  }, [editingWord]);

  // Keyboard navigation (Left / Right arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        goToIndex(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        goToIndex(currentIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const goToIndex = (index: number) => {
    if (index < 0 || index >= seasonItems.length) return;
    setSeasonIndices((prev) => ({
      ...prev,
      [activeSeason]: index
    }));
  };

  const updateCompletedIds = (updater: (prev: string[]) => string[]) => {
    const nextIds = updater(completedIdsRef.current);
    setCompletedIds(nextIds);
    void syncProgressToDatabase(nextIds, wordMeaningsRef.current);
  };

  const updateWordMeanings = (
    updater: (prev: WordMeaningsMap) => WordMeaningsMap
  ) => {
    const nextMeanings = updater(wordMeaningsRef.current);
    setWordMeanings(nextMeanings);
    void syncProgressToDatabase(completedIdsRef.current, nextMeanings);
  };

  const toggleCompleted = (id: string) => {
    updateCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const seasonCompletedCount = seasonItems.filter((item) =>
    completedIds.includes(item.id)
  ).length;

  const totalCompletedCount = completedIds.length;
  const totalItemsCount = MUTHOLAAH_LEVEL_1_ITEMS.length;
  const overallProgressPercent = Math.round(
    (totalCompletedCount / totalItemsCount) * 100
  );

  const isCurrentCompleted = currentItem
    ? completedIds.includes(currentItem.id)
    : false;

  const arabicTokens = useMemo(
    () => (currentItem ? currentItem.arabic.split(/(\s+)/) : []),
    [currentItem]
  );

  const partialWordVariants = useMemo(() => {
    const map = new Map<number, string>();
    if (!currentItem) return map;
    arabicTokens.forEach((tok, idx) => {
      if (tok && !/^\s+$/.test(tok) && /[\u0600-\u06FF]/.test(tok)) {
        const rng = seededRandom(`${currentItem.id}:${idx}:${shuffleSeed}`);
        map.set(idx, stripPartialWordHarakat(tok, rng));
      }
    });
    return map;
  }, [arabicTokens, currentItem, shuffleSeed]);

  const baseWordState: WordHarakatState =
    harakatLevel === 100 ? 'full' : harakatLevel === 50 ? 'partial' : 'none';

  const handleSelectHarakatLevel = (level: HarakatLevel) => {
    setHarakatLevel(level);
    setWordHarakatOverrides({});
  };

  const toggleWordHarakat = (tokenIndex: number) => {
    const currentState = wordHarakatOverrides[tokenIndex] ?? baseWordState;
    const nextState: WordHarakatState =
      currentState === 'full' ? 'none' : 'full';
    setWordHarakatOverrides((prev) => ({
      ...prev,
      [tokenIndex]: nextState
    }));
  };

  const hasWordOverrides = Object.keys(wordHarakatOverrides).length > 0;

  const currentItemMeanings = useMemo(
    () => (currentItem ? wordMeanings[currentItem.id] ?? {} : {}),
    [currentItem, wordMeanings]
  );

  const openWordMeaningEditor = (tokenIndex: number, arabicWord: string) => {
    const existing = currentItemMeanings[String(tokenIndex)] ?? '';
    setEditingWord({ tokenIndex, arabicWord });
    setMeaningDraft(existing);
  };

  const handleArabicWordClick = (tokenIndex: number, arabicWord: string) => {
    if (wordClickMode === 'harakat') {
      toggleWordHarakat(tokenIndex);
      return;
    }
    openWordMeaningEditor(tokenIndex, arabicWord);
  };

  const handleSaveWordMeaning = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentItem || !editingWord) return;
    const trimmed = meaningDraft.trim();
    const itemId = currentItem.id;
    const tokenKey = String(editingWord.tokenIndex);

    updateWordMeanings((prev) => {
      const nextItemMap = { ...(prev[itemId] ?? {}) };
      if (trimmed) {
        nextItemMap[tokenKey] = trimmed;
      } else {
        delete nextItemMap[tokenKey];
      }
      const nextAll = { ...prev };
      if (Object.keys(nextItemMap).length > 0) {
        nextAll[itemId] = nextItemMap;
      } else {
        delete nextAll[itemId];
      }
      return nextAll;
    });
    setEditingWord(null);
    setMeaningDraft('');
  };

  const handleDeleteWordMeaning = (tokenIndex: number) => {
    if (!currentItem) return;
    const itemId = currentItem.id;
    const tokenKey = String(tokenIndex);
    updateWordMeanings((prev) => {
      const nextItemMap = { ...(prev[itemId] ?? {}) };
      delete nextItemMap[tokenKey];
      const nextAll = { ...prev };
      if (Object.keys(nextItemMap).length > 0) {
        nextAll[itemId] = nextItemMap;
      } else {
        delete nextAll[itemId];
      }
      return nextAll;
    });
    if (editingWord?.tokenIndex === tokenIndex) {
      setEditingWord(null);
      setMeaningDraft('');
    }
  };

  const currentMeaningEntries = useMemo(() => {
    return Object.entries(currentItemMeanings)
      .map(([k, meaning]) => ({
        tokenIndex: Number(k),
        arabicWord: arabicTokens[Number(k)] ?? '',
        meaning
      }))
      .filter((entry) => entry.arabicWord && entry.meaning)
      .sort((a, b) => a.tokenIndex - b.tokenIndex);
  }, [arabicTokens, currentItemMeanings]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href="./index.html"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Kembali ke Beranda"
            >
              <Home className="w-4 h-4" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3" />
                  Level 1
                </span>
                <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                  Tadribat Mukhtarat Durus al-Lughah
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Muthola'ah Bahasa Arab
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                dbSyncStatus === 'error'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : dbSyncStatus === 'saving' || dbSyncStatus === 'loading'
                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
              title={
                dbSyncStatus === 'error'
                  ? 'Gagal terhubung ke server, tersimpan sementara di browser'
                  : 'Progres tersinkronisasi dengan database server'
              }
            >
              {dbSyncStatus === 'loading' || dbSyncStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden md:inline">
                    {dbSyncStatus === 'loading' ? 'Memuat DB...' : 'Menyimpan...'}
                  </span>
                </>
              ) : dbSyncStatus === 'error' ? (
                <>
                  <CloudOff className="w-3 h-3" />
                  <span className="hidden md:inline">Lokal</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3 h-3" />
                  <span className="hidden md:inline">Tersimpan DB</span>
                </>
              )}
            </span>

            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-xs font-semibold text-slate-700">
                Progres: {totalCompletedCount}/{totalItemsCount} Teks
              </span>
              <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${overallProgressPercent}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTasks((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                showTasks
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Panduan Tugas
            </button>
          </div>
        </div>

        {/* Season Switcher Bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            {MUTHOLAAH_SEASONS.map((s) => {
              const isActive = activeSeason === s.season;
              const sItems = MUTHOLAAH_LEVEL_1_ITEMS.filter(
                (i) => i.season === s.season
              );
              const sDone = sItems.filter((i) =>
                completedIds.includes(i.id)
              ).length;
              return (
                <button
                  key={s.season}
                  type="button"
                  onClick={() => setActiveSeason(s.season)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{s.title}</span>
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {sDone}/{sItems.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              <strong className="text-slate-700">{seasonMeta.title}</strong> •{' '}
              {seasonMeta.pages} ({seasonCompletedCount}/{seasonItems.length}{' '}
              selesai)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Collapsible Panduan Tugas */}
        {showTasks && (
          <section className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-amber-950">
                  {seasonMeta.title} — {seasonMeta.subtitle} ({seasonMeta.pages})
                </h2>
                <p className="text-xs sm:text-sm text-amber-900/85 mt-1 leading-relaxed">
                  {seasonMeta.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTasks(false)}
                className="text-xs font-semibold text-amber-800 hover:text-amber-950 px-2 py-1 rounded-lg hover:bg-amber-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="pt-2 border-t border-amber-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
                Tugas Belajar:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-amber-950/90">
                {seasonMeta.tasks.map((task, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {task}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Per-Number Reader Card */}
        {currentItem && (
          <article className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Card Toolbar */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-xs">
                  Nomor {currentItem.numberLabel}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Urutan {currentIndex + 1} dari {seasonItems.length}
                </span>
                {currentItem.numberLabel.includes('*') && (
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md hidden sm:inline">
                    Penomoran buku berulang
                  </span>
                )}
              </div>

              {/* Action Controls: Harakat, Font Size, Mark Done */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Font Size */}
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
                  {(['md', 'lg', 'xl'] as ArabicFontSize[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontSize(sz)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        fontSize === sz
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={`Ukuran huruf ${sz.toUpperCase()}`}
                    >
                      {sz === 'md' ? 'A-' : sz === 'lg' ? 'A' : 'A+'}
                    </button>
                  ))}
                </div>

                {/* Tombol Penampil Harokat (100% / 50% / 0%) */}
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
                  <span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-slate-500">
                    {harakatLevel === 0 ? (
                      <EyeOff className="w-3.5 h-3.5 text-slate-700" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                    <span className="hidden sm:inline">Harokat:</span>
                  </span>
                  {([100, 50, 0] as HarakatLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleSelectHarakatLevel(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        harakatLevel === lvl
                          ? lvl === 100
                            ? 'bg-emerald-600 text-white'
                            : lvl === 50
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-white'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={
                        lvl === 100
                          ? 'Tampilkan semua harokat (100%)'
                          : lvl === 50
                          ? 'Hilangkan harokat setengah kata (50%)'
                          : 'Sembunyikan semua harokat / gundul (0%)'
                      }
                    >
                      {lvl}%
                    </button>
                  ))}
                  {harakatLevel === 50 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShuffleSeed((s) => s + 1);
                        setWordHarakatOverrides({});
                      }}
                      className="ml-0.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                      title="Acak ulang kata yang digundulkan"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span className="hidden md:inline">Acak</span>
                    </button>
                  )}
                </div>

                {/* Tombol Tandai Selesai */}
                <button
                  type="button"
                  onClick={() => toggleCompleted(currentItem.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isCurrentCompleted
                      ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isCurrentCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selesai
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5" />
                      Tandai Selesai
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="px-5 sm:px-7 pt-5 pb-2">
              <div className="px-4 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs sm:text-sm text-slate-700 font-medium">
                <span className="text-emerald-800 font-bold mr-1.5">
                  Petunjuk:
                </span>
                {currentItem.instruction}
              </div>
            </div>

            {/* Arabic Reading Area */}
            <div className="px-5 sm:px-8 py-6">
              {/* Mode Klik & Tampilan Arti Kata */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
                  <span className="px-2 text-[11px] font-semibold text-slate-500 hidden sm:inline">
                    Klik Kata:
                  </span>
                  <button
                    type="button"
                    onClick={() => setWordClickMode('meaning')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      wordClickMode === 'meaning'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Pencil className="w-3 h-3" />
                    Beri Arti
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWordClickMode('harakat');
                      setEditingWord(null);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      wordClickMode === 'harakat'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Ubah Harokat
                  </button>
                </div>

                {currentMeaningEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowWordMeanings((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      showWordMeanings
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {showWordMeanings ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    {showWordMeanings
                      ? `Arti Kata Tampil (${currentMeaningEntries.length})`
                      : `Arti Kata Disembunyikan (${currentMeaningEntries.length})`}
                  </button>
                )}
              </div>

              <div
                dir="rtl"
                lang="ar"
                className={`font-arabic ${ARABIC_SIZE_CLASSES[fontSize]} text-slate-900 bg-[#FCFBF7] border border-amber-200/60 rounded-2xl p-6 sm:p-8 whitespace-pre-line text-right shadow-inner leading-loose`}
              >
                {arabicTokens.map((tok, idx) => {
                  const isArabicWord =
                    tok && !/^\s+$/.test(tok) && /[\u0600-\u06FF]/.test(tok);
                  if (!isArabicWord) {
                    return <React.Fragment key={idx}>{tok}</React.Fragment>;
                  }
                  const wordState = wordHarakatOverrides[idx] ?? baseWordState;
                  const displayWord =
                    wordState === 'full'
                      ? tok
                      : wordState === 'partial'
                      ? partialWordVariants.get(idx) ?? tok
                      : stripArabicHarakat(tok);
                  const savedMeaning = currentItemMeanings[String(idx)];
                  const isEditingThis = editingWord?.tokenIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleArabicWordClick(idx, tok)}
                      title={
                        wordClickMode === 'meaning'
                          ? savedMeaning
                            ? `Arti: ${savedMeaning} (klik untuk edit)`
                            : 'Klik untuk memberi arti kata ini'
                          : wordState === 'full'
                          ? 'Klik untuk sembunyikan harokat kata ini'
                          : 'Klik untuk tampilkan semua harokat kata ini'
                      }
                      className={`inline-flex flex-col items-center align-top bg-transparent border-0 font-inherit text-inherit rounded-lg px-1 py-0.5 transition-colors cursor-pointer hover:bg-amber-200/45 ${
                        isEditingThis
                          ? 'ring-2 ring-emerald-500 bg-emerald-50/90'
                          : savedMeaning
                          ? 'bg-emerald-50/70 border-b-2 border-emerald-400/70'
                          : ''
                      } ${wordState === 'none' ? 'text-slate-800' : ''}`}
                    >
                      <span>{displayWord}</span>
                      {showWordMeanings && savedMeaning && (
                        <span
                          dir="ltr"
                          className="font-sans text-[11px] sm:text-xs font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-200/80 rounded-md px-1.5 py-0.5 mt-1 leading-tight max-w-[140px] truncate"
                        >
                          {savedMeaning}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Editor Arti Kata (muncul saat klik kata di mode Beri Arti) */}
              {editingWord && (
                <form
                  onSubmit={handleSaveWordMeaning}
                  className="mt-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        dir="rtl"
                        lang="ar"
                        className="font-arabic text-2xl text-slate-900 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs"
                      >
                        {editingWord.arabicWord}
                      </span>
                      <div className="text-xs text-slate-600">
                        <p className="font-bold text-emerald-950">
                          Beri Arti / Catatan Kata
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Tersimpan otomatis ke database &amp; browser
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleWordHarakat(editingWord.tokenIndex)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        title="Tampil/sembunyikan harokat khusus kata ini"
                      >
                        {(wordHarakatOverrides[editingWord.tokenIndex] ??
                          baseWordState) === 'full' ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Gundulkan Kata
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Tampilkan Harokat
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWord(null);
                          setMeaningDraft('');
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white cursor-pointer"
                        title="Tutup editor"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={meaningInputRef}
                      type="text"
                      value={meaningDraft}
                      onChange={(e) => setMeaningDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setEditingWord(null);
                          setMeaningDraft('');
                        }
                      }}
                      placeholder="Tulis arti kata ini (contoh: rumah, pergi, buku...)"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        Simpan Arti
                      </button>
                      {currentItemMeanings[String(editingWord.tokenIndex)] && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteWordMeaning(editingWord.tokenIndex)
                          }
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus arti kata ini"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {/* Daftar Kosakata / Arti Kata di Nomor Ini */}
              {currentMeaningEntries.length > 0 && (
                <div className="mt-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <BookMarked className="w-3.5 h-3.5 text-emerald-700" />
                      Catatan Arti Kata ({currentMeaningEntries.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Klik chip untuk edit arti
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentMeaningEntries.map((entry) => (
                      <button
                        key={entry.tokenIndex}
                        type="button"
                        onClick={() =>
                          openWordMeaningEditor(
                            entry.tokenIndex,
                            entry.arabicWord
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/60 text-xs transition-colors cursor-pointer"
                      >
                        <span
                          dir="rtl"
                          lang="ar"
                          className="font-arabic text-base text-slate-900"
                        >
                          {entry.arabicWord}
                        </span>
                        <span className="text-slate-400">=</span>
                        <span className="font-semibold text-emerald-800">
                          {entry.meaning}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span>
                  {wordClickMode === 'meaning'
                    ? 'Mode Beri Arti aktif — klik kata Arab mana saja untuk menulis atau mengedit artinya.'
                    : harakatLevel === 0
                    ? 'Mode gundul (0%) aktif — klik kata tertentu jika ingin melihat harokatnya.'
                    : harakatLevel === 50
                    ? 'Mode sebagian (50%) aktif — klik kata mana saja untuk tampil/sembunyikan harokatnya.'
                    : 'Mode Ubah Harokat aktif — klik kata mana saja untuk menyembunyikan harokat kata tersebut.'}
                </span>
                {hasWordOverrides && (
                  <button
                    type="button"
                    onClick={() => setWordHarakatOverrides({})}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset pilihan kata
                  </button>
                )}
              </div>
            </div>

            {/* Translation Toggle & Panel */}
            <div className="px-5 sm:px-8 pb-6 space-y-3">
              <button
                type="button"
                onClick={() => setShowTranslation((v) => !v)}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  showTranslation
                    ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Languages className="w-4 h-4 text-sky-700" />
                {showTranslation ? 'Tutup Terjemahan' : 'Buka Terjemahan'}
              </button>

              {showTranslation && (
                <div className="rounded-2xl bg-sky-50/70 border border-sky-200/90 p-4 sm:p-5 text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line">
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-800 mb-1.5">
                    Terjemahan Bahasa Indonesia
                  </p>
                  {currentItem.translation}
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => goToIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNumberGrid((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                  showNumberGrid
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Grid className="w-4 h-4" />
                Pilih Nomor ({currentIndex + 1}/{seasonItems.length})
              </button>

              <button
                type="button"
                onClick={() => goToIndex(currentIndex + 1)}
                disabled={currentIndex >= seasonItems.length - 1}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        )}

        {/* Quick Number Picker Grid */}
        {showNumberGrid && (
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Nomor — {seasonMeta.title} ({seasonItems.length} Materi)
              </h3>
              {seasonCompletedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const seasonIds = new Set(seasonItems.map((i) => i.id));
                    updateCompletedIds((prev) =>
                      prev.filter((id) => !seasonIds.has(id))
                    );
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Selesai Season Ini
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-9 md:grid-cols-11 gap-2">
              {seasonItems.map((item, idx) => {
                const isCurrent = idx === currentIndex;
                const isDone = completedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      goToIndex(idx);
                      setShowNumberGrid(false);
                    }}
                    className={`relative h-10 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                      isCurrent
                        ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-300'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.numberLabel}
                    {isDone && !isCurrent && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
