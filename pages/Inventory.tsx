import React, { useState } from 'react';
import { useBakery } from '../context/BakeryContext';
import { Ingredient, UnitType } from '../types';
import { UNIT_OPTIONS, BASE_UNITS } from '../constants';
import { formatStock, toBaseUnit, fromBaseUnit } from '../utils/conversions';
import { Plus, Search, Edit2, Save, X } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { ingredients, addIngredient, updateIngredientStock } = useBakery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [newIng, setNewIng] = useState<Partial<Ingredient>>({
    name: '',
    unit: UnitType.GRAMS,
    currentStock: 0,
    minStock: 0,
    costPerUnit: 0
  });

  const handleAdd = () => {
    if (!newIng.name || newIng.currentStock === undefined) return;
    
    // Convert entered values to base unit for storage
    const stockInBase = toBaseUnit(newIng.currentStock, newIng.unit as UnitType);
    const minStockInBase = toBaseUnit(newIng.minStock || 0, newIng.unit as UnitType);

    const ingredient: Ingredient = {
      id: Date.now().toString(),
      name: newIng.name,
      unit: newIng.unit as UnitType,
      currentStock: stockInBase,
      minStock: minStockInBase,
      costPerUnit: newIng.costPerUnit || 0
    };

    addIngredient(ingredient);
    setIsModalOpen(false);
    setNewIng({ name: '', unit: UnitType.GRAMS, currentStock: 0, minStock: 0, costPerUnit: 0 });
  };

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Inventario</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> Nuevo Ingrediente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar materia prima..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Ingrediente</th>
                <th className="px-6 py-4">Stock Actual</th>
                <th className="px-6 py-4">Punto Reposición</th>
                <th className="px-6 py-4">Unidad Base</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(ing => {
                const isLow = ing.currentStock <= ing.minStock;
                return (
                  <tr key={ing.id} className={`hover:bg-slate-50 ${isLow ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-800">{ing.name}</td>
                    <td className={`px-6 py-4 font-bold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>
                      {formatStock(ing.currentStock, ing.unit)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatStock(ing.minStock, ing.unit)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {BASE_UNITS[ing.unit]}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Ajustar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simple Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="font-bold">Nuevo Ingrediente</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input 
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  value={newIng.name}
                  onChange={e => setNewIng({...newIng, name: e.target.value})}
                  placeholder="Ej: Harina 0000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de Medida</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    value={newIng.unit}
                    onChange={e => setNewIng({...newIng, unit: e.target.value as UnitType})}
                  >
                    {UNIT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Costo Unitario</label>
                   <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    value={newIng.costPerUnit}
                    onChange={e => setNewIng({...newIng, costPerUnit: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    value={newIng.currentStock}
                    onChange={e => setNewIng({...newIng, currentStock: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Punto Reposición</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    value={newIng.minStock}
                    onChange={e => setNewIng({...newIng, minStock: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="pt-2 text-xs text-slate-500">
                * Las cantidades ingresadas se guardarán en la unidad seleccionada y se convertirán internamente si es necesario.
              </div>
              <button 
                onClick={handleAdd}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 mt-2"
              >
                Guardar Ingrediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};