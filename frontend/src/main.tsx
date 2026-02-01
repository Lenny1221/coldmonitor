import React, { Component, ErrorInfo, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string | null }> {
  state = { hasError: false, error: null as string | null }

  static getDerivedStateFromError(error: Error) {
    const msg = error?.message
    return { hasError: true, error: typeof msg === 'string' ? msg : String(error) }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '600px', margin: '2rem auto' }}>
          <h1 style={{ color: '#b91c1c', marginBottom: '1rem' }}>Er is iets misgegaan</h1>
          <p style={{ color: '#374151', marginBottom: '1rem' }}>{this.state.error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Pagina herladen
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
