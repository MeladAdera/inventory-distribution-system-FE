'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/common/utils/cn';

interface WelcomeTyperProps {
  greeting: string;
  phrases: string[];
}

const CHAR_SPEED = 44;
const DELETE_SPEED = 20;
const PHRASE_PAUSE = 2800;
const BETWEEN_PAUSE = 380;

export function WelcomeTyper({ greeting, phrases }: WelcomeTyperProps) {
  const [head, setHead] = useState('');
  const [headDone, setHeadDone] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setCursor((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Type heading once
  useEffect(() => {
    if (headDone) return;
    if (head.length < greeting.length) {
      const id = setTimeout(() => setHead(greeting.slice(0, head.length + 1)), CHAR_SPEED);
      return () => clearTimeout(id);
    }
    setHeadDone(true);
  }, [head, greeting, headDone]);

  // Cycle phrases after heading is done
  useEffect(() => {
    if (!headDone || !phrases.length) return;
    const target = phrases[phraseIdx % phrases.length];
    let id: ReturnType<typeof setTimeout>;

    if (!deleting) {
      if (phrase.length < target.length) {
        id = setTimeout(() => setPhrase(target.slice(0, phrase.length + 1)), CHAR_SPEED);
      } else {
        id = setTimeout(() => setDeleting(true), PHRASE_PAUSE);
      }
    } else {
      if (phrase.length > 0) {
        id = setTimeout(() => setPhrase((p) => p.slice(0, -1)), DELETE_SPEED);
      } else {
        id = setTimeout(() => {
          setDeleting(false);
          setPhraseIdx((i) => i + 1);
        }, BETWEEN_PAUSE);
      }
    }
    return () => clearTimeout(id);
  }, [headDone, phrase, phraseIdx, deleting, phrases]);

  return (
    <>
      <h1
        className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] text-ink-900"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {head}
        <span
          className={cn(
            'inline-block w-0.5-7 bg-ink-800 align-middle ms-0.5 -translate-y-0.5',
            headDone ? 'hidden' : cursor ? 'opacity-100' : 'opacity-0'
          )}
        />
      </h1>

      <p className="mt-2 text-sm text-ink-600 min-h-5">
        {headDone && (
          <>
            {phrase}
            <span
              className={cn(
                'inline-block w-px h-3.5 bg-ink-400 align-middle ms-0.5',
                cursor ? 'opacity-100' : 'opacity-0'
              )}
            />
          </>
        )}
      </p>
    </>
  );
}
