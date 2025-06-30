const express = require('express');
const router = express.Router(); // Crea un nuevo objeto router de Express
const authController = require('../controllers/authController'); // Importa el controlador de autenticación
const subscriptionController = require('../controllers/subscriptionController');

// Ruta para el registro de usuarios

router.post('/register', authController.register);

// Ruta para el inicio de sesión de usuarios

router.post('/login', authController.login);

// Rutas GET
router.get('/users', authController.getAllUsers);

router.get('/users/:Id', authController.getUserById);


// Nuevo servicio restablecimiento de contraseña create 28/06/2025
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);


// Nuevas Rutas para la Suscripción (manejadas por subscriptionController)
// Ruta para suscribir al plan básico
router.post('/subscribe/basic', subscriptionController.subscribeBasic);

// Ruta para suscribir al plan premium
router.post('/subscribe/premium', subscriptionController.subscribePremium);

// Ruta para obtener el estado de suscripción de un usuario
router.get('/subscribe/status/:userId', subscriptionController.getSubscriptionStatus); // Se usa ':userId' para pasar el ID como parámetro de URL

// Ruta para cancelar la suscripción de un usuario
router.post('/subscribe/cancel', subscriptionController.cancelSubscription);








console.log('DEBUG: Rutas definidas en Pure_Cinema_Feel.js:', router.stack.map(l => l.route));

module.exports = router; // Exporta el router para que pueda ser utilizado por la aplicación principal