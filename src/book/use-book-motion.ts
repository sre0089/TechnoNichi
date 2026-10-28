'use client';
import { useEffect, useRef, useState } from 'react';
export type BookState = 'open' | 'closed' | 'opening' | 'closing' | 'turning';
export function useBookMotion() {
  const [state, setState] = useState<BookState>('open');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const settled = useRef<'open' | 'closed'>('open');
  useEffect(() => {
    const settle = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = undefined;
        setState(settled.current);
      }
    };
    window.addEventListener('resize', settle);
    window.addEventListener('blur', settle);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('resize', settle);
      window.removeEventListener('blur', settle);
    };
  }, []);
  const play = (
    next: 'opening' | 'closing' | 'turning',
    motion: 'system' | 'none' = 'system',
  ) => {
    clearTimeout(timer.current);
    settled.current = next === 'closing' ? 'closed' : 'open';
    if (
      motion === 'none' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setState(settled.current);
      return;
    }
    setState(next);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      setState(settled.current);
    }, 180);
  };
  return { state, play };
}
