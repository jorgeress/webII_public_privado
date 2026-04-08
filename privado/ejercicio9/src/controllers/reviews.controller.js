import prisma from '../config/prisma.js';

export async function getBookReviews(req, res) {


  const bookId = parseInt(req.params.id);

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return res.status(404).json({ error: 'Libro no encontrado' });

  const reviews = await prisma.review.findMany({
    where: { bookId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  res.json({
    reviews,
    stats: {
      total: reviews.length,
      averageRating,
      distribution: [1, 2, 3, 4, 5].reduce((acc, rating) => {
        acc[rating] = reviews.filter((r) => r.rating === rating).length;
        return acc;
      }, {}),
    },
  });
}

export async function createReview(req, res) {


  const bookId = parseInt(req.params.id);
  const userId = req.user.id;
  const { rating, comment } = req.body;

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return res.status(404).json({ error: 'Libro no encontrado' });

  const completedLoan = await prisma.loan.findFirst({
    where: { userId, bookId, status: 'RETURNED' },
  });
  if (!completedLoan) {
    return res.status(403).json({ error: 'Solo puedes reseñar libros que hayas devuelto' });
  }

  const existingReview = await prisma.review.findUnique({
    where: { userId_bookId: { userId, bookId } },
  });
  if (existingReview) return res.status(409).json({ error: 'Ya has reseñado este libro' });

  const review = await prisma.review.create({
    data: { userId, bookId, rating: parseInt(rating), comment },
    include: {
      user: { select: { id: true, name: true } },
      book: { select: { id: true, title: true } },
    },
  });

  res.status(201).json({ message: 'Reseña creada exitosamente', review });
}

export async function deleteReview(req, res) {


  const reviewId = parseInt(req.params.id);
  const userId = req.user.id;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return res.status(404).json({ error: 'Reseña no encontrada' });

  if (review.userId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña' });
  }

  await prisma.review.delete({ where: { id: reviewId } });
  res.json({ message: 'Reseña eliminada exitosamente' });
}