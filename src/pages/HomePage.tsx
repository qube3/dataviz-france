import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { VIZ } from '../viz/registry';
import type { VizTopic } from '../viz/types';
import './HomePage.css';

const TOPICS: { id: VizTopic; label: string }[] = [
  { id: 'societe', label: 'Société' },
  { id: 'economie', label: 'Économie' },
  { id: 'education', label: 'Éducation' },
  { id: 'energie', label: 'Énergie' },
];

export function HomePage(): ReactNode {
  const [activeTopic, setActiveTopic] = useState<VizTopic | 'all'>('all');

  const visibleTopics = useMemo(
    () => TOPICS.filter((t) => activeTopic === 'all' || activeTopic === t.id),
    [activeTopic],
  );

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-title">
          <img src="/logo.svg" alt="" className="home-hero-logo" width={64} height={64} />
          <h1>Data Viz France</h1>
        </div>
        <p>Des visualisations interactives sur les données publiques françaises.</p>
      </section>

      <nav className="topic-filter">
        <button type="button" className={activeTopic === 'all' ? 'active' : ''} onClick={() => setActiveTopic('all')}>
          Tout
        </button>
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className={activeTopic === topic.id ? 'active' : ''}
            onClick={() => setActiveTopic(topic.id)}
          >
            {topic.label}
          </button>
        ))}
      </nav>

      <div className="viz-catalog">
        {visibleTopics.map((topic) => {
          const vizzes = VIZ.filter((v) => v.topic === topic.id);
          return (
            <section key={topic.id} className="topic-section">
              <h2>{topic.label}</h2>
              {vizzes.length === 0 ? (
                <p className="topic-empty">Bientôt disponible.</p>
              ) : (
                <div className="viz-grid">
                  {vizzes.map((viz) => (
                    <Link key={viz.id} to={`/viz/${viz.id}`} className="viz-card">
                      <h3>{viz.title}</h3>
                      <p>{viz.subtitle}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
