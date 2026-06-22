'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/common/utils/cn';

interface TypewriterTextProps {
  phrases: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
  className?: string;
}

export function TypewriterText({
  phrases,
  typeSpeed = 55,
  deleteSpeed = 28,
  pauseMs = 2200,
  className,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];

    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => setCharIdx((i) => i + 1), typeSpeed);
      return () => clearTimeout(t);
    }

    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pauseMs);
      return () => clearTimeout(t);
    }

    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx((i) => i - 1), deleteSpeed);
      return () => clearTimeout(t);
    }

    if (deleting && charIdx === 0) {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }
  }, [charIdx, deleting, phrases, phraseIdx, typeSpeed, deleteSpeed, pauseMs]);

  useEffect(() => {
    setDisplayed(phrases[phraseIdx].slice(0, charIdx));
  }, [charIdx, phrases, phraseIdx]);

  return (
    <span className={cn('inline-block', className)}>
      {displayed}
      <span className="ms-0.5 animate-pulse text-amber-500">|</span>
    </span>
  );
}
