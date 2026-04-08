import prisma from '../config/prisma.js';

export async function getBooks(req, res) {
  const { genre, author, available, search, page = 1, limit = 10 } = req.validated?.query || req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  const where = {};

  if (genre) where.genre = { contains: genre, mode: 'insensitive' };
  if (author) where.author = { contains: author, mode: 'insensitive' };
  if (available === 'true') where.available = { gt: 0 };
  if (search) where.OR = [
    { title: { contains: search, mode: 'insensitive' } },
    { author: { contains: search, mode: 'insensitive' } },
    { isbn: { contains: search } },
  ];

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where, skip, take,
      orderBy: { title: 'asc' },
      include: { _count: { select: { reviews: true, loans: true } }, reviews: { select: { rating: true } } },
    }),
    prisma.book.count({ where }),
  ]);

  const booksWithRating = books.map(({ reviews, ...book }) => ({
    ...book,
    averageRating: reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null,
  }));

  res.json({ data: booksWithRating, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } });
}

export async function getBook(req, res) {


  const book = await prisma.book.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      reviews: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      _count: { select: { loans: true } },
    },
  });

  if (!book) return res.status(404).json({ error: 'Libro no encontrado' });

  const averageRating = book.reviews.length > 0
    ? Math.round((book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length) * 10) / 10
    : null;

  res.json({ ...book, averageRating });
}

export async function createBook(req, res) {


  const { isbn, title, author, genre, description, publishedYear, copies } = req.body;
  const book = await prisma.book.create({
    data: { isbn, title, author, genre, description, publishedYear: parseInt(publishedYear), copies: parseInt(copies), available: parseInt(copies) },
  });

  res.status(201).json({ message: 'Libro creado exitosamente', book });
}

export async function updateBook(req, res) {


  const bookId = parseInt(req.params.id);
  const existingBook = await prisma.book.findUnique({ where: { id: bookId } });
  if (!existingBook) return res.status(404).json({ error: 'Libro no encontrado' });

  const updateData = {};
  const fields = ['title', 'author', 'genre', 'description', 'publishedYear', 'copies', 'available'];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updateData[field] = ['publishedYear', 'copies', 'available'].includes(field)
        ? parseInt(req.body[field]) : req.body[field];
    }
  }

  const newCopies = updateData.copies ?? existingBook.copies;
  const newAvailable = updateData.available ?? existingBook.available;
  if (newAvailable > newCopies) {
    return res.status(400).json({ error: 'Los disponibles no pueden superar el total de ejemplares' });
  }

  const book = await prisma.book.update({ where: { id: bookId }, data: updateData });
  res.json({ message: 'Libro actualizado exitosamente', book });
}

export async function deleteBook(req, res) {

  const bookId = parseInt(req.params.id);
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return res.status(404).json({ error: 'Libro no encontrado' });

  const activeLoans = await prisma.loan.count({ where: { bookId, status: 'ACTIVE' } });
  if (activeLoans > 0) return res.status(409).json({ error: 'No se puede eliminar: tiene préstamos activos' });

  await prisma.book.delete({ where: { id: bookId } });
  res.json({ message: 'Libro eliminado exitosamente' });
}