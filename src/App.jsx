import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';

import ClientList from './components/clients/ClientList';
import OrdersView from './components/orders/OrdersView';

import ProductList from './components/products/ProductList';
import Settings from './components/settings/Settings';
import ReportsView from './components/reports/ReportsView';
import ProductionView from './components/production/ProductionView';

// Simple Login Component
const LoginScreen = ({ onLogin }) => {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pass === 'chelitoysantiago') {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <img src="/app_icon.svg" className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-sm" alt="Logo" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido a CDM</h1>
        <p className="text-gray-500 mb-6 text-sm">Ingresa tu clave de acceso</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="password"
            value={pass}
            onChange={e => { setPass(e.target.value); setError(false); }}
            placeholder="Clave de acceso"
            className={`w-full p-4 rounded-xl border text-center text-lg outline-none transition-all ${error ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-200 focus:ring-2 focus:ring-primary'}`}
          />
          {error && <p className="text-red-500 text-xs font-bold animate-pulse">Clave incorrecta</p>}
          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/20"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('cdm_auth_token') === 'chelitoysantiago';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastUpdated, setLastUpdated] = useState(() => Date.now());

  const handleLogin = () => {
    localStorage.setItem('cdm_auth_token', 'chelitoysantiago');
    setIsAuthenticated(true);
  };

  const handleTransactionAdded = () => {
    setLastUpdated(Date.now());
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard refreshTrigger={lastUpdated} />;
      case 'orders': return <OrdersView />;
      case 'clients': return <ClientList />;
      case 'products': return <ProductList />;
      case 'settings': return <Settings />;
      case 'reports': return <ReportsView />;
      case 'production': return <ProductionView />;
      default: return <Dashboard refreshTrigger={lastUpdated} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onTransactionAdded={handleTransactionAdded}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
