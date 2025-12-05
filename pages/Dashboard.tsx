import React from 'react';
import { useBakery } from '../context/BakeryContext';
import { AlertTriangle, TrendingUp, ShoppingBag, Clock, DollarSign, XCircle, CheckCircle2 } from 'lucide-react';
import { formatStock } from '../utils/conversions';

export const Dashboard: React.FC = () => {
  const { ingredients, orders } = useBakery();

  // Low Stock Logic
  const lowStockItems = ingredients.filter(ing => ing.currentStock <= ing.minStock);

  // Order Stats
  const pendingOrders = orders.filter(o => o.status === 'Pendiente').length;
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.deliveryDate === today).length;

  // Financial Stats
  // 1. Ventas Efectivas: Solo pedidos 'Entregado'
  const deliveredOrders = orders.filter(o => o.status === 'Entregado');
  const totalRevenue = deliveredOrders.reduce((acc, order) => acc + order.totalPrice, 0);

  // 2. Ventas Perdidas: Pedidos 'Cancelado'
  const cancelledOrders = orders.filter(o => o.status === 'Cancelado');
  const lostRevenue = cancelledOrders.reduce((acc, order) => acc + order.totalPrice, 0);

  // Stats calculation
  const totalProcessedValue = totalRevenue + lostRevenue;
  const successRate = totalProcessedValue > 0 ? (totalRevenue / totalProcessedValue) * 100 : 100;

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
        <p className="text-slate-500">Resumen operativo y financiero.</p>
      </header>

      {/* Financial Summary Section */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4 opacity-80">
          <DollarSign className="text-emerald-400" />
          <span className="uppercase tracking-wider text-sm font-semibold">Balance Financiero</span>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <div>
             <p className="text-sm text-slate-300 mb-1">Ventas Efectivas (Entregado)</p>
             <p className="text-3xl font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
             <div className="flex items-center gap-1 mt-1 text-xs text-emerald-200/70">
                <CheckCircle2 size={12} /> {deliveredOrders.length} pedidos cobrados
             </div>
          </div>
          
          <div className="border-l border-white/10 pl-8">
             <p className="text-sm text-slate-300 mb-1">Pérdidas / Cancelados</p>
             <p className="text-2xl font-bold text-red-400">${lostRevenue.toLocaleString()}</p>
             <div className="flex items-center gap-1 mt-1 text-xs text-red-200/70">
                <XCircle size={12} /> {cancelledOrders.length} pedidos no concretados
             </div>
          </div>
        </div>

        {lostRevenue > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs mb-1">
              <span>Tasa de Efectividad</span>
              <span>{successRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-yellow-100 rounded-full text-yellow-600 mb-2"><ShoppingBag size={20} /></div>
          <span className="text-xs text-slate-500 font-medium">Pendientes</span>
          <p className="text-xl font-bold text-slate-800">{pendingOrders}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600 mb-2"><Clock size={20} /></div>
          <span className="text-xs text-slate-500 font-medium">Para Hoy</span>
          <p className="text-xl font-bold text-slate-800">{todayOrders}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-red-100 rounded-full text-red-600 mb-2"><AlertTriangle size={20} /></div>
          <span className="text-xs text-slate-500 font-medium">Stock Bajo</span>
          <p className="text-xl font-bold text-slate-800">{lowStockItems.length}</p>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Alertas de Stock
          </h3>
          {lowStockItems.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
              {lowStockItems.length}
            </span>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center text-slate-400">
              <CheckCircle2 size={32} className="mb-2 text-emerald-100" />
              <p>Todo el inventario está bajo control.</p>
            </div>
          ) : (
            lowStockItems.map(item => {
               // Calculate percentage for progress bar
               const max = item.minStock * 2; // Arbitrary max for visual context
               const pct = Math.min(100, (item.currentStock / max) * 100);
               
               return (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <span className="text-sm font-bold text-red-600">{formatStock(item.currentStock, item.unit)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                    <span>Mínimo requerido: {formatStock(item.minStock, item.unit)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(5, pct)}%` }}
                    ></div>
                  </div>
                </div>
               );
            })
          )}
        </div>
      </div>
    </div>
  );
};