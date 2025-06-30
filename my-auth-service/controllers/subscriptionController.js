const { pool: db } = require('../config/db'); // Ahora 'db' es directamente el pool, y tiene el método .query()

/**
 * Suscribe a un usuario al plan básico.
 * @param {object} req - El objeto de solicitud HTTP.
 * @param {object} res - El objeto de respuesta HTTP.
 */
const subscribeBasic = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "El 'userId' es requerido para la suscripción al plan básico." });
    }

    try {
        // Aqui se verifica si el usuario ya está suscrito y se actualiza o inserta el estado de su suscripción en la DB.
        const plan = 'Basico';
        const subscriptionStatus = 'Activo';
        // Consulta SQL para insertar o actualizar la suscripción del usuario
        // ON DUPLICATE KEY UPDATE es útil si user_id es una clave única
        const query = 'INSERT INTO subscriptions (user_id, plan_name, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE plan_name = ?, status = ?';
        const [result] = await db.query(query, [userId, plan, subscriptionStatus, plan, subscriptionStatus]);

        console.log(`Usuario ${userId} se ha suscrito al plan Básico.`);
        res.status(200).json({ message: "Suscripción al Plan Básico confirmada.", userId, plan });
    } catch (error) {
        console.error('Error al suscribir al plan Básico:', error);
        res.status(500).json({ error: "Error interno del servidor al procesar la suscripción." });
    }
};

/**
 * Suscribe a un usuario al plan premium.
 * @param {object} req - El objeto de solicitud HTTP.
 * @param {object} res - El objeto de respuesta HTTP.
 */
const subscribePremium = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "El 'userId' es requerido para la suscripción al plan premium." });
    }

    try {
        const plan = 'Premium';
        const subscriptionStatus = 'Activo';
        const query = 'INSERT INTO subscriptions (user_id, plan_name, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE plan_name = ?, status = ?';
        const [result] = await db.query(query, [userId, plan, subscriptionStatus, plan, subscriptionStatus]);

        console.log(`Usuario ${userId} se ha suscrito al plan Premium.`);
        res.status(200).json({ message: "Suscripción al Plan Premium confirmada.", userId, plan });
    } catch (error) {
        console.error('Error al suscribir al plan Premium:', error);
        res.status(500).json({ error: "Error interno del servidor al procesar la suscripción." });
    }
};

/**
 * Obtiene el estado de suscripción de un usuario.
 * @param {object} req - El objeto de solicitud HTTP (userId viene en parametros).
 * @param {object} res - El objeto de respuesta HTTP.
 */
const getSubscriptionStatus = async (req, res) => {
    const { userId } = req.params; // UserId vendra como parte de la URL (e.g., /status/:userId)

    if (!userId) {
        return res.status(400).json({ error: "El 'userId' es requerido para obtener el estado de la suscripción." });
    }

    try {
        const query = 'SELECT plan_name, status FROM subscriptions WHERE user_id = ?';
        const [rows] = await db.query(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado o sin suscripción activa." });
        }

        const subscription = rows[0];
        res.status(200).json({ userId, plan: subscription.plan_name, status: subscription.status });
    } catch (error) {
        console.error('Error al obtener el estado de suscripción:', error);
        res.status(500).json({ error: "Error interno del servidor al obtener el estado de la suscripción." });
    }
};

/**
 * Cancela la suscripción de un usuario.
 * @param {object} req - El objeto de solicitud HTTP.
 * @param {object} res - El objeto de respuesta HTTP.
 */
const cancelSubscription = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "El 'userId' es requerido para cancelar la suscripción." });
    }

    try {
        // Se podra cambiar el estado a 'Cancelado' o 'Inactivo'
      
        const query = 'DELETE FROM subscriptions WHERE user_id = ?';
        const [result] = await db.query(query, [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Suscripción no encontrada para el usuario especificado." });
        }

        console.log(`Suscripción del usuario ${userId} ha sido cancelada.`);
        res.status(200).json({ message: "Suscripción cancelada exitosamente.", userId });
    } catch (error) {
        console.error('Error al cancelar la suscripción:', error);
        res.status(500).json({ error: "Error interno del servidor al cancelar la suscripción." });
    }
};

module.exports = {
    subscribeBasic,
    subscribePremium,
    getSubscriptionStatus,
    cancelSubscription
};