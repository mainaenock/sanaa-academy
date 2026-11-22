'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const projects = [
  ['Kiddy Villa Kindergarten', 'kiddyvillakindergarten.com', 'kiddy-villa'],
  ['Creative All Stars Academy', 'creativeallstarsacademy.sc.ke', 'creative-all-stars'],
  ['Wemax', 'wemax.co.ke', 'wemax'],
  ['Anner Creatives', 'annercreatives.co.ke', 'anner-creatives'],
  ['Sanaa Studio', 'sanaastudio.co.ke', 'sanaa-studio'],
  ['Sanaa Academy', 'sanaacademy.co.ke', 'sanaa-academy'],
  [
    'Christian Outreach Ministries Worldwide Mlimani',
    'christianoutreachministriesworldwidemlimani.org',
    'christian-outreach',
  ],
];

export function PortfolioGallery() {
  const trackRef = useRef<HTMLUListElement>(null);
  const mouseOverTrack = useRef(false);
  const resumeAt = useRef(0);
  const [canAnimate, setCanAnimate] = useState(false);
  const [paused, setPaused] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);
  const playing = canAnimate && !paused;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setCanAnimate(!motion.matches);
    update();
    motion.addEventListener('change', update);
    return () => motion.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || canAnimate) return;

    const updateControls = () => {
      setCanGoBack(track.scrollLeft > 2);
      setCanGoForward(track.scrollLeft < track.scrollWidth - track.clientWidth - 2);
    };

    const resizeObserver = new ResizeObserver(updateControls);
    resizeObserver.observe(track);
    track.addEventListener('scroll', updateControls, { passive: true });
    updateControls();

    return () => {
      track.removeEventListener('scroll', updateControls);
      resizeObserver.disconnect();
    };
  }, [canAnimate]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !playing) return;

    let frame = 0;
    let previous = 0;
    let distance = 0;
    function advance(now: number) {
      if (!track) return;
      const elapsed = previous ? Math.min(now - previous, 50) : 0;
      previous = now;
      if (!mouseOverTrack.current && now >= resumeAt.current && !track.matches(':focus-within')) {
        distance += elapsed * 0.035;
        const pixels = Math.floor(distance);
        if (pixels) {
          const repeated = track.children[projects.length];
          if (repeated instanceof HTMLElement && repeated.offsetLeft) {
            track.scrollLeft = (track.scrollLeft + pixels) % repeated.offsetLeft;
          }
          distance -= pixels;
        }
      }
      frame = requestAnimationFrame(advance);
    }

    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (entry.isIntersecting) frame = requestAnimationFrame(advance);
    });
    observer.observe(track);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [playing]);

  function pauseForInteraction() {
    resumeAt.current = performance.now() + 3000;
  }

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    const first = track?.children[0];
    const second = track?.children[1];
    if (!track || !(first instanceof HTMLElement) || !(second instanceof HTMLElement)) return;

    pauseForInteraction();
    const step = second.offsetLeft - first.offsetLeft;
    const repeated = track.children[projects.length];
    const loopWidth = repeated instanceof HTMLElement ? repeated.offsetLeft : 0;
    let left = track.scrollLeft;
    if (loopWidth && left >= loopWidth) {
      left %= loopWidth;
      track.scrollLeft = left;
    }
    if (loopWidth && direction === -1 && left < 2) {
      left += loopWidth;
      track.scrollLeft = left;
    }
    const next =
      direction === 1 ? Math.floor((left + 2) / step) + 1 : Math.ceil((left - 2) / step) - 1;
    track.scrollTo({ left: next * step, behavior: canAnimate ? 'smooth' : 'instant' });
  }

  return (
    <section className="learning-container learning-portfolio" aria-labelledby="portfolio-heading">
      <div className="learning-portfolio-header">
        <h2 id="portfolio-heading">Selected website projects</h2>
        <div className="learning-portfolio-controls">
          <button
            type="button"
            aria-controls="portfolio-projects"
            aria-label="Previous website previews"
            aria-disabled={!canAnimate && !canGoBack}
            onClick={() => (canAnimate || canGoBack) && move(-1)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-controls="portfolio-projects"
            aria-label="Next website previews"
            aria-disabled={!canAnimate && !canGoForward}
            onClick={() => (canAnimate || canGoForward) && move(1)}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          {canAnimate && (
            <button
              type="button"
              aria-label={playing ? 'Pause automatic scrolling' : 'Resume automatic scrolling'}
              aria-controls="portfolio-projects"
              onClick={() => {
                resumeAt.current = 0;
                setPaused(!paused);
              }}
            >
              {playing ? (
                <Pause size={17} aria-hidden="true" />
              ) : (
                <Play size={17} aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>
      <ul
        className="learning-portfolio-track"
        data-loop={canAnimate || undefined}
        id="portfolio-projects"
        ref={trackRef}
        role="list"
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') mouseOverTrack.current = true;
        }}
        onPointerLeave={() => {
          mouseOverTrack.current = false;
        }}
        onPointerDown={pauseForInteraction}
        onPointerUp={pauseForInteraction}
        onPointerCancel={pauseForInteraction}
        onTouchMove={pauseForInteraction}
        onWheel={pauseForInteraction}
      >
        {(canAnimate ? [...projects, ...projects] : projects).map(
          ([name, domain, image], index) => (
            <li key={`${domain}-${index}`} aria-hidden={index >= projects.length || undefined}>
              <a
                className="learning-portfolio-card"
                href={`https://${domain}/`}
                target="_blank"
                rel="noreferrer"
                aria-label={`${name} (opens in a new tab)`}
                tabIndex={index >= projects.length ? -1 : undefined}
              >
                <img
                  src={`/images/portfolio/${image}.webp`}
                  alt=""
                  width={1120}
                  height={650}
                  loading="lazy"
                  decoding="async"
                />
                <span>{name}</span>
              </a>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
