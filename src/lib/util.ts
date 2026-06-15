import jwt from 'jsonwebtoken';

export const signJWT = (payload: object) => {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '7d', // Set an expiry
    });
};
