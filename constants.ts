import { UnitType } from './types';

// Normalized Base Units:
// g -> g
// kg -> 1000g
// ml -> ml
// L -> 1000ml
// u -> u

export const BASE_UNITS = {
  [UnitType.GRAMS]: 'g',
  [UnitType.KILOGRAMS]: 'g',
  [UnitType.MILLILITERS]: 'ml',
  [UnitType.LITERS]: 'ml',
  [UnitType.UNITS]: 'u',
};

export const UNIT_OPTIONS = [
  { value: UnitType.GRAMS, label: 'Gramos (g)' },
  { value: UnitType.KILOGRAMS, label: 'Kilogramos (kg)' },
  { value: UnitType.MILLILITERS, label: 'Mililitros (ml)' },
  { value: UnitType.LITERS, label: 'Litros (L)' },
  { value: UnitType.UNITS, label: 'Unidades (u)' },
];

export const STATUS_COLORS = {
  'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'En Proceso': 'bg-blue-100 text-blue-800 border-blue-200',
  'Completado': 'bg-green-100 text-green-800 border-green-200',
  'Entregado': 'bg-slate-800 text-white border-slate-600',
  'Cancelado': 'bg-red-100 text-red-800 border-red-200 decoration-line-through',
};