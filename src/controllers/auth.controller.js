// controllers/auth.controller.js
const axios = require("axios");
const qs = require("querystring");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");

// Create an instance of CognitoIdentityServiceProvider
const cognitoISP = new AWS.CognitoIdentityServiceProvider();
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
    const response = await axios.post(
      `${process.env.BLOG_API_BASE_URL}/users`,
      userInfo,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`, // Pass access token for authentication if needed
        },
      }
    );

    console.log("API Response:", response.data);

    // Set authentication cookies
    console.log("Setting cookies with tokens:", tokens);
    setAuthCookies(res, tokens);

    return res.redirect("https://user.bywk.dev/dashboard");
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
  console.log("Setting cookies with options:", cookieOptions);
  res.cookie("id_token", id_token, cookieOptions);
  res.cookie("access_token", access_token, cookieOptions);
  res.cookie("refresh_token", refresh_token, cookieOptions);
  console.log("Cookies set successfully.");
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
  console.log("Hit loginGuest");
  try {
    // Prepare parameters for authentication
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH", // Use this flow for username/password
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: process.env.DEMO_USER,
        PASSWORD: process.env.DEMO_PASSWORD,
      },
    };
    console.log("Calling initiateAuth with params:", params);
    // Call Cognito to initiate authentication
    const authResult = await cognitoISP.initiateAuth(params).promise();
    console.log("Authentication result:", authResult);

    // Extract tokens from the response
    const tokens = {
      id_token: authResult.AuthenticationResult.IdToken,
      access_token: authResult.AuthenticationResult.AccessToken,
      refresh_token: authResult.AuthenticationResult.RefreshToken,
    };

    console.log("Hit loginGuest 222");
    // Decode ID token to extract user information
    const decodedToken = jwt.decode(tokens.id_token);
    const userInfo = {
      sub: decodedToken.sub,
      email: decodedToken.email || "demo@example.com",
      username: decodedToken["cognito:username"],
    };

    console.log("Demo User Info:", userInfo);

    // Call your API to check/create a user
    const response = await axios.post(
      "https://bt1a4zodne.execute-api.us-east-1.amazonaws.com/local/users",
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
  } catch (error) {
    console.error("Error during demo login:", error.message);
    return res.status(500).json({ error: "Demo login failed" });
  }
};

module.exports = {
  handleCallback,
  loginGuest,
};
