import { usuarios } from '../data/usuarios.js'; // Asegúrate de crear este array
import { ApiError } from '../middleware/errorHandler.js';

export const getAll = (req, res) => {
  res.json(usuarios);
};

export const getById = (req, res) => {
  const id = parseInt(req.params.id);
  const usuario = usuarios.find(u => u.id === id);
  
  if (!usuario) {
    throw ApiError.notFound(`Usuario con ID ${id} no encontrado`);
  }
  res.json(usuario);
};

export const create = (req, res) => {
  const nuevoUsuario = {
    id: usuarios.length + 1,
    ...req.body
  };
  usuarios.push(nuevoUsuario);
  res.status(201).json(nuevoUsuario);
};

export const update = (req, res) => {
  const id = parseInt(req.params.id);
  const index = usuarios.findIndex(u => u.id === id);

  if (index === -1) throw ApiError.notFound(`ID ${id} no existe`);

  usuarios[index] = { id, ...req.body };
  res.json(usuarios[index]);
};

export const remove = (req, res) => {
  const id = parseInt(req.params.id);
  const index = usuarios.findIndex(u => u.id === id);

  if (index === -1) throw ApiError.notFound(`ID ${id} no existe`);

  usuarios.splice(index, 1);
  res.status(204).end();
};