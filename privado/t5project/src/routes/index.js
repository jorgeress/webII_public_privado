import { Router } from 'express';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar automáticamente archivos *.routes.js
const routeFiles = readdirSync(__dirname).filter(
  (file) => file.endsWith('.routes.js')
);

for (const file of routeFiles) {
  const routeName = file.replace('.routes.js', '');
  
  // CAMBIO AQUÍ: Usamos una ruta relativa con ./ en lugar de join(__dirname)
  const routeModule = await import(`./${file}`); 
  
  router.use(`/${routeName}`, routeModule.default);
  console.log(`📍 Ruta cargada: /api/${routeName}`);
}

export default router;