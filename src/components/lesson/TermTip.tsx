'use client';
import Link from 'next/link';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * A glossary term in running text. Hover or focus shows a short definition; a click or
 * tap pins it open (with a link to the glossary); Escape or a click elsewhere closes it.
 */
export function TermTip({ id, term, short, children }: { id: string; term: string; short: string; children: ReactNode }) {
  const tipId = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [below, setBelow] = useState(false);
  const [shift, setShift] = useState(0);
  const hideTimer = useRef<number | undefined>(undefined);
  const show = hover || pinned;

  useLayoutEffect(() => {
    if (!show || !wrap.current || !tip.current) return;
    const r = wrap.current.getBoundingClientRect();
    setBelow(r.top < 150);
    setShift(0);
    requestAnimationFrame(() => {
      const t = tip.current?.getBoundingClientRect();
      if (!t) return;
      const margin = 8;
      if (t.left < margin) setShift(margin - t.left);
      else if (t.right > window.innerWidth - margin) setShift(window.innerWidth - margin - t.right);
    });
  }, [show]);

  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false);
        setHover(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [pinned]);

  const enter = () => {
    window.clearTimeout(hideTimer.current);
    setHover(true);
  };
  const leave = () => {
    hideTimer.current = window.setTimeout(() => setHover(false), 160);
  };

  return (
    <span
      ref={wrap}
      className="term"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setHover(false);
          setPinned(false);
        }
      }}
    >
      <button
        type="button"
        className="term-trigger"
        aria-describedby={tipId}
        aria-expanded={pinned}
        onFocus={enter}
        onBlur={(e) => {
          if (!wrap.current?.contains(e.relatedTarget as Node)) leave();
        }}
        onClick={() => setPinned((p) => !p)}
      >
        {children}
      </button>
      <span
        ref={tip}
        id={tipId}
        role="tooltip"
        className="term-tip"
        hidden={!show}
        data-below={below ? '' : undefined}
        style={shift ? { transform: `translateX(calc(-50% + ${shift}px))` } : undefined}
      >
        <strong className="block">{term}</strong>
        <span className="block">{short}</span>
        {pinned ? (
          <Link href={`/glossary/#${id}`} className="mt-1 inline-block font-semibold text-accent underline">
            Open in the glossary
          </Link>
        ) : null}
      </span>
    </span>
  );
}
