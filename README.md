# Autenticacion con HTTP Bearer utilizando Express-Acl

Creacion de autenticacion con Oauth2 utilizando la libreria [PassportJS](https://www.passportjs.org/)

Este repositorio es una guia para la creacion de una autenticacion con HTTP Bearer utilizando la libreria [PassportJS](https://www.passportjs.org/) y [MongoDB](https://www.mongodb.com/).

Se utilizara la libreria [jose](https://www.npmjs.com/package/jose) para la creacion de los tokens JWT.

>Nota: Se asume conocimiento basico de [NodeJS](https://nodejs.org/es/), [Express](https://expressjs.com/es/), [MongoDB](https://www.mongodb.com/) y [Tokens JWT](https://jwt.io/).

**Se utilizara la libreria "express-acl" para el manejo de roles y permisos.**

## Instalacion
```bash
npm install
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
├── nacl.json # Archivo de configuracion de express-acl
└── README.md
```


## Configuracion de express-acl
En el index.js o app.js
```Json
// nacl.json
[
    {
      "group": "admin",
      "permissions": [
        {
          "resource": "*",
          "methods": "*",
          "action": "allow"
        }
      ],
      "action": "allow"
    },
    {
      "group": "vendedor",
      "permissions": [
        {
          "resource": "vendedor/",
          "methods": ["POST", "GET", "PUT"],
          "action": "allow"
        }
      ],
        "action": "deny"
    }
]
```
| Propiedad | Tipo | Descripcion |
| --- | --- | --- |
| group | String | Esta propiedad define el grupo de acceso al que puede pertenecer un usuario, por ejemplo, usuario, invitado, administrador, formador. Esto puede variar dependiendo de la arquitectura de su aplicación. |
| permissions | Array | Esta propiedad contiene una matriz de objetos que definen los recursos expuestos a un grupo y los métodos permitidos/denegados |
| resource | String | Esta es la ruta en la que se aplicarán los permisos. Esta propiedad puede ser * que se aplica a todas las rutas, api/users que aplicará permiso a las rutas api/users o api/users/* que aplicará el permiso a todas las rutas que tengan el prefijo api/users |
| methods | String o Array | Estos son métodos http que un usuario puede o no puede ejecutar. ["POST", "GET", "PUT"]. use * si desea incluir todos los métodos http.|
| action | String | Esta propiedad le dice a express-acl qué acción realizar con el permiso otorgado. Utilizando el ejemplo anterior, la política de usuario especifica una acción de permitir, lo que significa que se permite todo el tráfico en la ruta /api/vendedor para los métodos GET, PUT, POST, pero se restringe para el resto. Y para el administrador, se permite todo el tráfico para todos los recursos. |
| subRoutes | Array | Estos son permisos que deben usarse en subrutas de un prefijo especificado. Es útil cuando ciertas rutas bajo un prefijo requieren diferentes definiciones de acceso. |

En el archivo index.js
```Javascript
// index.js
// ... Codigo anterior

// Importamos express-acl
import acl from 'express-acl';

// ... Codigo anterior

// Configuramos express-acl
acl.config({
    filename: 'nacl.json',
    baseUrl: 'api',
    roleSearchPath: 'user.rol',
    denyCallback: (res) => res.status(403).json({
      message: 'No tienes permisos para acceder a este recurso'
    })
});

app.get('/api/admin', passportHelper.authenticate('bearer', { session: false }), acl.authorize, (req, res) => {
    res.json({mensaje: 'Hola admin', usuario: req.user});
});
app.get('/api/vendedor', passportHelper.authenticate('bearer', { session: false }), acl.authorize, (req, res) => {
    res.json({mensaje: 'Hola vendedor', usuario: req.user});
});
```
Como se puede observar, se importa la libreria express-acl y se configura con los parametros necesarios.

acl.config() recibe un objeto con las siguientes propiedades:
| Propiedad | Tipo | Descripcion |
| --- | --- | --- |
| filename | String | Esta propiedad define el nombre del archivo json que contiene los permisos. |
| baseUrl | String | Esta propiedad define el prefijo de las rutas que se utilizaran para la autenticacion. |
| roleSearchPath | String | Esta propiedad define la ruta donde se encuentra el rol del usuario. |
| denyCallback | Function | Esta propiedad define la funcion que se ejecutara cuando el usuario no tenga permisos para acceder a un recurso. |

Si deseas saber mas sobre express-acl puedes visitar su [documentacion](https://www.npmjs.com/package/express-acl).

```Javascript
app.get('/api/admin', passportHelper.authenticate('bearer', { session: false }), acl.authorize, (req, res) => {
    res.json({mensaje: 'Hola admin', usuario: req.user});
});
app.get('/api/vendedor', passportHelper.authenticate('bearer', { session: false }), acl.authorize, (req, res) => {
    res.json({mensaje: 'Hola vendedor', usuario: req.user});
});
```
Finalmente como se puede observar, se utiliza la funcion acl.authorize para verificar si el usuario tiene permisos para acceder a un recurso.

>Nota: acl.authorize debe ir despues de passportHelper.authenticate('bearer', { session: false }) para que pueda obtener el rol del usuario.


### Manejo de roles manual vs express-acl
```Javascript
// Manejo de roles manual
// index.js
import express from 'express';
import dotenv from 'dotenv';
import passportHelper from './helpers/passportHelpert.js';
import { crearToken } from './middlewares/middlewareJWT.js';

dotenv.config();
const app = express();

app.use(passportHelper.initialize());

app.get('/token/:usuario', crearToken);

const rolesPermitidos = {
    admin: ['admin', 'vendedor'],
    vendedor: ['vendedor']
}

const validarPermisos = (req, res, next) => {
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


```
```Javascript
// Manejo de roles con express-acl
// index.js
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
```
Ambos ejemplos son equivalentes, pero el segundo es mas limpio y facil de entender.
Ademas de que con express-acl se pueden definir permisos para subrutas de un prefijo especificado.


## Autores
- [Kevin Andres Gallardo Robles](https://github.com/Kevin2606)
- [Jonathan David Alvarez Monsalve](https://github.com/jdam97)
- [Daniel Santiago Vera Anaya](https://github.com/dVera17)
