import prisma from '../config/prisma.js';

export async function getStats(req, res) {
  const [totalBooks, totalUsers, totalLoans, topBooks] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.loan.count(),
    prisma.book.findMany({
      take: 5,
      orderBy: { loans: { _count: 'desc' } },
      select: {
        id: true,
        title: true,
        author: true,
        _count: { select: { loans: true } }
      }
    })
  ]);

  res.json({ totalBooks, totalUsers, totalLoans, topBooks });
}