// controller/auth.controller.js
require("dotenv").config();
const crypto = require("crypto");

const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const ClientId = process.env.COGNITO_APP_CLIENT_ID;
const ClientSecret = process.env.COGNITO_APP_CLIENT_SECRET;
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

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
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const secretHash = calculateSecretHash(username, ClientId, ClientSecret);

    const command = new SignUpCommand({
      ClientId,
      SecretHash: secretHash,
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
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const secretHash = calculateSecretHash(username, ClientId, ClientSecret);

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    });

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

/**
 * -------------- LOGOUT ----------------
 */
const logout = async (req, res) => {
  const accessToken = req.header("Authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    return res
      .status(400)
      .json({ error: "Access token is required for logout." });
  }

  try {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await cognitoClient.send(command);

    res.status(200).json({ message: "Successfully logged out." });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: error.message || "Failed to log out." });
  }
};

module.exports = {
  signup,
  login,
  logout,
};
