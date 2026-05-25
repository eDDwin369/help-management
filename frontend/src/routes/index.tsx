/**
 * App router.
 *
 * Centralized in one file so adding new pages is a one-line change.
 * Uses react-router-dom v6 declarative routes.
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './HomePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
