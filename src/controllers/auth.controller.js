// controllers/auth.controller.js
const axios = require("axios");
const qs = require("querystring");
const jwt = require("jsonwebtoken");
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");

/**
 * -------------- Cognito Callback ----------------
 */
async function handleCallback(req, res) {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Authorization code is missing." });
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Decode ID token to extract user information
    const decodedToken = jwt.decode(tokens.id_token);

    // Map the fields appropriately
    const userInfo = {
      sub: decodedToken.sub,
      email: decodedToken.email,
      username: decodedToken["cognito:username"], // Map 'cognito:username' to 'username'
    };

    // Log the decoded and mapped user information
    console.log("Mapped User Info for API:", userInfo);

    // Call the API to Check/Create a user
    const response = await axios.post("http://localhost:8080/users", userInfo, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`, // Pass access token for authentication if needed
      },
    });

    console.log("API Response:", response.data);

    // Set authentication cookies
    setAuthCookies(res, tokens);

    return res.redirect("http://localhost:4000/dashboard");
  } catch (error) {
    console.error(
      "Error during callback handling:",
      error.response?.data || error.message
    );
    return res.status(500).json({ error: "Authentication callback failed." });
  }
}

function setAuthCookies(res, tokens) {
  const { id_token, access_token, refresh_token } = tokens;

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.APP_ENV === "production", // HTTPS only in production
    sameSite: "lax", // Adjust based on your use case
    domain: process.env.COOKIE_DOMAIN || "localhost", // Set your domain here
  };

  res.cookie("id_token", id_token, cookieOptions);
  res.cookie("access_token", access_token, cookieOptions);
  res.cookie("refresh_token", refresh_token, cookieOptions);
}

async function exchangeCodeForTokens(code) {
  const payload = {
    grant_type: "authorization_code",
    client_id: process.env.COGNITO_CLIENT_ID,
    redirect_uri: process.env.COGNITO_REDIRECT_URI,
    code,
  };

  const response = await axios.post(
    process.env.COGNITO_TOKEN_ENDPOINT,
    qs.stringify(payload),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  return response.data;
}

/**
 * -------------- LOGIN guest ----------------
 */
const loginGuest = async (req, res) => {
  try {
    const authenticationDetails =
      new AmazonCognitoIdentity.AuthenticationDetails({
        Username: process.env.DEMO_USER,
        Password: process.env.DEMO_PASSWORD,
      });

    const poolData = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      ClientId: process.env.COGNITO_CLIENT_ID,
    };

    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
      Username: process.env.DEMO_USER,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: async (result) => {
        const tokens = {
          id_token: result.getIdToken().getJwtToken(),
          access_token: result.getAccessToken().getJwtToken(),
          refresh_token: result.getRefreshToken().getToken(),
        };

        // Decode ID token to extract user information
        const decodedToken = jwt.decode(tokens.id_token);
        const userInfo = {
          sub: decodedToken.sub,
          email: decodedToken.email || "demo@example.com", // Provide a default if email is not available
          username: decodedToken["cognito:username"],
        };

        console.log("Demo User Info:", userInfo);

        // Call API to Check/Create a user (if needed)
        const response = await axios.post(
          "http://localhost:8080/users",
          userInfo,
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          }
        );

        console.log("API Response:", response.data);

        // Set authentication cookies
        setAuthCookies(res, tokens);

        return res.redirect("http://localhost:4000/dashboard");
      },
      onFailure: (err) => {
        console.error("Demo login failed:", err);
        return res.status(401).json({ error: "Demo login failed" });
      },
    });
  } catch (error) {
    console.error("Error during demo login:", error.message);
    return res.status(500).json({ error: "Demo login failed" });
  }
};

module.exports = {
  handleCallback,
  loginGuest,
};
