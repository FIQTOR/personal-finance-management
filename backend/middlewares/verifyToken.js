const jwt = require('jsonwebtoken');
const User = require('../models/user');
const RolePermission = require('../models/rolePermission');

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: "failed",
                message: "Authentication token is required"
            });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findByPk(decoded.id, {
            include: [{
                association: 'role',
                include: [{
                    association: 'permissions',
                    through: RolePermission
                }]
            }]
        });

        if (!user) {
            return res.status(401).json({
                status: "failed",
                message: "User account no longer exists"
            });
        }

        if (user.is_blocked) {
            return res.status(403).json({
                status: "failed",
                message: "Your account has been suspended"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: "failed",
                message: "Token expired"
            });
        }
        return res.status(401).json({
            status: "failed",
            message: "Invalid or corrupted token"
        });
    }
};

module.exports = verifyToken;
