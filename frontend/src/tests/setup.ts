/**
 * Vitest setup.
 *
 * - Loads @testing-library/jest-dom matchers (toBeInTheDocument etc.)
 * - Stubs `import.meta.env` so any module that pulls in the
 *   centralized config can be imported safely in tests.
 * - Cleans up the DOM after every test.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:4000');
vi.stubEnv('VITE_APP_NAME', 'Support App');
vi.stubEnv('VITE_APP_ENV', 'test');
vi.stubEnv('VITE_SENTRY_DSN', '');

afterEach(() => {
  cleanup();
});
