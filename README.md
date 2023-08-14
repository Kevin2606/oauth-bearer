# Autenticacion con HTTP Bearer

Creacion de autenticacion con Oauth2 utilizando la libreria [PassportJS](https://www.passportjs.org/)

## Dependencias
```bash
npm i -E express dotenv passport jose mongodb passport-http-bearer
```
> Dependencia de desarrollo
```bash
npm i -E -D nodemon
```
## Configuracion del packge.json
Las importaciones se manejaran con el estandar ES6 y se agrega el comando "dev" si se esta utilizando [nodemon](https://www.npmjs.com/package/nodemon).
```json
{
    ...,
    "type": "module",
    "scripts": {
        "dev": "nodemon --quiet index.js" // Si se instalo nodemon
    }
    ...,
}
```
## Estructura del proyecto
```bash
.
├── index.js
├── database
│   └── conexionDB.js
├── helpers
│   └── passportHelper.js
├── middlewares
│   └── middlewareJWT.js
├── package.json
└── README.md
```


## Configuracion de express y librerias
En el index.js o app.js
```Javascript
// index.js
import express from 'express';
import dotenv from 'dotenv';
import passportHelper from './helpers/passportHelpert.js';
import { crearToken } from './middlewares/middlewareJWT.js';

dotenv.config();
const app = express();

app.use(passportHelper.initialize()); // Inicializar passport

// Crear un token con el nombre del usuario
app.get('/token/:nombre', crearToken);

app.listen(PUERTO, () => {
    console.log(`http://localhost:${PUERTO}`);
    }
); 
```
Se define una ruta utilizando el método app.get(). En este caso, la ruta es /token/:nombre, lo que significa que cuando se haga una solicitud HTTP GET a una URL como /token/algun-nombre, se activará esta ruta.

**crearToken**: Cuando se realiza una solicitud a la ruta /token/:nombre, se invoca la función crearToken que ha sido importada desde el archivo middlewareJWT.js. Esta función se encargará de generar un token JWT (JSON Web Token) basado en el nombre proporcionado en la URL.

En el archivo middlewareJWT.js
```Javascript
// middlewareJWT.js
import { SignJWT, jwtVerify } from "jose"
import con from "../database/conexionDB.js";

const conexionDB = await con();

const crearToken = async (req, res) => {
    const encoder = new TextEncoder();

    // Guardar el parámetro ``nombre`` en la colección token
    const result = await conexionDB.collection('token').insertOne({ nombre: req.params.nombre });
    const id = result.insertedId.toString();

    // Crear el token con el id del documento insertado
    const jwtConstructor = await new SignJWT({ id: id})
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(encoder.encode(`${JWT_SECRET}`));
    res.send(jwtConstructor);
}

export {
    crearToken
}
```
**Creacion del JWT**: Crea un nuevo token JWT. En este caso, el objeto contiene el id del documento insertado generado por MongoDB en la colección token.

>Nota: El documento insertado puede ser cualquier cosa, que se quiera guardar en la coleccion, pero en este caso, se utiliza el nombre que viene por parámetro en la URL.

Finalmente, el token se envía como respuesta a la solicitud HTTP GET.

Volviendo al index.js tenemos que definir la ruta de autenticacion
```Javascript
// index.js

// ... Codigo anterior

app.use('/api', passportHelper.authenticate('bearer', { session: false }), function(req, res) {
    // req.user contiene el documento de la colección token
    res.json({ message: 'Autenticación Bearer exitosa', usuario: req.user.nombre });
  });

// ... Codigo posterior

```	

- passportHelper.authenticate('bearer', { session: false }): Aquí se utiliza el middleware de autenticación de Passport para verificar la autenticidad del token JWT proporcionado en la solicitud. 

El primer argumento 'bearer' indica que se utilizará la estrategia de autenticación "Bearer Token". La opción { session: false } especifica que no se debe crear una sesión en la autenticación, lo que es apropiado para aplicaciones de API REST donde las sesiones no son necesarias por el lado del backend.

```Javascript
res.json({ message: ..., usuario: ... })
```
Esta línea envía una respuesta JSON al cliente. El objeto JSON tiene dos propiedades: message y usuario. 

El mensaje informa sobre el éxito de la autenticación Bearer. El nombre de usuario asociado al token se obtiene del objeto req.user.nombre, que ha sido añadido a la solicitud por Passport después de la autenticación exitosa.

## Configuracion de Passport

En el archivo passportHelper.js
```Javascript
// passportHelper.js
import passport from "passport";
import { Strategy as  BearerStrategy} from "passport-http-bearer";
import { validarToken } from "../middlewares/middlewareJWT.js";

