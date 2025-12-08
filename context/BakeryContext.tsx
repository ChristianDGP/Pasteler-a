import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Ingredient, Product, Order, OrderStatus, UnitType, Customer } from '../types';
import { toBaseUnit, fromBaseUnit } from '../utils/conversions';

// Initial Mock Data (Used only if LocalStorage is empty)
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

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Juan Pérez', phone: '555-0101', email: 'juan@example.com', address: 'Calle Falsa 123' },
  { id: 'c2', name: 'Maria Gomez', phone: '555-0202', address: 'Av. Libertador 400' }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'o1',
    customerId: 'c1',
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
  customers: Customer[];
  
  addIngredient: (ing: Ingredient) => void;
  updateIngredientStock: (id: string, newAmount: number, newUnitCost?: number) => void;
  
  addProduct: (prod: Product) => void;
  deleteProduct: (id: string) => void;
  
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;

  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
}

const BakeryContext = createContext<BakeryContextType | undefined>(undefined);

// Helper to load from LocalStorage
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.error(`Error loading key ${key}`, e);
    return fallback;
  }
};

export const BakeryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage or Fallback
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => loadFromStorage('bakery_ingredients', INITIAL_INGREDIENTS));
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage('bakery_products', INITIAL_PRODUCTS));
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('bakery_orders', INITIAL_ORDERS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage('bakery_customers', INITIAL_CUSTOMERS));

  // Persistence Effects
  useEffect(() => { localStorage.setItem('bakery_ingredients', JSON.stringify(ingredients)); }, [ingredients]);
  useEffect(() => { localStorage.setItem('bakery_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('bakery_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('bakery_customers', JSON.stringify(customers)); }, [customers]);

  /* --- INGREDIENTS --- */
  const addIngredient = (ing: Ingredient) => setIngredients(prev => [...prev, ing]);
  
  const updateIngredientStock = (id: string, newAmount: number, newUnitCost?: number) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id !== id) return ing;

      // Weighted Average Cost Logic
      if (newAmount > ing.currentStock && newUnitCost !== undefined && newUnitCost > 0) {
        const addedAmountBase = newAmount - ing.currentStock;
        const currentStockDisplay = fromBaseUnit(ing.currentStock, ing.unit);
        const addedAmountDisplay = fromBaseUnit(addedAmountBase, ing.unit);
        const newTotalDisplay = fromBaseUnit(newAmount, ing.unit);

        const oldValue = currentStockDisplay * ing.costPerUnit;
        const newValue = addedAmountDisplay * newUnitCost;
        
        const newAverageCost = newTotalDisplay > 0 ? (oldValue + newValue) / newTotalDisplay : ing.costPerUnit;
        
        return { 
          ...ing, 
          currentStock: newAmount,
          costPerUnit: parseFloat(newAverageCost.toFixed(2))
        };
      }
      return { ...ing, currentStock: newAmount };
    }));
  };

  /* --- PRODUCTS --- */
  const addProduct = (prod: Product) => setProducts(prev => [...prev, prod]);
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  
  /* --- CUSTOMERS --- */
  const addCustomer = (customer: Customer) => setCustomers(prev => [...prev, customer]);
  const updateCustomer = (updated: Customer) => setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
  const deleteCustomer = (id: string) => setCustomers(prev => prev.filter(c => c.id !== id));

  /* --- ORDERS --- */
  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);
  const deleteOrder = (id: string) => setOrders(prev => prev.filter(o => o.id !== id));

  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders => {
      const orderIndex = prevOrders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) return prevOrders;

      const order = prevOrders[orderIndex];
      const oldStatus = order.status;

      // Deduct stock only when moving TO Completed from a non-completed state
      if (newStatus === 'Completado' && oldStatus !== 'Completado') {
        deductStockForOrder(order);
      }

      const updatedOrders = [...prevOrders];
      updatedOrders[orderIndex] = { ...order, status: newStatus };
      return updatedOrders;
    });
  }, [products]); 

  const deductStockForOrder = (order: Order) => {
    const usageMap = new Map<string, number>(); 

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
      customers,
      addIngredient,
      updateIngredientStock,
      addProduct,
      deleteProduct,
      addOrder,
      updateOrderStatus,
      deleteOrder,
      addCustomer,
      updateCustomer,
      deleteCustomer
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