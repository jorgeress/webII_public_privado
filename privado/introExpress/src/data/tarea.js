import { v4 as uuidv4 } from 'uuid';

export let tarea = [
  {
    id: uuidv4(),
    title: "Finalizar API Profesional",
    description: "Implementar Zod y filtros avanzados",
    priority: "high",
    completed: false,
    dueDate: "2026-12-31T23:59:59Z",
    tags: ["backend", "express"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];