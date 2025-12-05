import React, { useState } from 'react';
import { useBakery } from '../context/BakeryContext';
import { Product, RecipeItem, UnitType, Ingredient } from '../types';
import { UNIT_OPTIONS } from '../constants';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatStock } from '../utils/conversions';

export const Recipes: React.FC = () => {
  const { products, ingredients, addProduct } = useBakery();
  const [isCreating, setIsCreating] = useState(false);
  
  // New Product State
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState(0);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  
  // Temp state for adding ingredient to recipe
  const [selectedIngId, setSelectedIngId] = useState('');
  const [amount, setAmount] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<UnitType>(UnitType.GRAMS);

  const handleAddIngredient = () => {
    if(!selectedIngId || amount <= 0) return;
    
    // Find unit logic: prefer selected, default to ingredient's unit
    setRecipeItems([...recipeItems, {
      ingredientId: selectedIngId,
      quantity: amount,
      unit: selectedUnit
    }]);
    
    setAmount(0);
    setSelectedIngId('');
  };

  const handleSaveProduct = () => {
    if(!productName || recipeItems.length === 0) return;
    const newProd: Product = {
      id: Date.now().toString(),
      name: productName,
      price: productPrice,
      recipe: recipeItems
    };
    addProduct(newProd);
    setIsCreating(false);
    setProductName('');
    setProductPrice(0);
    setRecipeItems([]);
  };

  // Cost Estimation
  const calculateEstimatedCost = (items: RecipeItem[]) => {
    return items.reduce((acc, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if(!ing) return acc;
      // Note: This is a simplified cost calc. Real world needs normalized unit cost.
      // Assuming costPerUnit is based on the ingredient's DISPLAY unit for simplicity in this demo.
      return acc + (item.quantity * (ing.costPerUnit || 0)); 
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Recetas y Productos</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
        >
          {isCreating ? 'Cancelar' : <><Plus size={18} /> Nuevo Producto</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg space-y-6">
          <h3 className="font-bold text-lg text-slate-800">Crear Nueva Receta</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label text-sm text-slate-500">Nombre del Producto</label>
              <input 
                className="w-full p-2 border rounded" 
                value={productName} 
                onChange={e => setProductName(e.target.value)} 
                placeholder="Ej: Tarta de Frutilla"
              />
            </div>
            <div>
              <label className="label text-sm text-slate-500">Precio de Venta ($)</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded" 
                value={productPrice} 
                onChange={e => setProductPrice(Number(e.target.value))} 
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium text-slate-700 mb-3">Ingredientes de la Receta (para 1 unidad)</h4>
            
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <select 
                className="flex-1 p-2 border rounded"
                value={selectedIngId}
                onChange={e => {
                  const ing = ingredients.find(i => i.id === e.target.value);
                  setSelectedIngId(e.target.value);
                  if(ing) setSelectedUnit(ing.unit);
                }}
              >
                <option value="">-- Seleccionar Ingrediente --</option>
                {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              
              <input 
                type="number" 
                className="w-24 p-2 border rounded" 
                placeholder="Cant."
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
              />
              
              <select 
                className="w-32 p-2 border rounded"
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value as UnitType)}
              >
                {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
              
              <button 
                onClick={handleAddIngredient}
                disabled={!selectedIngId}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-slate-300"
              >
                <Plus size={18} />
              </button>
            </div>

            {recipeItems.length > 0 && (
               <ul className="space-y-2 mb-2">
                 {recipeItems.map((item, idx) => {
                   const ingName = ingredients.find(i => i.id === item.ingredientId)?.name;
                   return (
                     <li key={idx} className="flex justify-between items-center bg-white p-2 border rounded shadow-sm">
                       <span>{ingName}</span>
                       <div className="flex items-center gap-4">
                         <span className="font-bold text-slate-600">{item.quantity} {item.unit}</span>
                         <button onClick={() => setRecipeItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={16} /></button>
                       </div>
                     </li>
                   )
                 })}
               </ul>
            )}
            {recipeItems.length > 0 && (
                <div className="text-right text-sm text-slate-500 mt-2">
                    Costo Estimado: <span className="font-bold text-slate-800">${calculateEstimatedCost(recipeItems).toFixed(2)}</span> (Solo referencia)
                </div>
            )}
          </div>

          <button 
            onClick={handleSaveProduct}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md"
          >
            Guardar Receta
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} ingredients={ingredients} />
        ))}
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product, ingredients: Ingredient[] }> = ({ product, ingredients }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div>
                    <h3 className="font-bold text-slate-800">{product.name}</h3>
                    <p className="text-slate-500 text-sm">{product.recipe.length} ingredientes</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-green-700">${product.price}</span>
                    {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>
            {expanded && (
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Fórmula (Unitario)</h4>
                    <ul className="space-y-1 text-sm">
                        {product.recipe.map((r, i) => {
                            const ing = ingredients.find(ing => ing.id === r.ingredientId);
                            return (
                                <li key={i} className="flex justify-between text-slate-700">
                                    <span>{ing?.name || 'Desconocido'}</span>
                                    <span>{r.quantity} {r.unit}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}