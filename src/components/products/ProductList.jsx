import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Package, ToggleLeft, ToggleRight, Plus, Pencil, ChefHat } from 'lucide-react';
import SupplyList from '../supplies/SupplyList';
import PackagingList from './PackagingList';
import AddProductModal from './AddProductModal';
import RecipeEditor from './RecipeEditor';

const ProductList = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [iscreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Recipe Modal State
    const [recipeProduct, setRecipeProduct] = useState(null);

    const loadProducts = async () => {
        try {
            const data = await api.products.list();
            setProducts(data || []);
        } catch (e) {
            console.error("Failed to load products", e);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'products') {
            setLoading(true);
            loadProducts();
        }
    }, [activeTab]);

    return (
        <div className="mb-24 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Inventario</h2>
                    <p className="text-gray-500">{activeTab === 'products' ? 'Tus productos a la venta' : 'Tus insumos y materia prima'}</p>
                </div>

                {/* Tabs Switcher */}
                <div className="bg-gray-100 p-1 rounded-xl flex overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'products'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Catálogo
                    </button>
                    <button
                        onClick={() => setActiveTab('supplies')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'supplies'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Insumos
                    </button>
                    <button
                        onClick={() => setActiveTab('packaging')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'packaging'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Empaques
                    </button>
                </div>

                {activeTab === 'products' && (
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setIsCreateModalOpen(true);
                        }}
                        className="hidden md:flex items-center bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-yellow-600 transition-colors"
                    >
                        <Plus size={20} className="mr-2" />
                        Nuevo Producto
                    </button>
                )}
            </div>

            {activeTab === 'supplies' && <SupplyList />}
            {activeTab === 'packaging' && <PackagingList />}

            {activeTab === 'products' && (
                <>
                    {loading ? (
                        <div className="text-center py-10 text-gray-400 animate-pulse">Cargando productos...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.length === 0 && (
                                <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Package className="mx-auto text-gray-300 mb-2" size={32} />
                                    <p className="text-gray-500">No hay productos registrados</p>
                                </div>
                            )}
                            {products.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onEdit={() => {
                                        setEditingProduct(product);
                                        setIsCreateModalOpen(true);
                                    }}
                                    onOpenRecipe={() => setRecipeProduct(product)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Startup FAB for mobile */}
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setIsCreateModalOpen(true);
                        }}
                        className="md:hidden fixed bottom-24 right-4 p-4 bg-primary text-white rounded-full shadow-lg z-50"
                    >
                        <Plus size={24} />
                    </button>

                    <AddProductModal
                        isOpen={iscreateModalOpen}
                        onClose={() => {
                            setIsCreateModalOpen(false);
                            setEditingProduct(null);
                        }}
                        onProductSaved={loadProducts}
                        initialData={editingProduct}
                    />

                    <RecipeEditor
                        isOpen={!!recipeProduct}
                        onClose={() => setRecipeProduct(null)}
                        product={recipeProduct}
                        onSave={loadProducts}
                    />
                </>
            )}
        </div>
    );
};

const ProductCard = ({ product, onEdit, onOpenRecipe }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-700">
                <Package size={20} />
            </div>
            <div>
                <h3 className="font-bold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">
                    <span className="text-green-600 font-bold">${Number(product.sale_price).toFixed(2)}</span>
                    {' '}/ venta
                </p>
            </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Costo Producción:</span>
                <span className="font-bold text-gray-900">${Number(product.calculated_cost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-500">Margen:</span>
                <span className={`${(Number(product.sale_price) - Number(product.calculated_cost || 0)) > 0 ? 'text-green-600' : 'text-red-500'} font-bold`}>
                    ${(Number(product.sale_price) - Number(product.calculated_cost || 0)).toFixed(2)}
                </span>
            </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-100">
            <button
                onClick={onOpenRecipe}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-bold hover:bg-yellow-100 transition-colors"
            >
                <ChefHat size={16} /> Receta
            </button>
            <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                title="Editar Información"
            >
                <Pencil size={18} />
            </button>
            <div className={product.active ? "text-green-500" : "text-gray-300"}>
                {product.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </div>
        </div>
    </div>
);

export default ProductList;
