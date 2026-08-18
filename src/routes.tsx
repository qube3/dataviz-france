import { createBrowserRouter } from 'react-router-dom';
import { SiteLayout } from './site/SiteLayout';
import { HomePage } from './pages/HomePage';
import { VizPage } from './pages/VizPage';
import { ReelPage } from './pages/ReelPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/viz/:vizId', element: <VizPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // No SiteLayout: the reel stage is a bare 1080x1920 recording target.
  { path: '/reel/:vizId', element: <ReelPage /> },
]);
