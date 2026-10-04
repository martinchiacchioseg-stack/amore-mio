// Punto de entrada serverless de Vercel cuando el proyecto usa Root Directory = "client".
// Todas las rutas /api/* llegan acá y se delegan a la app Express del backend.
import app from '../../server/src/index.js';

export default app;
