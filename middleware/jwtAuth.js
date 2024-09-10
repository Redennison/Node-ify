const jwt = require('jsonwebtoken');

// Middleware function for JWT authentication
function jwtAuth(req, res, next) {
    // Extract the token from the request body
    const { token } = req.body;

    try {
        // Verify the token
        const user = jwt.verify(token, process.env.JWT_SECRET);

        console.log('JWT authentication successful.')
        
        // If verification is successful, proceed to the next middleware
        next();
    } catch (err) {
        // If token verification fails, redirect the user to the homepage
        return res.redirect('/');
    }
}

module.exports = jwtAuth;
