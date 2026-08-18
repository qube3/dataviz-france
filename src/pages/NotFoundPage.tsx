import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage(): ReactNode {
  return (
    <div className="viz-status">
      <p>Page introuvable.</p>
      <Link to="/">Retour à l'accueil</Link>
    </div>
  );
}
