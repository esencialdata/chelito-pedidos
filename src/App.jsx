import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';

import ClientList from './components/clients/ClientList';
import OrdersView from './components/orders/OrdersView';

import ProductList from './components/products/ProductList';
import Settings from './components/settings/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastUpdated, setLastUpdated] = useState(() => Date.now());

  const handleTransactionAdded = () => {
    setLastUpdated(Date.now());
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard refreshTrigger={lastUpdated} />;
      case 'orders': return <OrdersView />;
      case 'clients': return <ClientList />;
      case 'products': return <ProductList />;
      case 'settings': return <Settings />;
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
