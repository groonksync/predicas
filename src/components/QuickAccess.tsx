import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  BookOpen,
  Bookmark,
  ListOrdered,
  StickyNote,
  BookMarked,
  X,
  Maximize2,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';
import { Study, BibleVerse } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { searchBible, RVR1960VerseResult } from '../services/bibleService';

export interface PreviewItem {
  id: string;
  kind: 'verse' | 'point' | 'note' | 'exegesis' | 'bible';
  label: string;
  title: string;
  body: string;
  markdown?: boolean;
}

type SheetKind = 'citas' | 'bosquejo' | 'notas' | 'biblia' | null;

interface QuickAccessProps {
  study: Study;
  onAddVerse?: (verse: BibleVerse) => void;
  variant?: 'normal' | 'pulpit';
  onOpenNotesPanel?: () => void;
}

const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const buildStudyItems = (study: Study) => {
  const verses: PreviewItem[] = [];
  if (study.mainVerse?.reference) {
    verses.push({
      id: 'main',
      kind: 'verse',
      label: `Pasaje central · ${study.mainVerse.version}`,
      title: study.mainVerse.reference,
      body: study.mainVerse.text,
    });
  }
  study.relatedVerses.forEach(v =>
    verses.push({ id: v.id, kind: 'verse', label: `Cita de apoyo · ${v.version}`, title: v.reference, body: v.text })
  );

  const points: PreviewItem[] = study.outlinePoints.map(p => ({
    id: p.id,
    kind: 'point',
    label: `Punto ${p.number}${p.scriptureRef ? ` · ${p.scriptureRef}` : ''}`,
    title: p.title,
    body: p.content,
  }));

  const notes: PreviewItem[] = study.quickNotes
    .filter(n => !n.isArchived)
    .map(n => ({ id: n.id, kind: 'note', label: n.tag || 'Nota rápida', title: n.tag || 'Nota', body: n.text }));

  if (study.detailedNotes?.trim()) {
    notes.push({
      id: 'exegesis',
      kind: 'exegesis',
      label: 'Notas exegéticas',
      title: 'Apuntes y contexto',
      body: study.detailedNotes,
      markdown: true,
    });
  }

  return { verses, points, notes };
};

const bibleToItem = (r: RVR1960VerseResult): PreviewItem => ({
  id: `bible-${r.reference}`,
  kind: 'bible',
  label: 'Biblia · RVR1960',
  title: r.reference,
  body: r.text,
});

const bibleToVerse = (r: RVR1960VerseResult): BibleVerse => ({
  id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  reference: r.reference,
  text: r.text,
  version: 'RVR1960',
});

