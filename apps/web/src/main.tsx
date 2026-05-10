/**
 * Hermes web entry point.
 * Mounts the React app and imports global CSS tokens.
 *
 * Phase 06 hard cut: boots the feature catalog from `/api/v1/features`
 * before rendering. Render proceeds even on fetch failure — Feature
 * Store routes will show <FeaturesUnavailable /> in that case.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/colors-and-type.css';
import './theme-tokens.css';
import App from './App';
import { ThemeProvider } from './utils/theme-provider';
import { I18nProvider } from './i18n/i18n-provider';
import { bootFeatureLoader, _setLoadedFeatures } from './data/catalog/features/index';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found in DOM');

void bootFeatureLoader({
  onReady: (features) => {
    _setLoadedFeatures(features);
  },
}).then(() => {
  createRoot(rootEl).render(
    <React.StrictMode>
      <ThemeProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
});
