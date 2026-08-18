import { Suspense, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getViz } from '../viz/registry';
import './ReelPage.css';

export function ReelPage(): ReactNode {
  const { vizId } = useParams<{ vizId: string }>();
  const viz = vizId ? getViz(vizId) : undefined;

  if (!viz) return <p className="viz-status">Visualisation inconnue : {vizId}</p>;

  const { Component } = viz;
  return (
    <div className="reel-stage">
      <Suspense fallback={null}>
        <Component mode="reel" />
      </Suspense>
    </div>
  );
}
