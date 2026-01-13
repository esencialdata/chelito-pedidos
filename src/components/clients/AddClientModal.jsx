import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { api } from '../../services/api';
import { User, Phone, Star } from 'lucide-react';

const AddClientModal = ({ isOpen, onClose, onClientAdded, initialData = null }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        category: 'Nuevo',
        favorite_product: '',
        zone: 'Sin Zona',
        notes: ''
    });

    React.useEffect(() => {
        if (isOpen && initialData) {
            setFormData(initialData);
        } else if (isOpen) {
            setFormData({ name: '', phone: '', category: 'Nuevo', favorite_product: '', zone: 'Sin Zona', notes: '' });
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData && initialData.id) {
                const updated = await api.customers.update(initialData.id, formData);
                onClientAdded(updated);
            } else {
                const newClient = await api.customers.create(formData);
                onClientAdded(newClient);
            }
            onClose();
            setFormData({ name: '', phone: '', category: 'Nuevo', favorite_product: '', zone: 'Sin Zona', notes: '' });
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Error al guardar cliente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Cliente" : "Nuevo Cliente"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            required
                            type="text"
                            placeholder="Ej. María González"
                            className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zona de Entrega</label>
                    <select
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-white"
                        value={formData.zone || 'Sin Zona'}
                        onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    >
                        <option value="Sin Zona">Sin Zona / Recoge en Tienda</option>
                        <option value="Centro Histórico">Centro Histórico</option>
                        <option value="Álamos / Carretas">Álamos / Carretas</option>
                        <option value="Juriquilla">Juriquilla</option>
                        <option value="El Refugio / Zibatá">El Refugio / Zibatá</option>
                        <option value="Milenio III">Milenio III</option>
                        <option value="El Pueblito">El Pueblito</option>
                        <option value="Jardines de la Hacienda">Jardines de la Hacienda</option>
                        <option value="Jurica">Jurica</option>
                        <option value="Otra">Otra</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            required
                            type="tel"
                            placeholder="Ej. 5512345678"
                            className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Comentarios (Opcional)</label>
                    <textarea
                        rows={2}
                        placeholder="Ej. Alergia a nueces, dejar en recepción..."
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <div className="flex gap-2">
                        {['Nuevo', 'Frecuente', 'VIP'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setFormData({ ...formData, category: cat })}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${formData.category === cat
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {cat === 'VIP' && <Star size={14} className="inline mr-1" />}
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 mt-6"
                >
                    {loading ? 'Guardando...' : 'Guardar Cliente'}
                </button>
            </form>
        </Modal>
    );
};

export default AddClientModal;