export const BigPreview: React.FC<{
  items: PreviewItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  initialTheme?: 'light' | 'dark';
}> = ({ items, index, onIndexChange, onClose, initialTheme = 'dark' }) => {
  const [scale, setScale] = useState(100);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('dark');
  const item = items[index];

  useEffect(() => {
    if (initialTheme) {
      setPreviewTheme(initialTheme);
    }
  }, [initialTheme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < items.length - 1) onIndexChange(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(250, s + 15));
      if (e.key === '-') setScale(s => Math.max(70, s - 15));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onIndexChange]);

  if (!item) return null;
  const isLong = item.body.length > 420 || item.markdown;
  const isLight = previewTheme === 'light';

  return createPortal(
    <div className={`fixed inset-0 z-[100] w-screen h-screen min-h-screen overflow-hidden flex flex-col font-sans select-none animate-fadeIn transition-colors duration-200 ${
      isLight ? 'bg-[#FAFAFC] text-[#121214]' : 'bg-[#0E0E10] text-white'
    }`}>
      <div className={`flex items-center justify-between px-5 sm:px-8 py-3.5 flex-shrink-0 ${
        isLight ? 'bg-white shadow-xs border-b border-black/[0.05]' : 'bg-[#141418] border-b border-white/[0.06]'
      }`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-[#636366]' : 'text-neutral-400'}`}>
          {item.label} {items.length > 1 && <span className="ml-2 opacity-60">{index + 1} / {items.length}</span>}
        </span>
        <div className="flex items-center gap-2">
          {/* Alternar tema Claro / Gris */}
          <div className={`flex items-center p-1 rounded-xl text-xs font-bold ${
            isLight ? 'bg-[#F2F3F6]' : 'bg-[#202026]'
          }`}>
            <button
              onClick={() => setPreviewTheme('light')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                isLight ? 'bg-white text-[#121214] shadow-xs' : 'opacity-60 hover:opacity-100 text-white'
              }`}
            >
              <Sun size={12} />
              <span>Claro</span>
            </button>
            <button
              onClick={() => setPreviewTheme('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                !isLight ? 'bg-white text-[#121214] shadow-xs' : 'opacity-60 hover:opacity-100 text-[#121214]'
              }`}
            >
              <Moon size={12} />
              <span>Gris</span>
            </button>
          </div>

          {/* Zoom tipográfico */}
          <div className={`flex items-center rounded-xl p-1 gap-1 ${
            isLight ? 'bg-[#F2F3F6]' : 'bg-[#202026]'
          }`}>
            <button
              onClick={() => setScale(s => Math.max(70, s - 15))}
              className="p-1.5 rounded-lg opacity-75 hover:opacity-100 active:scale-90 transition-all"
              title="Reducir tamaño de letra"
            >
              <ZoomOut size={15} />
            </button>
            <span className="px-2 text-xs font-mono font-bold min-w-[45px] text-center">{scale}%</span>
            <button
              onClick={() => setScale(s => Math.min(250, s + 15))}
              className="p-1.5 rounded-lg opacity-75 hover:opacity-100 active:scale-90 transition-all"
              title="Aumentar tamaño de letra"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          <button
            onClick={onClose}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all whitespace-nowrap ${
              isLight ? 'bg-[#1C1C1E] text-white hover:bg-black' : 'bg-white text-[#141416] hover:bg-neutral-200'
            }`}
          >
            <X size={14} /> Cerrar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 sm:px-14 lg:px-24 py-10" onClick={onClose}>
        <div className="max-w-6xl w-full" onClick={e => e.stopPropagation()}>
          <h2
            className={`font-black tracking-tight mb-6 ${isLight ? 'text-[#121214]' : 'text-white'}`}
            style={{ fontSize: `calc(2.75rem * ${scale / 100})`, lineHeight: 1.15 }}
          >
            {item.title}
          </h2>
          {item.markdown ? (
            <div
              className={`leading-relaxed font-medium ${isLight ? 'text-[#1C1C1E]' : 'text-white'}`}
              style={{ fontSize: `calc(1.65rem * ${scale / 100})`, lineHeight: 1.55 }}
            >
              <MarkdownRenderer content={item.body} />
            </div>
          ) : (
            <p
              className={`font-extrabold leading-snug whitespace-pre-line ${isLight ? 'text-[#121214]' : 'text-white'}`}
              style={{
                fontSize: `calc(${isLong ? '2.3rem' : '4rem'} * ${scale / 100})`,
                lineHeight: 1.25
              }}
            >
              {item.kind === 'verse' || item.kind === 'bible' ? `“${item.body}”` : item.body}
            </p>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-3 pb-6 flex-shrink-0">
          <button
            disabled={index === 0}
            onClick={() => onIndexChange(index - 1)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-30 active:scale-95 whitespace-nowrap ${
              isLight ? 'bg-white text-[#1C1C1E] shadow-sm' : 'bg-[#1C1C22] text-white hover:bg-[#282830]'
            }`}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            disabled={index === items.length - 1}
            onClick={() => onIndexChange(index + 1)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-30 active:scale-95 whitespace-nowrap ${
              isLight ? 'bg-white text-[#1C1C1E] shadow-sm' : 'bg-[#1C1C22] text-white hover:bg-[#282830]'
            }`}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>,
    document.body
  );
};

const useBibleSearch = (query: string, max = 25) => {
  const [results, setResults] = useState<RVR1960VerseResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const r = await searchBible(q, max);
      if (!cancelled) {
        setResults(r);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, max]);

  return { results, loading };
};

const BibleRow: React.FC<{
  r: RVR1960VerseResult;
  added: boolean;
  onPreview: () => void;
  onAdd?: () => void;
}> = ({ r, added, onPreview, onAdd }) => (
  <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors">
    <button onClick={onPreview} className="flex-1 text-left min-w-0">
      <div className="text-sm font-bold text-white">{r.reference}</div>
      <div className="text-xs text-neutral-400 leading-relaxed line-clamp-2 mt-0.5">{r.text}</div>
    </button>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button onClick={onPreview} className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08]" title="Ver en grande">
        <Maximize2 size={14} />
      </button>
      {onAdd && (
        <button
          onClick={onAdd}
          disabled={added}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap ${
            added ? 'bg-white/10 text-neutral-300' : 'bg-white text-[#141416]'
          }`}
          title="Añadir al sermón"
        >
          {added ? <Check size={12} /> : <Plus size={12} />}
          {added ? 'Añadido' : 'Añadir'}
        </button>
      )}
    </div>
  </div>
);

