import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import './SiteLayout.css';

export function SiteLayout(): ReactNode {
  return (
    <div className="site-container">
      <Header />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
