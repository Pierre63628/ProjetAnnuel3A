import dotenv from 'dotenv';

dotenv.config();

export default {
    accessToken: {
        secret: process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret_key',
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h'
    },
    refreshToken: {
        secret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    }
};
