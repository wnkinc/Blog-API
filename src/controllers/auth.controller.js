// controller/auth.controller.js
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const crypto = require("crypto");
require("dotenv").config();

// Configure Amazon Cognito Client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});
const ClientId = process.env.COGNITO_APP_CLIENT_ID;
const ClientSecret = process.env.COGNITO_APP_CLIENT_SECRET;

// Utility to calculate Amazon Cognito secret hash
const calculateSecretHash = (username, clientId, clientSecret) => {
  const hmac = crypto.createHmac("SHA256", clientSecret);
  hmac.update(username + clientId);
  return hmac.digest("base64");
};

/**
 * -------------- signup ----------------
 */
const signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Calculate the secret hash
    const secretHash = calculateSecretHash(username, ClientId, ClientSecret);

    // Sign up the user in Cognito
    const command = new SignUpCommand({
      ClientId,
      SecretHash: secretHash, // Include SecretHash in the request
      Username: username,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
    });

    const data = await cognitoClient.send(command);

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        username: data.UserSub,
        email,
      },
    });
  } catch (error) {
    console.error("Error during Cognito signup:", error);
    res
      .status(500)
      .json({ error: error.message || "An error occurred while signing up." });
  }
};

/**
 * -------------- LOGIN ----------------
 */
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Calculate the secret hash
    const secretHash = calculateSecretHash(username, ClientId, ClientSecret);

    // Initiate Auth command
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH", // Authentication flow for username/password
      ClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash, // Ensure this matches the calculated hash
      },
    });

    // Send the login request to Cognito
    const data = await cognitoClient.send(command);

    res.status(200).json({
      message: "Login successful.",
      tokens: {
        idToken: data.AuthenticationResult.IdToken,
        accessToken: data.AuthenticationResult.AccessToken,
        refreshToken: data.AuthenticationResult.RefreshToken,
      },
    });
  } catch (error) {
    console.error("Error during Cognito login:", error);
    res
      .status(401)
      .json({ error: error.message || "Invalid username or password." });
  }
};

module.exports = {
  signup,
  login,
};
