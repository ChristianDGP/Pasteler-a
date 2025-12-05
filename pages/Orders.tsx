import React, { useState } from 'react';
import { useBakery } from '../context/BakeryContext';
import { Order, OrderStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Plus, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const Orders: React.FC = () => {
  const { orders, products, addOrder, updateOrderStatus } = useBakery();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Order State
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<{productId: string, quantity: number}[]>([]);
  
  // Error state for validation
  const [error, setError] = useState('');

  const addToCart = () => {
    if(!selectedProduct) return;
    setCart([...cart, { productId: selectedProduct, quantity: qty }]);
    setSelectedProduct('');
    setQty(1);
    setError(''); // Clear error when user takes action
  };
  
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  const handleCreateOrder = () => {
    setError('');
    
    // Validations
    if(!customer.trim()) {
      setError('Por favor ingresa el nombre del cliente.');
      return;
    }
    if(!date) {
      setError('Por favor selecciona una fecha de entrega.');
      return;
    }
    if(cart.length === 0) {
      setError('Debes agregar al menos un producto a la lista con el botón "+".');
      return;
    }
    
    // Calculate total
    let total = 0;
    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if(p) total += p.price * item.quantity;
    });

    const newOrder: Order = {
      id: Date.now().toString(),
      customerName: customer,
      deliveryDate: date,
      status: 'Pendiente',
      items: cart,
      totalPrice: total
    };

    addOrder(newOrder);
    closeModal();
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCart([]);
    setCustomer('');
    setDate('');
    setError('');
    setSelectedProduct('');
    setQty(1);
  };

  const statusOptions: OrderStatus[] = ['Pendiente', 'En Proceso', 'Completado', 'Entregado', 'Cancelado'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Pedidos</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
        >
          <Plus size={18} /> Nuevo Pedido
        </button>
      </div>

      <div className="grid gap-4">
        {orders.length === 0 && <p className="text-center text-slate-400 py-10">No hay pedidos registrados.</p>}
        {orders.map(order => (
          <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                 <h3 className={`font-bold text-lg ${order.status === 'Cancelado' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {order.customerName}
                 </h3>
                 <span className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock size={14} /> {order.deliveryDate}
                 </span>
              </div>
              <ul className="mt-2 text-sm text-slate-600 space-y-1">
                {order.items.map((item, idx) => {
                  const pName = products.find(p => p.id === item.productId)?.name;
                  return <li key={idx} className="flex gap-2"><span>{item.quantity}x</span> <span>{pName}</span></li>
                })}
              </ul>
              <div className="mt-2 font-bold text-slate-800">Total: ${order.totalPrice}</div>
            </div>

            <div className="flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4 min-w-[200px]">
              <label className="text-xs text-slate-400 font-semibold uppercase">Estado</label>
              <select 
                className={`p-2 rounded-lg border text-sm font-medium ${STATUS_COLORS[order.status]}`}
                value={order.status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {order.status === 'Entregado' && '✓ Venta registrada'}
                {order.status === 'Cancelado' && '✕ Venta perdida'}
                {order.status === 'Completado' && '✓ Stock descontado'}
                {order.status === 'Pendiente' && '• En espera'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="font-bold">Nuevo Pedido</h3>
              <button onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700">Cliente</label>
                  <input 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={customer} 
                    onChange={e => setCustomer(e.target.value)} 
                    placeholder="Nombre del cliente"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700">Fecha de Entrega</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                  />
               </div>

               <div className="bg-slate-50 p-4 rounded-lg">
                 <h4 className="font-medium text-slate-700 mb-2">Agregar Productos</h4>
                 <div className="flex gap-2 mb-2">
                    <select 
                        className="flex-1 p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={selectedProduct} 
                        onChange={e => setSelectedProduct(e.target.value)}
                    >
                        <option value="">Seleccionar Producto...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                    </select>
                    <input 
                        type="number" 
                        min="1"
                        className="w-20 p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={qty} 
                        onChange={e => setQty(Math.max(1, Number(e.target.value)))} 
                    />
                    <button 
                        onClick={addToCart} 
                        className="bg-slate-800 text-white p-2 rounded hover:bg-slate-900 transition-colors"
                        disabled={!selectedProduct}
                    >
                        <Plus size={18} />
                    </button>
                 </div>
                 
                 <div className="space-y-1">
                    {cart.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-2">No hay productos en la lista</p>
                    )}
                    {cart.map((item, i) => {
                        const pName = products.find(p => p.id === item.productId)?.name;
                        return (
                            <div key={i} className="flex justify-between text-sm bg-white p-2 rounded shadow-sm border border-slate-100">
                                <span>{item.quantity}x {pName}</span>
                                <button onClick={() => removeFromCart(i)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                            </div>
                        )
                    })}
                 </div>
               </div>

               {error && (
                 <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                   <AlertCircle size={16} className="shrink-0" />
                   {error}
                 </div>
               )}

               <button 
                onClick={handleCreateOrder} 
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md"
               >
                Confirmar Pedido
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};