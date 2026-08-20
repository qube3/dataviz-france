import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export function Header(): ReactNode {
  return (
    <header className="site-header">
      <Link to="/" className="site-brand">
        <img src="/logo.svg" alt="" className="site-logo" width={36} height={36} />
        Data Viz France
      </Link>
    </header>
  );
}
