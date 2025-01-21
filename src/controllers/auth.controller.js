const axios = require("axios");
const {
  CognitoIdentityProviderClient,
  GlobalSignOutCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
require("dotenv").config();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

/**
 * -------------- CALLBACK HANDLER ----------------
 * Exchanges the authorization code for tokens after redirect from Cognito Hosted UI.
 */
const handleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code is missing.");
  }

  try {
    const tokenUrl = `https://${process.env.COGNITO_USER_POOL_DOMAIN}/oauth2/token`;
    const clientId = process.env.COGNITO_APP_CLIENT_ID;

    // Exchange code for tokens
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", clientId);
    params.append("code", code);
    params.append("redirect_uri", process.env.COGNITO_REDIRECT_URI);

    const response = await axios.post(tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { id_token, access_token, refresh_token } = response.data;

    // Set tokens in cookies
    res.cookie("idToken", id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.cookie("accessToken", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.cookie("refreshToken", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Redirect user to the dashboard or desired page
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error during token exchange:", error);
    res.status(500).send("Failed to authenticate user.");
  }
};

module.exports = {
  handleCallback,
};
