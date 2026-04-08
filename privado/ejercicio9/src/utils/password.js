import bcryptjs from 'bcryptjs';

export const encrypt = async (clearPassword) =>
  bcryptjs.hash(clearPassword, 10);

export const compare = async (clearPassword, hashedPassword) =>
  bcryptjs.compare(clearPassword, hashedPassword);