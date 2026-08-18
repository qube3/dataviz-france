import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export function Header(): ReactNode {
  return (
    <header className="site-header">
      <Link to="/" className="site-brand">
        🇫🇷 Data Viz France
      </Link>
    </header>
  );
}
