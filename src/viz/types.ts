import type { ComponentType, LazyExoticComponent } from 'react';

export type VizTopic = 'societe' | 'economie' | 'education' | 'environnement';

export interface VizViewProps {
  mode: 'web' | 'reel';
}

export interface VizMeta {
  id: string;
  title: string;
  subtitle: string;
  topic: VizTopic;
  source: string;
  published: string;
  thumbnail?: string;
}

export interface VizDefinition extends VizMeta {
  Component: LazyExoticComponent<ComponentType<VizViewProps>>;
}