passport.use(new BearerStrategy(
  async function(token, done) {
    const usuario =  await validarToken(token)
    if (!usuario) return done(null, false); // No se encontró el token en la colección token o el token no es válido
    return done(null, usuario, { scope: 'all' }); // El token es válido y se agrega el documento de la colección token a req.user
  }
));
export default passport;
```
De esta manera se configura la estrategia de autenticación Bearer. La función de verificación de la estrategia recibe dos argumentos: token y done.

- token: Es el token JWT proporcionado en la solicitud HTTP.
- done: Es una función de devolución de llamada que se invoca cuando se ha verificado el token. La función de devolución de llamada recibe tres argumentos: done(error, usuario, info).

    - error: Es un objeto de error. Si se produce un error durante la verificación del token, se debe pasar el error a done. Si no hay error, se debe pasar null.
    - usuario: Es el documento de la colección token que se ha guardado en req.user.
    - info: Es un objeto que contiene información adicional. En este caso, se utiliza para especificar el ámbito de la autenticación.

Volviendo a middlewareJWT.js tenemos que definir la funcion validarToken
```Javascript
// middlewareJWT.js
// ... Codigo anterior

const validarToken = async (token) => {
    try {
        const encoder = new TextEncoder();
        const jwtData = await jwtVerify(
            token,
            encoder.encode(`${JWT_SECRET}`)
        );

        // Buscar el id del token en la colección token
        /*
        Si el token es válido, se retorna el documento de la colección token
        Si el token es válido, pero no existe en la colección token, se retorna null
        Si el token no es válido, se retorna false
        */
        return await conexionDB.collection('token').findOne({_id: new ObjectId(jwtData.payload.id)});
    } catch (error) {
        console.log(error);
        return false;
    }

}

export {
    crearToken,
    validarToken
}
```	
**validarToken**: Esta función se encarga de verificar la validez del token JWT proporcionado en la solicitud HTTP. Para ello, utiliza la función jwtVerify() de la librería jose. Esta función recibe dos argumentos: el token JWT y la clave secreta utilizada para firmar el token.

**Busqueda en MongoDB**: Si el token es válido, se busca el id del token en la colección token. Si el token es válido, pero no existe en la colección token, se retorna null. Si el token no es válido, se retorna false.

## Configuracion de MongoDB

En el archivo conexionDB.js
```Javascript
// conexionDB.js
import { MongoClient } from 'mongodb';

export default async function con() {
  try {
    const uri = `mongodb+srv://${USER}:${PASSWORD}@cluster0.owv3sij.mongodb.net/${DB}`;
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    const client = await new MongoClient(uri, options).connect();
    return client.db();
  } catch (error) {
    return {status: 500, message: error};
  }
}
```
De esta manera se configura la conexion a la base de datos. En este caso, se utiliza la librería mongodb para conectarse a MongoDB Atlas. La función con() devuelve una instancia de la base de datos.

>Nota: En la constante uri el @cluster0.owv3sij.mongodb.net/ es el nombre del cluster de MongoDB Atlas, este puede variar dependiendo del nombre que le hayan dado al cluster.

## Configuracion de las variables de entorno
Se provee un archivo .env.example con las variables de entorno necesarias para el funcionamiento de la aplicación. Se debe crear un archivo .env con las mismas variables de entorno y sus valores correspondientes.

```Javascript
// .env.example

DB=nombre_de_la_base_de_datos
USER=usuario_de_la_base_de_datos
PASSWORD=contraseña_de_la_base_de_datos
JWT_SECRET=clave_secreta_para_firmar_el_token
PUERTO=puerto_de_la_aplicacion
```