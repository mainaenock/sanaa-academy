'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Download, Presentation, X } from 'lucide-react';
import type { PptxViewer } from '@aiden0z/pptx-renderer';
import { isPowerPoint, POWERPOINT_TYPE, resourceFileUrl } from '@/lib/resource-file';
import type { Resource } from '@/lib/view-types';

export function ResourceActions({ resource }: { resource: Resource }) {
  const [open, setOpen] = useState(false);
  if (!resource.file_name)
    return (
      <a className="text-link" href={resource.url} target="_blank" rel="noopener noreferrer">
        Open resource ↗
      </a>
    );

  const url = resourceFileUrl(resource.id);
  return (
    <div className="resource-actions">
      {isPowerPoint(resource.file_name) && (
        <button className="btn btn-light" type="button" onClick={() => setOpen(true)}>
          <Presentation size={16} /> View slides
        </button>
      )}
      <a className="text-link" href={url} download={resource.file_name}>
        Download file
      </a>
      {open && (
        <PowerPointDialog
          title={resource.title}
          filename={resource.file_name}
          url={url}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function PowerPointDialog({
  title,
  filename,
  url,
  onClose,
}: {
  title: string;
  filename: string;
  url: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const slides = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [status, setStatus] = useState('Loading slides…');
  const [error, setError] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    const container = slides.current;
    if (!element || !container) return;
    if (!element.open) element.showModal();

    const abort = new AbortController();
    let viewer: PptxViewer | undefined;

    async function showSlides(target: HTMLDivElement) {
      try {
        const [{ PptxViewer, RECOMMENDED_ZIP_LIMITS }, response] = await Promise.all([
          import('@aiden0z/pptx-renderer'),
          fetch(url, { cache: 'no-store', signal: abort.signal }),
        ]);
        if (!response.ok || !response.headers.get('content-type')?.startsWith(POWERPOINT_TYPE))
          throw new Error('PowerPoint file is unavailable');

        viewer = await PptxViewer.open(await response.arrayBuffer(), target, {
          externalMedia: 'block',
          zipLimits: RECOMMENDED_ZIP_LIMITS,
          scrollContainer: target,
          lazyMedia: true,
          lazySlides: true,
          pdfjs: false,
          listOptions: { windowed: true, showSlideLabels: true },
          signal: abort.signal,
        });
        if (abort.signal.aborted) {
          viewer.destroy();
          return;
        }
        if (!viewer.slideCount) throw new Error('The file contains no slides');
        setStatus(viewer.slideCount + (viewer.slideCount === 1 ? ' slide' : ' slides'));
      } catch {
        viewer?.destroy();
        if (!abort.signal.aborted) {
          setError(true);
          setStatus('The slide preview is unavailable. You can still download the PowerPoint.');
        }
      }
    }

    void showSlides(container);
    return () => {
      abort.abort();
      viewer?.destroy();
    };
  }, [url]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      className="presentation-dialog"
    >
      <header className="presentation-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          <p className="tiny" role={error ? 'alert' : 'status'}>
            {status}
          </p>
        </div>
        <div className="resource-actions">
          <a className="btn btn-light" href={url} download={filename}>
            <Download size={16} /> Download PowerPoint
          </a>
          <button
            className="icon-button"
            type="button"
            aria-label="Close slides"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
      </header>
      <div
        className="presentation-slides"
        ref={slides}
        aria-label="PowerPoint slides"
        tabIndex={0}
      />
    </dialog>
  );
}
