// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuarios
  const adminPassword = await bcrypt.hash('admin123', 10);
  const librarianPassword = await bcrypt.hash('librarian123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@biblioteca.com' },
    update: {},
    create: {
      email: 'admin@biblioteca.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const librarian = await prisma.user.upsert({
    where: { email: 'bibliotecario@biblioteca.com' },
    update: {},
    create: {
      email: 'bibliotecario@biblioteca.com',
      name: 'María García',
      password: librarianPassword,
      role: 'LIBRARIAN',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'juan@example.com' },
    update: {},
    create: {
      email: 'juan@example.com',
      name: 'Juan Pérez',
      password: userPassword,
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'ana@example.com' },
    update: {},
    create: {
      email: 'ana@example.com',
      name: 'Ana López',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('✅ Usuarios creados');

  // Crear libros
  const books = [
    {
      isbn: '978-84-376-0494-7',
      title: 'Cien años de soledad',
      author: 'Gabriel García Márquez',
      genre: 'Realismo mágico',
      description: 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.',
      publishedYear: 1967,
      copies: 3,
      available: 3,
    },
    {
      isbn: '978-84-339-7250-2',
      title: 'Don Quijote de la Mancha',
      author: 'Miguel de Cervantes',
      genre: 'Novela',
      description: 'Las aventuras del ingenioso hidalgo Don Quijote y su escudero Sancho Panza.',
      publishedYear: 1605,
      copies: 2,
      available: 2,
    },
    {
      isbn: '978-84-204-0210-0',
      title: '1984',
      author: 'George Orwell',
      genre: 'Distopía',
      description: 'Una sociedad totalitaria donde el Gran Hermano lo controla todo.',
      publishedYear: 1949,
      copies: 4,
      available: 4,
    },
    {
      isbn: '978-84-663-2347-4',
      title: 'El nombre de la rosa',
      author: 'Umberto Eco',
      genre: 'Misterio',
      description: 'Un monje franciscano investiga una serie de muertes en una abadía medieval.',
      publishedYear: 1980,
      copies: 2,
      available: 2,
    },
    {
      isbn: '978-84-397-2128-5',
      title: 'AYUDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      author: 'Jorge García Martínez',
      genre: 'Misterio',
      description: 'Un niño en problemas.',
      publishedYear: 2005,
      copies: 3,
      available: 3,
    },
    {
      isbn: '978-84-233-3645-1',
      title: 'El señor de los anillos',
      author: 'J.R.R. Tolkien',
      genre: 'Fantasía',
      description: 'La épica aventura de Frodo Bolsón para destruir el Anillo Único.',
      publishedYear: 1954,
      copies: 2,
      available: 2,
    },
  ];

  for (const bookData of books) {
    await prisma.book.upsert({
      where: { isbn: bookData.isbn },
      update: {},
      create: bookData,
    });
  }

  console.log('✅ Libros creados');

  // Crear un préstamo de ejemplo
  const book = await prisma.book.findFirst({ where: { isbn: '978-84-376-0494-7' } });
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  await prisma.loan.create({
    data: {
      userId: user1.id,
      bookId: book.id,
      dueDate,
      status: 'ACTIVE',
    },
  });

  await prisma.book.update({
    where: { id: book.id },
    data: { available: { decrement: 1 } },
  });

  console.log('✅ Préstamos creados');

  // Crear reseña de ejemplo (de un libro devuelto)
  const book2 = await prisma.book.findFirst({ where: { isbn: '978-84-204-0210-0' } });
  const pastDueDate = new Date();
  pastDueDate.setDate(pastDueDate.getDate() - 10);
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() - 2);

  await prisma.loan.create({
    data: {
      userId: user2.id,
      bookId: book2.id,
      dueDate: pastDueDate,
      returnDate,
      status: 'RETURNED',
    },
  });

  await prisma.review.create({
    data: {
      userId: user2.id,
      bookId: book2.id,
      rating: 5,
      comment: 'Una novela imprescindible. La distopía más aterradora y vigente.',
    },
  });

  console.log('Reseñas creadas');
  console.log('\nSeed completado exitosamente!');
  console.log('\nCredenciales de prueba:');
  console.log('  Admin:        admin@biblioteca.com / admin123');
  console.log('  Bibliotecario: bibliotecario@biblioteca.com / librarian123');
  console.log('  Usuario 1:    juan@example.com / user123');
  console.log('  Usuario 2:    ana@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });