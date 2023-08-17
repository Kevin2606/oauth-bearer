# Autenticacion con HTTP Bearer

Creacion de autenticacion con Oauth2 utilizando la libreria [PassportJS](https://www.passportjs.org/)

Este repositorio es una guia para la creacion de una autenticacion con HTTP Bearer utilizando la libreria [PassportJS](https://www.passportjs.org/) y [MongoDB](https://www.mongodb.com/).

Se utilizara la libreria [jose](https://www.npmjs.com/package/jose) para la creacion de los tokens JWT.

>Nota: Se asume conocimiento basico de [NodeJS](https://nodejs.org/es/), [Express](https://expressjs.com/es/), [MongoDB](https://www.mongodb.com/) y [Tokens JWT](https://jwt.io/).

## Instalacion

Clona el repositorio
```bash
git clone https://github.com/Kevin2606/oauth-bearer.git
```

o inicializa un proyecto de node
```bash
npm init -y
```

## Dependencias
```bash
npm install
```
o si inicializaste un proyecto de node

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
app.get('/token/:usuario', crearToken);

app.listen(process.env.PUERTO, () => {
    console.log(`http://localhost:${process.env.PUERTO}`);
    }
); 
```
Se define una ruta utilizando el método app.get(). En este caso, la ruta es /token/:nombre, lo que significa que cuando se haga una solicitud HTTP GET a una URL como /token/algun-usuario, se activará esta ruta.

**crearToken**: Cuando se realiza una solicitud a la ruta /token/:usuario, se invoca la función crearToken que ha sido importada desde el archivo middlewareJWT.js. Esta función se encargará de generar un token JWT (JSON Web Token) basado en el nombre proporcionado en la URL.

En el archivo middlewareJWT.js
```Javascript
// middlewareJWT.js
import { SignJWT, jwtVerify } from "jose"
import con from "../database/conexionDB.js";
import dotenv from 'dotenv';
dotenv.config();

const conexionDB = await con();

const crearToken = async (req, res) => {
    const encoder = new TextEncoder();

     // Busca el parámetro ``usuario`` en la colección "usuarios"
    const result = await conexionDB.collection('usuarios').findOne({usuario: req.params.usuario});
    if (!result) return res.status(404).send('Usuario no encontrado');
    const id = result._id.toString();

    // Crear el token con el id del documento buscado
    const jwtConstructor = await new SignJWT({ id: id})
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(encoder.encode(process.env.JWT_SECRET));
    res.send(jwtConstructor);
}

export {
    crearToken
}
```
**Creacion del JWT**: Crea un nuevo token JWT. En este caso, el objeto contiene el id del usuario, el "_id" generado por MongoDB en la colección token.

Finalmente, el token se envía como respuesta a la solicitud HTTP GET.

Volviendo al index.js tenemos que definir los endpoints por donde se podra acceder a la informacion de la API.
```Javascript
// index.js

// ... Codigo anterior

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

app.get('/api/admin', passportHelper.authenticate('bearer', { session: false }), validarPermisos, (req, res) => {
    res.json({mensaje: 'Hola admin', usuario: req.user});
});
app.get('/api/vendedor', passportHelper.authenticate('bearer', { session: false }), validarPermisos, (req, res) => {
    res.json({mensaje: 'Hola vendedor', usuario: req.user});
});

// ... Codigo posterior

```	

1. **Definición del objeto `rolesPermitidos`:**

```javascript
const rolesPermitidos = {
    admin: ['admin', 'vendedor'],
    vendedor: ['vendedor']
}
```

Aquí se define un objeto llamado `rolesPermitidos`. Este objeto contiene permisos asignados a diferentes roles de usuario. En este caso, hay dos roles definidos: `admin` y `vendedor`. Para cada rol, se especifica una lista de roles a los que tienen permitido acceder. Por ejemplo, un usuario con rol `admin` puede acceder a recursos con roles `admin` y `vendedor`, mientras que un usuario con rol `vendedor` solo puede acceder a recursos con rol `vendedor`.

2. **Función `validarPermisos`:**

```javascript
const validarPermisos = (req, res, next) => {
    //Comprueba que el usuario este accediendo a la url permitida para su rol
    if (rolesPermitidos[req.user.rol].includes(req.url.split('/')[2])) {
        next();
    } else {
        res.status(403).send('No tienes permisos para acceder a este recurso');
    }
}
```

Esta es una función de middleware llamada `validarPermisos`. Actúa como un controlador intermedio entre la solicitud y la respuesta en las rutas protegidas. Su tarea principal es verificar si el usuario que realiza la solicitud tiene permiso para acceder a la URL solicitada en función de su rol.

- `req.user.rol` se refiere al rol del usuario extraído del objeto `user` de la solicitud.
- `req.url.split('/')[2]` divide la URL solicitada en segmentos y toma el tercer segmento (índice 2), que parece ser el nombre del recurso al que se está intentando acceder.

Si el rol del usuario tiene permitido acceder al recurso según la definición en `rolesPermitidos`, entonces la función `next()` se llama para pasar al siguiente middleware o controlador. Si no tiene permiso, se envía una respuesta de estado 403 (Prohibido) indicando que el usuario no tiene los permisos necesarios para acceder al recurso.

3. **Rutas protegidas:**

```javascript
app.get('/api/admin', passportHelper.authenticate('bearer', { session: false }), validarPermisos, (req, res) => {
    res.json({mensaje: 'Hola admin', usuario: req.user});
});

app.get('/api/vendedor', passportHelper.authenticate('bearer', { session: false }), validarPermisos, (req, res) => {
    res.json({mensaje: 'Hola vendedor', usuario: req.user});
});
```

Estas son las rutas protegidas en la aplicación. Aquí hay un flujo de lo que sucede cuando se accede a una de estas rutas:

- Se utiliza `passportHelper.authenticate` para autenticar al usuario utilizando el método de autenticación 'bearer'. Este método de autenticación utiliza el token JWT que se envía en el encabezado de autorización de la solicitud HTTP.
- Luego, se ejecuta el middleware `validarPermisos` que verifica si el usuario tiene los permisos adecuados para acceder a la URL solicitada según su rol.
- Si el usuario tiene permisos, se ejecuta la función de manejo final que responde con un JSON que contiene un mensaje de saludo y la información del usuario.

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
    return done(null, usuario); // El token es válido y se agrega el documento de la colección token a req.user
  }
));
export default passport;
```
De esta manera se configura la estrategia de autenticación Bearer. La función de verificación de la estrategia recibe dos argumentos: token y done.

- token: Es el token JWT proporcionado en la solicitud HTTP.
- done: Es una función de devolución de llamada que se invoca cuando se ha verificado el token. La función de devolución de llamada recibe tres argumentos: done(error, usuario, info).

    - error: Es un objeto de error. Si se produce un error durante la verificación del token, se debe pasar el error a done. Si no hay error, se debe pasar null.
    - usuario: Es el documento de la colección token que se ha guardado en req.user.
    - info: Es un objeto que contiene información adicional. Revisar la documentacion para conocer mas.

Volviendo a middlewareJWT.js tenemos que definir la funcion validarToken
```Javascript
// middlewareJWT.js
// ... Codigo anterior

const validarToken = async (token) => {
    try {
        const encoder = new TextEncoder();
        const jwtData = await jwtVerify(
            token,
            encoder.encode(process.env.JWT_SECRET)
        );

        // Buscar el id del token en la colección token
        /*
        Si el token es válido, se retorna el documento de la colección token
        Si el token es válido, pero no existe en la colección token, se retorna null
        Si el token no es válido, se retorna false
        */
        return await conexionDB.collection('usuarios').findOne({_id: new ObjectId(jwtData.payload.id)});
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

**Busqueda en MongoDB**: Si el token es válido, se busca el id del usuario en la colección "usuarios". Si el token es válido, pero no existe en la colección "usuarios", se retorna null. Si el token no es válido, se retorna false.

## Configuracion de MongoDB

En el archivo conexionDB.js
```Javascript
// conexionDB.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

export default async function con() {
  try {
    const uri = `mongodb+srv://${process.env.ATLAS_USER}:${process.env.ATLAS_PASSWORD}@cluster0.owv3sij.mongodb.net/${process.env.ATLAS_DB}`;
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

ATLAS_DB=nombre_de_la_base_de_datos
ATLAS_USER=usuario_de_la_base_de_datos
ATLAS_PASSWORD=contraseña_de_la_base_de_datos
JWT_SECRET=clave_secreta_para_firmar_el_token
PUERTO=puerto_de_la_aplicacion
```

## Ejecutar la aplicacion
Para ejecutar la aplicacion se debe ejecutar el siguiente comando en la terminal
```Javascript
npm run dev
```

## Probar la aplicacion

Se hace uso de la herramienta **Thunder Client** para probar la aplicacion. Se debe enviar una solicitud HTTP GET a la ruta /token/:usuario

![image](./assets/img/obtener_token.png)

La respuesta de la aplicacion es un objeto JSON que contiene el token JWT.

![image](./assets/img/jwt_decodificado.png)

El token JWT almacenara dentro del payload el id del token generado por el usuario en la base de datos

### Probar la autenticacion Bearer
Para probar la autenticacion Bearer se debe enviar una solicitud HTTP a la ruta /api/vendedor o /api/admin
con el token JWT en el encabezado Authorization acompañado de la palabra Bearer

Ejemplo: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJDUklTVElBTk8iOiJTSVVVVVVVVVVVVVUiLCJpYXQiOjE2OTE5OTE3MzIsImV4cCI6MTY5MTk5NTMzMn0.emWkEn4Mvn13EgHYPVDJL8SyXKgyS3s4W9WPOKfm0cs

![image](./assets/img/acceso_api.png)

La respuesta de la aplicacion es un objeto JSON que contiene el mensaje "Autenticacion exitosa" y los datos del usuario que genero el token.

> Este proyecto fue realizado con fines educativos y abarca los temas de autenticacion y autorizacion con JWT y Bearer.

## Autores
- [Kevin Andres Gallardo Robles](https://github.com/Kevin2606)
- [Jonathan David Alvarez Monsalve](https://github.com/jdam97)
- [Daniel Santiago Vera Anaya](https://github.com/dVera17)
