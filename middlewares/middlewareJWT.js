import { SignJWT, jwtVerify } from "jose"
import con from "../database/conexionDB.js";
import { ObjectId } from "mongodb";

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
        .sign(encoder.encode(process.env.JWT_SECRET));
    res.send(jwtConstructor);
}

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