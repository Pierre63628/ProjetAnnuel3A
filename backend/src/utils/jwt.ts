import jwt, { SignOptions } from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';

export const generateTokens = (userId: number) => {
    const accessToken = jwt.sign({ userId }, jwtConfig.accessToken.secret, {
        expiresIn: jwtConfig.accessToken.expiresIn
    } as SignOptions);

    const refreshToken = jwt.sign({ userId }, jwtConfig.refreshToken.secret, {
        expiresIn: jwtConfig.refreshToken.expiresIn
    } as SignOptions);

    return { accessToken, refreshToken };
};

export const calculateExpiryDate = (): Date => {
    const expiresIn = jwtConfig.refreshToken.expiresIn;
    const expiry = new Date();

    if (typeof expiresIn === 'string') {
        const value = parseInt(expiresIn.slice(0, -1));
        const unit = expiresIn.at(-1);
        switch (unit) {
            case 'd':
                expiry.setDate(expiry.getDate() + value);
                break;
            case 'h':
                expiry.setHours(expiry.getHours() + value);
                break;
            case 'm':
                expiry.setMinutes(expiry.getMinutes() + value);
                break;
            default:
                expiry.setDate(expiry.getDate() + 7);
        }
    } else {
        expiry.setSeconds(expiry.getSeconds() + Number(expiresIn));
    }

    return expiry;
};
