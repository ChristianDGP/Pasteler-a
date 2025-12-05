import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Ingredient, Product, Order, OrderStatus, UnitType } from '../types';
import { toBaseUnit, fromBaseUnit } from '../utils/conversions';

// Initial Mock Data to populate the app
const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Harina 0000', currentStock: 50000, unit: UnitType.KILOGRAMS, costPerUnit: 1.5, minStock: 10000 },
  { id: '2', name: 'Azúcar Blanca', currentStock: 8000, unit: UnitType.KILOGRAMS, costPerUnit: 2, minStock: 10000 },
  { id: '3', name: 'Huevos', currentStock: 150, unit: UnitType.UNITS, costPerUnit: 0.2, minStock: 30 },
  { id: '4', name: 'Leche Entera', currentStock: 12000, unit: UnitType.LITERS, costPerUnit: 1.2, minStock: 5000 },
  { id: '5', name: 'Chocolate Cobertura', currentStock: 2500, unit: UnitType.GRAMS, costPerUnit: 15, minStock: 3000 },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Torta de Chocolate',
    price: 35,
    description: 'Bizcocho húmedo con ganache.',
    recipe: [
      { ingredientId: '1', quantity: 500, unit: UnitType.GRAMS }, // Harina
      { ingredientId: '2', quantity: 400, unit: UnitType.GRAMS }, // Azúcar
      { ingredientId: '3', quantity: 4, unit: UnitType.UNITS },   // Huevos
      { ingredientId: '5', quantity: 200, unit: UnitType.GRAMS }, // Chocolate
      { ingredientId: '4', quantity: 250, unit: UnitType.MILLILITERS }, // Leche
    ]
  },
  {
    id: 'p2',
    name: 'Docena de Medialunas',
    price: 12,
    description: 'Clásicas de manteca.',
    recipe: [
      { ingredientId: '1', quantity: 600, unit: UnitType.GRAMS },
      { ingredientId: '2', quantity: 200, unit: UnitType.GRAMS },
      { ingredientId: '3', quantity: 2, unit: UnitType.UNITS },
      { ingredientId: '4', quantity: 300, unit: UnitType.MILLILITERS },
    ]
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'o1',
    customerName: 'Juan Pérez',
    deliveryDate: new Date().toISOString().split('T')[0], // Today
    status: 'Pendiente',
    totalPrice: 47,
    items: [
      { productId: 'p1', quantity: 1 },
      { productId: 'p2', quantity: 1 }
    ]
  }
];

interface BakeryContextType {
  ingredients: Ingredient[];
  products: Product[];
  orders: Order[];
  addIngredient: (ing: Ingredient) => void;
  updateIngredientStock: (id: string, newAmount: number, newUnitCost?: number) => void;
  addProduct: (prod: Product) => void;
  deleteProduct: (id: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
}

const BakeryContext = createContext<BakeryContextType | undefined>(undefined);

export const BakeryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In a real app, these would come from an API/DB
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  const addIngredient = (ing: Ingredient) => setIngredients(prev => [...prev, ing]);
  
  /**
   * Updates stock and calculates Weighted Average Cost (Precio Medio Ponderado)
   * @param id Ingredient ID
   * @param newAmount The Total New Stock Level (in base units)
   * @param newUnitCost (Optional) The price paid per DISPLAY unit for the ADDED stock.
   */
  const updateIngredientStock = (id: string, newAmount: number, newUnitCost?: number) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id !== id) return ing;

      // Weighted Average Cost Logic
      // Only apply if stock is increasing and a cost was provided
      if (newAmount > ing.currentStock && newUnitCost !== undefined && newUnitCost > 0) {
        const addedAmountBase = newAmount - ing.currentStock;
        
        // Convert amounts to Display Unit for cost calculation
        const currentStockDisplay = fromBaseUnit(ing.currentStock, ing.unit);
        const addedAmountDisplay = fromBaseUnit(addedAmountBase, ing.unit);
        const newTotalDisplay = fromBaseUnit(newAmount, ing.unit);

        // Value of existing stock
        const oldValue = currentStockDisplay * ing.costPerUnit;
        // Value of new purchase
        const newValue = addedAmountDisplay * newUnitCost;
        
        // New Weighted Average
        const newAverageCost = (oldValue + newValue) / newTotalDisplay;
        
        return { 
          ...ing, 
          currentStock: newAmount,
          costPerUnit: parseFloat(newAverageCost.toFixed(2))
        };
      }

      // If just correcting stock or reducing, or no price provided, keep old cost
      return { ...ing, currentStock: newAmount };
    }));
  };

  const addProduct = (prod: Product) => setProducts(prev => [...prev, prod]);

  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  
  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);

  const deleteOrder = (id: string) => setOrders(prev => prev.filter(o => o.id !== id));

  /**
   * CRITICAL LOGIC: Automatic Stock Deduction
   * When order becomes 'Completado', reduce stock.
   * If it goes back to 'Pendiente' (e.g. mistake), restore stock? 
   * For simplicity in this demo, we only deduct on 'Completado' transition.
   */
  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders => {
      const orderIndex = prevOrders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) return prevOrders;

      const order = prevOrders[orderIndex];
      const oldStatus = order.status;

      // Logic: If moving TO 'Completado' FROM a non-completed status, deduct stock.
      if (newStatus === 'Completado' && oldStatus !== 'Completado') {
        deductStockForOrder(order);
      }

      // Create new orders array
      const updatedOrders = [...prevOrders];
      updatedOrders[orderIndex] = { ...order, status: newStatus };
      return updatedOrders;
    });
  }, [products]); // Dependency on products to know recipes

  const deductStockForOrder = (order: Order) => {
    // We need to calculate total usage for this order
    const usageMap = new Map<string, number>(); // ingredientId -> amount to deduct (base units)

    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      product.recipe.forEach(recipeItem => {
        const amountPerProduct = toBaseUnit(recipeItem.quantity, recipeItem.unit);
        const totalAmount = amountPerProduct * item.quantity;
        
        const currentUsage = usageMap.get(recipeItem.ingredientId) || 0;
        usageMap.set(recipeItem.ingredientId, currentUsage + totalAmount);
      });
    });

    // Apply updates to ingredients state
    setIngredients(prevIngredients => prevIngredients.map(ing => {
      const deduction = usageMap.get(ing.id);
      if (deduction) {
        return { ...ing, currentStock: Math.max(0, ing.currentStock - deduction) };
      }
      return ing;
    }));
  };

  return (
    <BakeryContext.Provider value={{
      ingredients,
      products,
      orders,
      addIngredient,
      updateIngredientStock,
      addProduct,
      deleteProduct,
      addOrder,
      updateOrderStatus,
      deleteOrder
    }}>
      {children}
    </BakeryContext.Provider>
  );
};

export const useBakery = () => {
  const context = useContext(BakeryContext);
  if (!context) throw new Error("useBakery must be used within BakeryProvider");
  return context;
};