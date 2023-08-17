import express from 'express';
import dotenv from 'dotenv';
import passportHelper from './helpers/passportHelpert.js';
import { crearToken } from './middlewares/middlewareJWT.js';
import acl from 'express-acl';

dotenv.config();

acl.config({
    filename: 'nacl.json',
    baseUrl: 'api',
    roleSearchPath: 'user.rol',
    denyCallback: (res) => res.status(403).json({
      message: 'No tienes permisos para acceder a este recurso'
    })
});

const app = express();

app.use(passportHelper.initialize());

app.get('/token/:usuario', crearToken);

app.get('/api/admin', passportHelper.authenticate('bearer', { session: false }), acl.authorize, (req, res) => {
    res.json({mensaje: 'Hola admin', usuario: req.user});
});
app.get('/api/vendedor', passportHelper.authenticate('bearer', { session: false }), acl.authorize, (req, res) => {
    res.json({mensaje: 'Hola vendedor', usuario: req.user});
});

app.listen(process.env.PUERTO, () => {
    console.log(`http://localhost:${process.env.PUERTO}`);
    }
); 


