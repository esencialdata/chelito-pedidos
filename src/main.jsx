import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-600">
          <h1 className="text-xl font-bold mb-2">Algo salió mal</h1>
          <pre className="bg-red-50 p-4 rounded text-left overflow-auto text-sm">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
          >
            Borrar Datos y Reiniciar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
