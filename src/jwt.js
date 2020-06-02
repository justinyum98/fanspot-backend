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

const verifyJWT = (token) => {
    const { id, username } = jwt.verify(token, process.env.JWT_SECRET);
    return { id, username };
};

module.exports = { generateJWT, verifyJWT };
