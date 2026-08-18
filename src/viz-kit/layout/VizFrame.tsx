import type { ReactNode } from 'react';
import './VizFrame.css';

export interface VizFrameProps {
  title: string;
  subtitle?: string;
  source?: string;
  mode: 'web' | 'reel';
  children: ReactNode;
}

export function VizFrame({ title, subtitle, source, mode, children }: VizFrameProps): ReactNode {
  return (
    <div className={`viz-frame viz-frame--${mode}`}>
      <header className="viz-frame-header">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>

      <div className="viz-frame-content">{children}</div>

      {source && (
        <footer className="viz-frame-footer">
          <p>Source des données : {source}</p>
        </footer>
      )}
    </div>
  );
}
