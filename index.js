import express from 'express';
import dotenv from 'dotenv';
import passportHelper from './helpers/passportHelpert.js';
import { crearToken } from './middlewares/middlewareJWT.js';

dotenv.config();
const app = express();

app.use(passportHelper.initialize());

// Crear un token con el usuario de la persona
app.get('/token/:usuario', crearToken);

// Proteger una ruta con autenticación Bearer
/** 
 * ! Importante !
 * Antes de colocar el token colocar la palabra Bearer
 * En los headers agregar: {
 *      Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
 * }
 */

// Middleware para validar permisos de roles
const rolesPermitidos = {
    admin: ['admin', 'vendedor'],
    vendedor: ['vendedor']
}

const validarPermisos = (req, res, next) => {
  //Comprueba que el usuario este accediendo a la url permitida para su rol
  if (rolesPermitidos[req.user.rol].includes(req.url.split('/')[2])) {
    next();
  } else {
    res.status(403).send('No tienes permisos para acceder a este recurso');
  }
}
// ------------------------------

app.get('/api/admin', passportHelper.authenticate('bearer', { session: false }), validarPermisos, (req, res) => {
    res.json({mensaje: 'Hola admin', usuario: req.user});
});
app.get('/api/vendedor', passportHelper.authenticate('bearer', { session: false }), validarPermisos, (req, res) => {
    res.json({mensaje: 'Hola vendedor', usuario: req.user});
});

app.listen(process.env.PUERTO, () => {
    console.log(`http://localhost:${process.env.PUERTO}`);
    }
); 


