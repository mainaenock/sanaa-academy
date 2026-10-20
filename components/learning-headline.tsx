'use client';
import { useEffect, useState } from 'react';
const phrases = ['practical by doing.', 'clearer by building.', 'real through practice.'];
export function LearningHeadline() {
  const [text, setText] = useState(phrases[0]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setTimeout>;
    let phrase = 0,
      position = phrases[0].length,
      deleting = true;
    const tick = () => {
      position += deleting ? -1 : 1;
      setText(phrases[phrase].slice(0, position));
      let delay = deleting ? 38 : 65;
      if (position === 0) {
        phrase = (phrase + 1) % phrases.length;
        deleting = false;
        delay = 320;
      } else if (position === phrases[phrase].length) {
        deleting = true;
        delay = 2600;
      }
      timer = setTimeout(tick, delay);
    };
    const update = () => {
      clearTimeout(timer);
      if (preference.matches) setText(phrases[0]);
      else {
        phrase = 0;
        position = phrases[0].length;
        deleting = true;
        setText(phrases[0]);
        timer = setTimeout(tick, 2600);
      }
    };
    update();
    preference.addEventListener('change', update);
    return () => {
      clearTimeout(timer);
      preference.removeEventListener('change', update);
    };
  }, []);
  return (
    <span className="learning-typewriter">
      <span className="learning-sr-only">practical by doing.</span>
      <span aria-hidden="true">
        {text}
        <span className="learning-caret" />
      </span>
    </span>
  );
}
