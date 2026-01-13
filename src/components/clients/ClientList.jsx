import React, { useEffect, useState } from 'react';
import { MessageCircle, Phone, Star, UserPlus, Pencil } from 'lucide-react';
import { api } from '../../services/api';
import AddClientModal from './AddClientModal';

const ClientList = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState('Todas');
    const [editingClient, setEditingClient] = useState(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await api.customers.list();
            setClients(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = selectedZone === 'Todas'
        ? clients
        : clients.filter(c => c.zone === selectedZone);

    const zones = ['Todas', 'Centro Histórico', 'Álamos / Carretas', 'Juriquilla', 'El Refugio / Zibatá', 'Milenio III', 'El Pueblito', 'Jardines de la Hacienda', 'Jurica', 'Otra', 'Sin Zona'];

    // Find most active zone
    const zoneCounts = clients.reduce((acc, client) => {
        const z = client.zone || 'Sin Zona';
        acc[z] = (acc[z] || 0) + 1;
        return acc;
    }, {});
    const topZone = Object.keys(zoneCounts).sort((a, b) => zoneCounts[b] - zoneCounts[a])[0];


    if (loading) return <div className="p-8 text-center animate-pulse">Cargando clientes...</div>;

    return (
        <div className="space-y-6 mb-40 max-w-7xl mx-auto pb-32">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Directorio de Clientes</h2>
                    <p className="text-gray-500">Gestiona tus clientes leales</p>
                    {topZone && clients.length > 0 && (
                        <p className="text-xs font-bold text-primary mt-1">🔥 Zona más activa: {topZone} ({zoneCounts[topZone]} clientes)</p>
                    )}
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="hidden md:flex items-center bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-yellow-600 transition-colors">
                    <UserPlus size={20} className="mr-2" />
                    Nuevo Cliente
                </button>
            </div>

            {/* Zone Filter - Dropdown */}
            <div className="relative">
                <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg font-medium text-gray-700 shadow-sm appearance-none outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                    {zones.map(zone => (
                        <option key={zone} value={zone}>
                            {zone === 'Todas' ? '📍 Filtrar por Zona: Todas' : `📍 Zona: ${zone}`}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.length === 0 ? (
                    <div className="col-span-full text-center py-10 opacity-50">No hay clientes en esta zona.</div>
                ) : filteredClients.map(client => (
                    <ClientCard
                        key={client.id}
                        client={client}
                        onEdit={() => {
                            setEditingClient(client);
                            setIsModalOpen(true);
                        }}
                    />
                ))}
            </div>

            <button
                onClick={() => setIsModalOpen(true)}
                className="md:hidden fixed bottom-24 right-4 p-4 bg-primary text-white rounded-full shadow-lg z-50"
            >
                <UserPlus size={24} />
            </button>

            <AddClientModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingClient(null);
                }}
                onClientAdded={loadClients}
                initialData={editingClient}
            />
        </div>
    );
};

const ClientCard = ({ client, onEdit }) => {
    // Logic for Frequency Badge
    // 1 = Nuevo, 2-4 = Recurrente, 5+ = Fan VIP
    const orders = client.total_orders || 0;

    let badge = { text: 'NUEVO', color: 'bg-blue-100 text-blue-700' };
    if (orders >= 5) badge = { text: 'FAN VIP', color: 'bg-yellow-100 text-yellow-800 border border-yellow-200' };
    else if (orders >= 2) badge = { text: 'RECURRENTE', color: 'bg-orange-100 text-orange-700' };

    const handleWhatsApp = () => {
        const phone = client.phone ? client.phone.replace(/\D/g, '') : '';
        const text = encodeURIComponent(`Hola, ${client.name} soy Chelito, es un gusto saludarte el día de hoy 😃`);
        if (phone) window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                <div className="flex flex-col w-full">
                    <span className={`self-start text-[10px] font-black tracking-wider px-2 py-1 rounded-md mb-2 ${badge.color}`}>
                        {badge.text}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight break-words">{client.name}</h3>
                    <span className="text-xs text-gray-400 font-medium mt-1">
                        📍 {client.zone || 'Sin Zona'} • {orders} Pedidos
                    </span>
                    {client.notes && (
                        <div className="mt-2 bg-yellow-50 p-2 rounded-lg text-xs text-yellow-800 border border-yellow-100 italic">
                            📝 {client.notes}
                        </div>
                    )}
                </div>
                {/* Visual Category Star if manually set to VIP too */}
                {client.category === 'VIP' && <Star size={20} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                    {client.favorite_product ? (
                        <span className="flex items-center">❤️ {client.favorite_product}</span>
                    ) : <span>Sin favorito aún</span>}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Editar cliente"
                    >
                        <Pencil size={20} />
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="p-3 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                        aria-label="Enviar WhatsApp"
                    >
                        <MessageCircle size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientList;
