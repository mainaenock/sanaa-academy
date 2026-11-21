'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

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
  }, []);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    const first = track?.children[0];
    const second = track?.children[1];
    if (!track || !(first instanceof HTMLElement) || !(second instanceof HTMLElement)) return;

    const step = second.offsetLeft - first.offsetLeft;
    const next =
      direction === 1
        ? Math.floor((track.scrollLeft + 2) / step) + 1
        : Math.ceil((track.scrollLeft - 2) / step) - 1;
    track.scrollTo({ left: next * step });
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
            aria-disabled={!canGoBack}
            onClick={() => canGoBack && move(-1)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-controls="portfolio-projects"
            aria-label="Next website previews"
            aria-disabled={!canGoForward}
            onClick={() => canGoForward && move(1)}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul className="learning-portfolio-track" id="portfolio-projects" ref={trackRef} role="list">
        {projects.map(([name, domain, image]) => (
          <li key={domain}>
            <a
              className="learning-portfolio-card"
              href={`https://${domain}/`}
              target="_blank"
              rel="noreferrer"
              aria-label={`${name} (opens in a new tab)`}
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
        ))}
      </ul>
    </section>
  );
}
