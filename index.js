import express from 'express';
import passportHelper from './helpers/passportHelpert.js';
import { crearToken } from './middlewares/middlewareJWT.js';

const app = express();

app.use(passportHelper.initialize());

// Crear un token con el nombre del usuario
app.get('/token/:nombre', crearToken);

// Proteger una ruta con autenticación Bearer
/** 
 * ! Importante !
 * Antes de colocar el token colocar la palabra Bearer
 * En los headers agregar: {
 *      Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
 * }
 */
app.use('/api', passportHelper.authenticate('bearer', { session: false }), function(req, res) {
    // req.user contiene el documento de la colección token
    res.json({ message: 'Autenticación Bearer exitosa', usuario: req.user.nombre });
  });

app.listen(process.env.PUERTO, () => {
    console.log(`http://localhost:${process.env.PUERTO}`);
    }
); 


