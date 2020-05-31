const jwt = require('jsonwebtoken');

const generateJWT = (id, username) => {
    return jwt.sign(
        {
            id,
            username,
        },
        process.env.JWT_SECRET,
        {
            issuer: 'Justin Yum',
            expiresIn: '2h',
        }
    );
};

module.exports = { generateJWT };
