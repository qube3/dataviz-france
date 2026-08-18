import { Suspense, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getViz } from '../viz/registry';
import { NotFoundPage } from './NotFoundPage';

export function VizPage(): ReactNode {
  const { vizId } = useParams<{ vizId: string }>();
  const viz = vizId ? getViz(vizId) : undefined;

  if (!viz) return <NotFoundPage />;

  const { Component } = viz;
  return (
    <Suspense fallback={<p className="viz-status">Chargement…</p>}>
      <Component mode="web" />
    </Suspense>
  );
}
