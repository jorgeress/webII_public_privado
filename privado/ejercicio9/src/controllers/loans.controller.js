import prisma from '../config/prisma.js';

const MAX_ACTIVE_LOANS = 3;
const LOAN_DAYS = 14;

export async function getMyLoans(req, res) {
  const loans = await prisma.loan.findMany({
    where: { userId: req.user.id },
    include: {
      book: {
        select: { id: true, title: true, author: true, isbn: true, genre: true },
      },
    },
    orderBy: { loanDate: 'desc' },
  });

  const now = new Date();
  const overdueIds = loans
    .filter((l) => l.status === 'ACTIVE' && l.dueDate < now)
    .map((l) => l.id);

  if (overdueIds.length > 0) {
    await prisma.loan.updateMany({
      where: { id: { in: overdueIds } },
      data: { status: 'OVERDUE' },
    });
  }

  res.json({ loans });
}

export async function getAllLoans(req, res) {
  const { status, userId, bookId } = req.query;

  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = parseInt(userId);
  if (bookId) where.bookId = parseInt(bookId);

  const loans = await prisma.loan.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      book: { select: { id: true, title: true, author: true, isbn: true } },
    },
    orderBy: { loanDate: 'desc' },
  });

  const now = new Date();
  const overdueIds = loans
    .filter((l) => l.status === 'ACTIVE' && l.dueDate < now)
    .map((l) => l.id);

  if (overdueIds.length > 0) {
    await prisma.loan.updateMany({
      where: { id: { in: overdueIds } },
      data: { status: 'OVERDUE' },
    });
  }

  res.json({ loans, total: loans.length });
}

export async function createLoan(req, res) {

  const { bookId } = req.body;
  const userId = req.user.id;
  const bookIdInt = parseInt(bookId);

  const result = await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id: bookIdInt } });

    if (!book) throw Object.assign(new Error('Libro no encontrado'), { status: 404 });
    if (book.available <= 0) throw Object.assign(new Error('No hay ejemplares disponibles'), { status: 409 });

    const activeLoans = await tx.loan.count({
      where: { userId, status: { in: ['ACTIVE', 'OVERDUE'] } },
    });
    if (activeLoans >= MAX_ACTIVE_LOANS) {
      throw Object.assign(
        new Error(`No puedes tener más de ${MAX_ACTIVE_LOANS} préstamos activos`),
        { status: 409 }
      );
    }

    const existingLoan = await tx.loan.findFirst({
      where: { userId, bookId: bookIdInt, status: { in: ['ACTIVE', 'OVERDUE'] } },
    });
    if (existingLoan) throw Object.assign(new Error('Ya tienes este libro en préstamo'), { status: 409 });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DAYS);

    const [loan] = await Promise.all([
      tx.loan.create({
        data: { userId, bookId: bookIdInt, dueDate },
        include: { book: { select: { id: true, title: true, author: true } } },
      }),
      tx.book.update({
        where: { id: bookIdInt },
        data: { available: { decrement: 1 } },
      }),
    ]);

    return loan;
  });

  res.status(201).json({ message: 'Préstamo solicitado exitosamente', loan: result, dueDate: result.dueDate });
}

export async function returnLoan(req, res) {
  const loanId = parseInt(req.params.id);
  const userId = req.user.id;

  const result = await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { book: true },
    });

    if (!loan) throw Object.assign(new Error('Préstamo no encontrado'), { status: 404 });

    if (loan.userId !== userId && !['ADMIN', 'LIBRARIAN'].includes(req.user.role)) {
      throw Object.assign(new Error('No tienes permiso para devolver este préstamo'), { status: 403 });
    }

    if (loan.status === 'RETURNED') {
      throw Object.assign(new Error('Este libro ya fue devuelto'), { status: 409 });
    }

    const [updatedLoan] = await Promise.all([
      tx.loan.update({
        where: { id: loanId },
        data: { returnDate: new Date(), status: 'RETURNED' },
        include: { book: { select: { id: true, title: true, author: true } } },
      }),
      tx.book.update({
        where: { id: loan.bookId },
        data: { available: { increment: 1 } },
      }),
    ]);

    return updatedLoan;
  });

  res.json({ message: 'Libro devuelto exitosamente', loan: result });
}