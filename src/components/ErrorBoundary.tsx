/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Top-level error boundary.
 *
 * Rationale: the app had no error boundary. Any exception thrown during render
 * of any view (e.g. a chart fed a malformed metric, an unexpected `undefined`
 * in a `.map`) would unmount the entire React tree to a blank white screen with
 * no way out. The brief's hard requirement is "zero runtime crashes" and
 * "charts failing on edge cases" must not take down the app. This boundary
 * contains the failure, shows a recoverable fallback, and offers a one-tap
 * reset that also clears the volatile AI-advice cache (the most likely source
 * of a poisoned render) without touching the user's real data.
 */

import React from 'react';
import { safeRemove } from '../lib/storage';

interface Props {
  children: React.ReactNode;
  language?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // This project ships without @types/react, so the React.Component base
  // resolves to `any` and its inherited members are invisible to tsc. Declare
  // the two we use so `npm run lint` stays clean. `declare` emits nothing —
  // React provides these at runtime.
  declare props: Props;
  declare setState: (state: Partial<State>) => void;

  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface for diagnostics; in production this is where you'd ship to Sentry.
    console.error('[ErrorBoundary] render failure contained:', error, info);
  }

  private handleReset = () => {
    // Clear only the volatile derived cache, never the user's primary data.
    safeRemove('selfTrack_ai_advice');
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      /* ignore */
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isRu = (this.props.language ?? 'ru') !== 'en';
    const title = isRu ? 'Что-то пошло не так' : 'Something went wrong';
    const body = isRu
      ? 'Произошёл сбой при отрисовке экрана. Ваши данные сохранены. Попробуйте продолжить или перезагрузить приложение.'
      : 'A screen failed to render. Your data is safe. Try to continue or reload the app.';
    const tryAgain = isRu ? 'Продолжить' : 'Try again';
    const reload = isRu ? 'Перезагрузить' : 'Reload';

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#e7e4dd',
          color: '#3f3a34',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            background: '#fbfbfa',
            border: '1px solid rgba(69,26,3,0.12)',
            borderRadius: 24,
            padding: 28,
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden>⚠️</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>{title}</h1>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: '#6b6157', margin: '0 0 20px' }}>{body}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                border: 'none',
                background: '#3d1705',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {tryAgain}
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                border: '1px solid rgba(69,26,3,0.2)',
                background: 'transparent',
                color: '#3f3a34',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {reload}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
