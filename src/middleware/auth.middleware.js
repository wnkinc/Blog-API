// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");
require("dotenv").config();

// Cached JWKS Promise
let jwksPromise = null;

// Fetch JWKS with caching
const fetchJWKS = async () => {
  if (!jwksPromise) {
    console.log("Fetching JWKS...");
    const jwksUrl = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
    jwksPromise = axios.get(jwksUrl).then((response) => response.data.keys);
  }
  return jwksPromise;
};

const verifyToken = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const jwks = await fetchJWKS();

    const decodedHeader = jwt.decode(token, { complete: true });
    const kid = decodedHeader?.header?.kid;

    if (!kid) {
      return res.status(401).json({ error: "Invalid token." });
    }

    const jwk = jwks.find((key) => key.kid === kid);
    if (!jwk) {
      return res.status(401).json({ error: "Invalid token signature." });
    }

    const pem = jwkToPem(jwk);

    // Verify token
    jwt.verify(token, pem, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid token." });
      }

      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Failed to verify token." });
  }
};

module.exports = verifyToken;
