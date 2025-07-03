require ('dotenv').config(); //Importa las variables de entorno almacenadas 
const User = require('../models/User'); // Importa el modelo de usuario
const crypto = require('crypto'); // Genera tokens seguros
const nodemailer = require('nodemailer');

const authController = {
    async register(req, res) {
        // Normalizar las claves de red.bdy a minusculas
        const normalizedBody = {};
        for (const key in req.body){
            normalizedBody[key.toLowerCase()] = req.body[key];
        }

        const { username, password, email } = normalizedBody; // Obtiene el nombre de usuario y la contraseña del cuerpo de la solicitud

        // Validación básica
        if (!username || !password || !email) {
            return res.status(400).json({ message: 'Nombre de usuario, contraseña y correo electrónico son requeridos.' });
        }

        try {
            // Intenta crear el usuario usando el modelo User
            const result = await User.create(username, password, email);
            res.status(201).json({ message: 'Usuario registrado exitosamente', userId: result.insertId });
        } catch (error) {
            if (error.message === 'El nombre de usuario ya existe.' || error.message === 'El correo electronico ya esta registrado') {
                return res.status(409).json({ message: error.message }); // 409 Conflict
            }
            console.error('Error en el registro:', error);
            res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
        }
    },

    async login(req, res) {
        const { username, password } = req.body; // Obtiene el nombre de usuario y la contraseña del cuerpo de la solicitud

        // Validación básica
        if (!username || !password) {
            return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
        }

        try {
            // Busca el usuario por nombre de usuario
            const user = await User.findByUsername(username);

            if (!user) {
                return res.status(401).json({ message: 'Credenciales inválidas.' }); // 401 Unauthorized
            }

            // Compara la contraseña proporcionada con el hash almacenado
            const isMatch = await User.comparePassword(password, user.password_hash);

            if (!isMatch) {
                return res.status(401).json({ message: 'Credenciales inválidas.' }); // 401 Unauthorized
            }

            
            // Mensaje de éxito
            res.status(200).json({ message: 'Inicio de sesión exitoso', username: user.username });

        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
        }
   
    },
    
    async getAllUsers(req, res) {
        try {
            const users = await User.find({});
            // Envía una respuesta exitosa con los datos de los usuarios
            res.status(200).json({
            success: true,
            message: 'Usuarios obtenidos exitosamente.',
            data: users
            });
        } catch (error) {
            //Manejo de errores
            console.error ('Error al obtener todos los usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error del servidor al intentar obtener los usuarios.', 
                error: error.message
            });

        }
    },

    async getUserById(req, res) {
        try {
            const userId = req.params.id; // Captura el ID del parámetro de la URL

            // Lógica para consultar y devolver un usuario específico de la base de datos por ID

            const user = await User.findById(userId)

            // Si el usuario no es encontrado
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `Usuario con ID ${userId} no encontrado.`
                });
            }

            // Envía una respuesta exitosa con los datos del usuario encontrado
            res.status(200).json({
                success: true,
                message: `Usuario con ID ${userId} Obtenido exitosamente.`,
                data: user
            });

        } catch (error){
            // Manejo de errores
            console.error (`Error al obtener usuario por ID ${req.params.id}:`, error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al intentar obtener el usuario.',
                error: error.message
            });
        }
    },


    // Nuevas funciones 28/06/2025
    async forgotPassword(req, res) {
        const { email } = req.body;
        // Validación: Asegura que el correo electrónico esté presente
        if (!email) {
            return res.status(400).json({message: 'Se requiere el correo para el restablecer la contraseña.'});

        }
         try {
        // Busca al usuario por correo electrónico (o nombre de usuario si tu método lo permite)
           const user = await User.findByUsernameOrEmail(email);
        
        // PRUEBAS.
        console.log('DEBUG (User lookup): Resultado completo de user:', user); // Muestra todo el objeto user
        if (user) {
            console.log('DEBUG (User lookup): Valor de user.email:', user.email); // Muestra solo la propiedad email
        } else {
            console.log('DEBUG (User lookup): Usuario NO encontrado en la base de datos para el email:', email);
        }
       

           // Cambio clave
            if (user) {
              
             
                // Genera un token aleatorio seguro (32 bytes = 64 caracteres hexadecimales)
                const resetToken = crypto.randomBytes(32).toString('hex');
                //Tiempo de expiración del token, se ha definido 15 min
                const expires = new Date(Date.now() + 900000); // Son 15 min en milisegundos
                // Guarda el token y la expiración en la base de datos
                await User.setResetPasswordToken(user.id, resetToken, expires);



                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com', // SMTP host para el gmail
                    port: 465, // Puerto SMTP seguro para SSL/TLS
                    secure: true, // Usa SSL/TLS (true para puerto 465, false para otros como 587)

                    auth:{
                        user: process.env.SENDING_EMAIL,
                        pass: process.env.EMAIL_PASS
                    }
                });

                console.log('DEBUG (Nodemailer): Intentando enviar correo con usuario:', process.env.SENDING_EMAIL);
                console.log('DEBUG (Nodemailer): Usando host:', transporter.options.host, 'y puerto:', transporter.options.port);


                // Definir las opciones de correo electronico

                const resetLink = `http://localhost:8080/reset-password?token=${resetToken}`; // <=== Se usa template literals para insertar variables
                const mailOptions = {
                    from: process.env.SENDING_EMAIL,       // Quien envia el correo.
                    to: user.Email,                       // A quien se le envia el correo.
                    subject: 'Restablecimiento de contraseña - Pure Cinema Feel',
                    html:`
                        <p>Estimado usuario,</p>
                        <p>Has solicitado restablecimiento de contraseña de tu cuenta pure_cinema_feel</p>
                        <p>Por favor haga clic en el siguiente enlace <a href="${resetLink}">Restablecer contraseña</a></p>
                        <p>Si no lo solicitaste un restablecimiento de contraseña, ignora este correo.</p>
                    
                        `
            
                };
            
            // 3. Enviar el correo elctronico, se usa await para esperar a que el correo se envíe.
            await transporter.sendMail(mailOptions);
            console.log(`[DEBUG] (Nodemailer): Correo de restablecimiento enviado exitosamente a ${user.Email} con enlace: ${resetLink}`);
             // Una vez que el correo se ha intentado enviar (o ha fallado dentro del 'try'), envía la respuesta al cliente.
            res.status(200).json({message:'Si el correo electronico existe se ha enviado, un enlace de restablecimiento.'});
         


            
            } else {
                return res.status(200).json({message:'Si el correo electronico existe se ha enviado, un enlace de restablecimiento.' });
            }
           


            
            
       } catch (error){
        console.error('Error (Nodemailer): Error al enviar el correo', error);
        // Un log específico si el error es del envío de correo.
        if (error.code === 'EENVELOPE' || error.responseCode) {
            console.error ('Error al enviar el correo con nodemailer:', error.message);
        }

        res.status(500).json({message: 'Error interno del servidor al solicitar restablecimiento de contraseña.'});
       }

        
    },


    async resetPassword(req, res) {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token y nueva contraseña son requeridos.' });
        }

        try {
            // Busca al usuario por el token y verifica la expiración
            const user = await User.findByPasswordResetToken(token);

            if (!user) {
                return res.status(400).json({ message: 'Token de restablecimiento inválido o expirado.' });
            }

            // Actualiza la contraseña del usuario y limpia el token
            const passwordUpdated = await User.updatePassword(user.id, newPassword);

            if (passwordUpdated) {
                res.status(200).json({ message: 'Contraseña restablecida exitosamente.' });
            } else {
                res.status(500).json({ message: 'No se pudo actualizar la contraseña.' });
            }

        } catch (error) {
            console.error('Error en resetPassword:', error);
            res.status(500).json({ message: 'Error interno del servidor al restablecer la contraseña.' });
        }
    }


};

module.exports = authController;