const UniversalSearch: React.FC<{
  study: Study;
  onClose: () => void;
  onOpenPreview: (items: PreviewItem[], index: number) => void;
  onAddVerse?: (r: RVR1960VerseResult) => void;
  addedRefs: Set<string>;
}> = ({ study, onClose, onOpenPreview, onAddVerse, addedRefs }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { verses, points, notes } = useMemo(() => buildStudyItems(study), [study]);
  const { results: bibleResults, loading } = useBibleSearch(query, 15);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = norm(query.trim());
  const match = (it: PreviewItem) => !q || norm(`${it.title} ${it.body} ${it.label}`).includes(q);

  const groups = [
    { name: 'Versículos del sermón', icon: Bookmark, items: verses.filter(match) },
    { name: 'Bosquejo', icon: ListOrdered, items: points.filter(match) },
    { name: 'Notas', icon: StickyNote, items: notes.filter(match) },
  ].filter(g => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4 font-sans" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#1C1C22] rounded-3xl shadow-2xl overflow-hidden text-white animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 bg-[#23232A]">
          <Search size={18} className="text-[#8E8E93]" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar versículos, notas, bosquejo o en la Biblia (ej. Juan 3:16, gracia)…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-neutral-500"
          />
          <kbd className="hidden sm:inline text-[10px] font-bold text-neutral-400 bg-white/10 rounded-md px-2 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {groups.map(g => (
            <div key={g.name}>
              <div className="flex items-center gap-2 px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                <g.icon size={12} /> {g.name}
              </div>
              {g.items.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => onOpenPreview(g.items, i)}
                  className="w-full text-left p-3 rounded-2xl hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold truncate">{it.title}</span>
                    <span className="text-[10px] font-semibold text-neutral-500 flex-shrink-0">{it.label}</span>
                  </div>
                  <div className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{it.body}</div>
                </button>
              ))}
            </div>
          ))}

          {q.length >= 3 && (
            <div>
              <div className="flex items-center gap-2 px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                <BookMarked size={12} /> Biblia Reina Valera 1960
                {loading && <Loader2 size={12} className="animate-spin" />}
              </div>
              {!loading && bibleResults.length === 0 && (
                <div className="px-3 py-2 text-xs text-neutral-500">Sin resultados en la Biblia.</div>
              )}
              {bibleResults.map((r, i) => (
                <BibleRow
                  key={r.reference}
                  r={r}
                  added={addedRefs.has(r.reference)}
                  onPreview={() => onOpenPreview(bibleResults.map(bibleToItem), i)}
                  onAdd={onAddVerse ? () => onAddVerse(r) : undefined}
                />
              ))}
            </div>
          )}

          {groups.length === 0 && q.length < 3 && (
            <div className="px-3 py-8 text-center text-xs text-neutral-500">Escribe al menos 3 letras para buscar también en la Biblia.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const QuickAccess: React.FC<QuickAccessProps> = ({ study, onAddVerse, variant = 'normal', onOpenNotesPanel }) => {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [preview, setPreview] = useState<{ items: PreviewItem[]; index: number } | null>(null);
  const [bibleQuery, setBibleQuery] = useState('');
  const { results: bibleResults, loading: bibleLoading } = useBibleSearch(bibleQuery, 30);

  const { verses, points, notes } = useMemo(() => buildStudyItems(study), [study]);
  const addedRefs = useMemo(
    () => new Set([study.mainVerse?.reference, ...study.relatedVerses.map(v => v.reference)].filter(Boolean) as string[]),
    [study]
  );

  const anyOverlay = !!sheet || searchOpen || !!preview;

  useEffect(() => {
    if (anyOverlay) document.body.dataset.quickOverlay = 'open';
    else delete document.body.dataset.quickOverlay;
    return () => {
      delete document.body.dataset.quickOverlay;
    };
  }, [anyOverlay]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSheet(null);
        setSearchOpen(true);
      } else if (e.key === '/' && !typing && !anyOverlay) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape' && sheet && !preview) {
        setSheet(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyOverlay, sheet, preview]);

  const openPreview = (items: PreviewItem[], index: number) => setPreview({ items, index });

  const handleAdd = (r: RVR1960VerseResult) => {
    if (!onAddVerse || addedRefs.has(r.reference)) return;
    onAddVerse(bibleToVerse(r));
  };

  const dockButtons: { key: SheetKind | 'pasaje' | 'buscar'; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'buscar', label: 'Buscar', icon: Search },
    { key: 'pasaje', label: 'Pasaje', icon: BookOpen },
    { key: 'citas', label: 'Citas', icon: Bookmark, count: verses.length },
    { key: 'bosquejo', label: 'Bosquejo', icon: ListOrdered, count: points.length },
    { key: 'notas', label: 'Notas', icon: StickyNote, count: notes.length },
    { key: 'biblia', label: 'Biblia', icon: BookMarked },
  ];

  const onDock = (key: (typeof dockButtons)[number]['key']) => {
    if (key === 'buscar') {
      setSheet(null);
      setSearchOpen(true);
    } else if (key === 'pasaje') {
      setSheet(null);
      if (verses.length) openPreview(verses, 0);
    } else if (variant === 'normal' && (key === 'notas' || key === 'bosquejo') && onOpenNotesPanel) {
      setSheet(null);
      onOpenNotesPanel();
    } else {
      setSheet(prev => (prev === key ? null : (key as SheetKind)));
    }
  };

  const sheetTitle: Record<Exclude<SheetKind, null>, string> = {
    citas: 'Versículos del sermón',
    bosquejo: 'Puntos del bosquejo',
    notas: 'Notas y apuntes',
    biblia: 'Biblia Reina Valera 1960',
  };

  const renderList = (items: PreviewItem[], emptyText: string) =>
    items.length === 0 ? (
      <div className="py-8 text-center text-xs text-neutral-500">{emptyText}</div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {items.map((it, i) => (
          <button
            key={it.id}
            onClick={() => openPreview(items, i)}
            className="text-left p-4 rounded-2xl bg-[#25252C] hover:bg-[#2E2E36] transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] truncate">{it.label}</span>
              <Maximize2 size={13} className="text-neutral-500 group-hover:text-white flex-shrink-0" />
            </div>
            <div className="text-sm font-bold text-white truncate">{it.title}</div>
            <div className="text-xs text-neutral-400 line-clamp-2 mt-0.5">{it.body}</div>
          </button>
        ))}
      </div>
    );

  return createPortal(
    <>
      {sheet && (
        <>
          <div className="fixed inset-0 z-[64] bg-black/30" onClick={() => setSheet(null)} />
          <div className="fixed z-[65] left-1/2 -translate-x-1/2 bottom-24 w-[calc(100%-2rem)] max-w-3xl bg-[#1C1C22]/95 backdrop-blur-2xl rounded-3xl shadow-2xl text-white font-sans animate-scaleIn">
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-sm font-bold">{sheetTitle[sheet]}</h3>
              <button onClick={() => setSheet(null)} className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08]">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto px-4 pb-4">
              {sheet === 'citas' && renderList(verses, 'Aún no hay versículos en este sermón.')}
              {sheet === 'bosquejo' && renderList(points, 'El bosquejo está vacío.')}
              {sheet === 'notas' && renderList(notes, 'No hay notas todavía.')}
              {sheet === 'biblia' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#25252C]">
                    <Search size={15} className="text-[#8E8E93]" />
                    <input
                      autoFocus
                      value={bibleQuery}
                      onChange={e => setBibleQuery(e.target.value)}
                      placeholder="Cita (Romanos 8:28) o palabra (misericordia)…"
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-500"
                    />
                    {bibleLoading && <Loader2 size={14} className="animate-spin text-neutral-400" />}
                  </div>
                  {bibleQuery.trim().length < 3 ? (
                    <div className="py-6 text-center text-xs text-neutral-500">
                      Escribe una cita o palabra. Puedes verla en grande o añadirla al sermón al instante.
                    </div>
                  ) : bibleResults.length === 0 && !bibleLoading ? (
                    <div className="py-6 text-center text-xs text-neutral-500">Sin resultados.</div>
                  ) : (
                    bibleResults.map((r, i) => (
                      <BibleRow
                        key={r.reference}
                        r={r}
                        added={addedRefs.has(r.reference)}
                        onPreview={() => openPreview(bibleResults.map(bibleToItem), i)}
                        onAdd={onAddVerse ? () => handleAdd(r) : undefined}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* BARRA FLOTANTE DE ACCESO RÁPIDO SIN TRAZOS (oculta cuando hay vista previa gigante) */}
      {!preview && (
        <nav
          className={`no-print fixed z-[66] left-1/2 -translate-x-1/2 bottom-5 flex items-center gap-1 p-1.5 rounded-2xl backdrop-blur-2xl shadow-2xl font-sans ${
            variant === 'pulpit'
              ? 'bg-[#18181C]/95'
              : 'bg-white/95 dark:bg-[#18181C]/95'
          }`}
        >
          {dockButtons.map(b => {
            const active = sheet === b.key || (b.key === 'buscar' && searchOpen);
            return (
              <button
                key={b.key}
                onClick={() => onDock(b.key)}
                className={`relative flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                  active
                    ? variant === 'pulpit'
                      ? 'bg-white text-[#121214]'
                      : 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214]'
                    : variant === 'pulpit'
                    ? 'text-neutral-300 hover:bg-white/[0.08] hover:text-white'
                    : 'text-[#4A4A52] dark:text-[#C8C8D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                }`}
                title={b.key === 'buscar' ? 'Buscar (⌘K)' : b.label}
              >
                <b.icon size={15} />
                <span>{b.label}</span>
                {!!b.count && (
                  <span className="hidden sm:inline text-[10px] font-bold opacity-70">{b.count}</span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      {searchOpen && (
        <UniversalSearch
          study={study}
          onClose={() => setSearchOpen(false)}
          onOpenPreview={(items, i) => openPreview(items, i)}
          onAddVerse={onAddVerse ? handleAdd : undefined}
          addedRefs={addedRefs}
        />
      )}

      {preview && (
        <BigPreview
          items={preview.items}
          index={preview.index}
          onIndexChange={i => setPreview(p => (p ? { ...p, index: i } : p))}
          onClose={() => setPreview(null)}
          initialTheme="dark"
        />
      )}
    </>,
    document.body
  );
};

export { FileText as QuickAccessIcon };
export default QuickAccess;
