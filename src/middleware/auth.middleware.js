// middleware/verify.token.js
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa"); // Install with `npm install jwks-rsa`
require("dotenv").config();

const client = jwksClient({
  jwksUri: process.env.COGNITO_JWKS_URI,
  cache: true, // Enable caching
  cacheMaxEntries: 5, // Default is 5 keys
  cacheMaxAge: 600000, // Cache keys for 10 minutes
});

function getKey(header, callback) {
  console.log("JWT Header received:", header);
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error("Error retrieving signing key:", err);
      return callback(err, null);
    }
    const signingKey = key.getPublicKey();
    console.log("Retrieved Signing Key:", signingKey);
    callback(null, signingKey);
  });
}

async function verifyToken(req, res, next) {
  // *** ADDITION: CHECK FOR TOKEN IN COOKIES IF AUTHORIZATION HEADER IS MISSING ***
  const authHeader = req.headers.authorization;
  let token;
  console.log("FUCKING COOKIES:", req.cookies);

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token; // Extract token from cookies
    console.log("Token retrieved from cookies:", token);
  }

  if (!token) {
    console.error("Unauthorized: No token provided.");
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }
  //*************************************************** */

  // Decode the token to inspect its claims
  const decodedToken = jwt.decode(token);
  console.log("Decoded Token:", decodedToken);

  if (!decodedToken) {
    console.error("Invalid JWT: Unable to decode token.");
    return res.status(401).json({ error: "Unauthorized: Invalid token." });
  }

  // Check the type of token and validate accordingly
  if (decodedToken.token_use === "id") {
    // Validate ID token
    jwt.verify(
      token,
      getKey,
      {
        audience: process.env.COGNITO_APP_CLIENT_ID, // Ensure the audience matches your app client ID
        issuer: process.env.COGNITO_ISSUER_URI, // Ensure the issuer matches your Cognito user pool
      },
      (err, decoded) => {
        if (err) {
          console.error("JWT Verification Error:", err.message);
          return res
            .status(401)
            .json({ error: "Unauthorized: Invalid token." });
        }

        req.user = decoded; // Attach decoded user info to the request
        next(); // Proceed to the next middleware
      }
    );
  } else if (decodedToken.token_use === "access") {
    // Validate Access token
    jwt.verify(
      token,
      getKey,
      {
        issuer: process.env.COGNITO_ISSUER_URI, // Ensure the issuer matches your Cognito user pool
      },
      (err, decoded) => {
        if (err) {
          console.error("JWT Verification Error:", err.message);
          return res
            .status(401)
            .json({ error: "Unauthorized: Invalid token." });
        }

        // Verify the client ID matches
        if (decoded.client_id !== process.env.COGNITO_APP_CLIENT_ID) {
          console.error(
            "JWT Verification Error: Access token client_id mismatch."
          );
          return res
            .status(401)
            .json({ error: "Unauthorized: Invalid client_id." });
        }

        req.user = decoded; // Attach decoded user info to the request
        next(); // Proceed to the next middleware
      }
    );
  } else {
    console.error("JWT Verification Error: Unknown token type.");
    return res.status(401).json({ error: "Unauthorized: Unknown token type." });
  }
}

module.exports = { verifyToken };
