const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa"); // Install with `npm install jwks-rsa`
require("dotenv").config();

const client = jwksClient({
  jwksUri: process.env.COGNITO_JWKS_URI, // JWKS URI from Cognito
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
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Unauthorized: No token provided.");
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  const token = authHeader.split(" ")[1];
  console.log("Authorization Header Token:", token);

  // Decode the token to inspect its claims
  const decodedToken = jwt.decode(token);
  console.log("Decoded Token:", decodedToken);

  if (!decodedToken) {
    console.error("Invalid JWT: Unable to decode token.");
    return res.status(401).json({ error: "Unauthorized: Invalid token." });
  }

  // Check the type of token and validate accordingly
  if (decodedToken.token_use === "id") {
    console.log("Token Use: ID Token");
    console.log("ID Token Audience (aud):", decodedToken.aud);

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

        console.log("Decoded JWT Token:", decoded);
        req.user = decoded; // Attach decoded user info to the request
        next(); // Proceed to the next middleware
      }
    );
  } else if (decodedToken.token_use === "access") {
    console.log("Token Use: Access Token");
    console.log("Access Token Client ID:", decodedToken.client_id);

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

        console.log("Decoded JWT Token:", decoded);
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
