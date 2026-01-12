import React from 'react';
import { LayoutDashboard, Users, Settings, Package, Croissant, LogOut, Calendar } from 'lucide-react';
import { TransactionFABS } from '../transactions/TransactionFABS';

const Layout = ({ children, activeTab, setActiveTab, onTransactionAdded }) => {
    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar - Desktop/Tablet */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-100 h-screen fixed left-0 top-0 z-50">
                <div className="p-8 flex items-center gap-3">
                    <img src="/logo_chelito.svg" alt="Chelito" className="h-16 w-auto" />
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    <SidebarLink
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        isActive={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                    />
                    <SidebarLink
                        icon={<Calendar size={20} />}
                        label="Agenda"
                        isActive={activeTab === 'orders'}
                        onClick={() => setActiveTab('orders')}
                    />
                    <SidebarLink
                        icon={<Users size={20} />}
                        label="Clientes"
                        isActive={activeTab === 'clients'}
                        onClick={() => setActiveTab('clients')}
                    />
                    <SidebarLink
                        icon={<Package size={20} />}
                        label="Inventario"
                        isActive={activeTab === 'products'}
                        onClick={() => setActiveTab('products')}
                    />
                    <div className="pt-8 px-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sistema</span>
                    </div>
                    <SidebarLink
                        icon={<Settings size={20} />}
                        label="Configuración"
                        isActive={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                    />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users size={14} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">Panadero Jefe</p>
                            <p className="text-xs text-gray-500">Cerrar Sesión</p>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 bg-white p-4 shadow-sm z-50 flex items-center justify-center border-b border-gray-100">
                <img src="/logo_chelito.svg" alt="Chelito" className="h-12 w-auto" />
            </header>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 bg-background min-h-screen">
                <div className="max-w-7xl mx-auto h-full">
                    {children}
                </div>
            </main>

            <TransactionFABS onTransactionAdded={onTransactionAdded} />

            {/* Bottom Nav - Mobile Only */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe">
                <div className="flex justify-around items-center h-16">
                    <NavButton
                        icon={<LayoutDashboard size={24} />}
                        label="Inicio"
                        isActive={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                    />
                    <NavButton
                        icon={<Calendar size={24} />}
                        label="Agenda"
                        isActive={activeTab === 'orders'}
                        onClick={() => setActiveTab('orders')}
                    />
                    <NavButton
                        icon={<Users size={24} />}
                        label="Clientes"
                        isActive={activeTab === 'clients'}
                        onClick={() => setActiveTab('clients')}
                    />
                    <NavButton
                        icon={<Package size={24} />}
                        label="Stock"
                        isActive={activeTab === 'products'}
                        onClick={() => setActiveTab('products')}
                    />
                </div>
            </nav>
        </div>
    );
};

const SidebarLink = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 font-medium text-sm
            ${isActive
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
    >
        {icon}
        <span>{label}</span>
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
    </button>
);

const NavButton = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary font-bold' : 'text-gray-500'
            }`}
    >
        {icon}
        <span className="text-xs">{label}</span>
    </button>
);

export default Layout;
