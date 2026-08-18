import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

export function App(): ReactNode {
  return <RouterProvider router={router} />;
}
