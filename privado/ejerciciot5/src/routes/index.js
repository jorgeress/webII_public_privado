import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PATH_ROUTES = __dirname;

const removeExtension = (fileName) => {
  return fileName.split('.').shift();
};

fs.readdirSync(PATH_ROUTES).filter((file) => {
  const name = removeExtension(file);
  if (name !== 'index') {
    import(`./${file}`).then((moduleRouter) => {
      console.log(`📍 Ruta cargada: /api/${name}`);
      router.use(`/${name}`, moduleRouter.default);
    });
  }
});

export default router;