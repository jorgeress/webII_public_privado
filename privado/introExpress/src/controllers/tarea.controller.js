import { tarea as tareas } from '../data/tarea.js';
import { ApiError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export const getAll = (req, res) => {
  let resultado = [...tareas];
  const { completed, priority, tag, sortBy, order } = req.query;

  if (completed !== undefined) {
    resultado = resultado.filter(t => String(t.completed) === completed);
  }
  if (priority) {
    resultado = resultado.filter(t => t.priority === priority);
  }
  if (tag) {
    resultado = resultado.filter(t => t.tags.includes(tag));
  }

  // Ordenamiento
  if (sortBy === 'dueDate') {
    resultado.sort((a, b) => {
      const dateA = new Date(a.dueDate || 0);
      const dateB = new Date(b.dueDate || 0);
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  res.json(resultado);
};

export const getById = (req, res) => {
  const t = tareas.find(item => item.id === req.params.id);
  if (!t) throw ApiError.notFound(`Tarea no encontrada`);
  res.json(t);
};

export const create = (req, res) => {
  const nuevaTarea = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tareas.push(nuevaTarea);
  res.status(201).json(nuevaTarea);
};

export const update = (req, res) => {
  const index = tareas.findIndex(t => t.id === req.params.id);
  if (index === -1) throw ApiError.notFound(`Tarea no existe`);

  tareas[index] = { 
    ...tareas[index], 
    ...req.body, 
    updatedAt: new Date().toISOString() 
  };
  res.json(tareas[index]);
};

export const remove = (req, res) => {
  const index = tareas.findIndex(t => t.id === req.params.id);
  if (index === -1) throw ApiError.notFound(`Tarea no existe`);
  tareas.splice(index, 1);
  res.status(204).end();
};

export const toggleStatus = (req, res) => {
  const t = tareas.find(item => item.id === req.params.id);
  if (!t) throw ApiError.notFound(`Tarea no encontrada`);
  t.completed = !t.completed;
  t.updatedAt = new Date().toISOString();
  res.json(t);
};