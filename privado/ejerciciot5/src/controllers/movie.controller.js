import Movie from '../models/movie.model.js';
import { handleHttpError, asyncHandler } from '../utils/handleError.js';
import fs from 'fs';
import path from 'path';

export const getItems = asyncHandler(async (req, res) => {
  const { genre, search } = req.query;
  let query = {};
  if (genre) query.genre = genre;
  if (search) query.title = { $regex: search, $options: 'i' };

  const data = await Movie.find(query);
  res.send({ data });
});

export const getItem = asyncHandler(async (req, res) => {
  const data = await Movie.findById(req.params.id);
  if (!data) return handleHttpError(res, 'MOVIE_NOT_FOUND', 404);
  res.send({ data });
});

export const createItem = asyncHandler(async (req, res) => {
  
  const data = await Movie.create(req.body);
  res.status(201).send({ data });
});

export const updateItem = asyncHandler(async (req, res) => {
  const data = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.send({ data });
});

export const deleteItem = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return handleHttpError(res, 'MOVIE_NOT_FOUND', 404);

  if (movie.cover) {
    const filePath = path.join(process.cwd(), 'storage', movie.cover);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await Movie.deleteOne({ _id: req.params.id });
  res.send({ message: 'Movie deleted successfully' });
});

export const rentMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return handleHttpError(res, 'MOVIE_NOT_FOUND', 404);
  if (movie.availableCopies === 0) return handleHttpError(res, 'NO_COPIES_AVAILABLE', 400);

  movie.availableCopies -= 1;
  movie.timesRented += 1;
  await movie.save();
  res.send({ data: movie });
});

export const returnMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return handleHttpError(res, 'MOVIE_NOT_FOUND', 404);

  if (movie.availableCopies < movie.copies) {
    movie.availableCopies += 1;
    await movie.save();
  }
  res.send({ data: movie });
});

export const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) return handleHttpError(res, 'NO_FILE_UPLOADED', 400);
  
  const movie = await Movie.findById(req.params.id);
  if (!movie) return handleHttpError(res, 'MOVIE_NOT_FOUND', 404);

  if (movie.cover) {
    const oldPath = path.join(process.cwd(), 'storage', movie.cover);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  movie.cover = req.file.filename;
  await movie.save();
  res.send({ data: movie });
});

export const getCover = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie || !movie.cover) return handleHttpError(res, 'COVER_NOT_FOUND', 404);
  res.sendFile(path.join(process.cwd(), 'storage', movie.cover));
});

export const getTopStats = asyncHandler(async (req, res) => {
  const data = await Movie.find().sort({ timesRented: -1 }).limit(5);
  res.send({ data });
});

