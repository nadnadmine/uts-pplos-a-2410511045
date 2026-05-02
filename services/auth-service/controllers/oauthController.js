const axios = require("axios");
const userModel = require("../models/userModel");
const { issueTokenPair } = require("./authController");

function githubRedirect(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user user:email",
    state: Math.random().toString(36).slice(2)
  });

  return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

async function githubCallback(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ message: "GitHub authorization code is required" });
  }

  const tokenResponse = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URL
    },
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "clinic-reservation-uts"
      },
      validateStatus: () => true
    }
  );

  if (!tokenResponse.data.access_token) {
    return res.status(401).json({
      message: "Failed to exchange GitHub authorization code",
      github_error: tokenResponse.data.error || "unknown_error",
      github_error_description: tokenResponse.data.error_description || "The code may be expired, already used, or generated for a different callback URL"
    });
  }

  const githubHeaders = {
    Authorization: `Bearer ${tokenResponse.data.access_token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "clinic-reservation-uts"
  };

  const [profileResponse, emailResponse] = await Promise.all([
    axios.get("https://api.github.com/user", { headers: githubHeaders, validateStatus: () => true }),
    axios.get("https://api.github.com/user/emails", { headers: githubHeaders, validateStatus: () => true })
  ]);

  if (profileResponse.status !== 200) {
    return res.status(401).json({
      message: "Failed to fetch GitHub profile",
      github_status: profileResponse.status,
      github_response: profileResponse.data
    });
  }

  if (emailResponse.status !== 200) {
    return res.status(401).json({
      message: "Failed to fetch GitHub emails",
      github_status: emailResponse.status,
      github_response: emailResponse.data
    });
  }

  const primaryEmail =
    emailResponse.data.find((email) => email.primary && email.verified)?.email ||
    emailResponse.data.find((email) => email.primary)?.email ||
    profileResponse.data.email;
  if (!primaryEmail) {
    return res.status(422).json({ message: "GitHub account must expose at least one email" });
  }

  const user = await userModel.upsertOAuthUser({
    name: profileResponse.data.name || profileResponse.data.login,
    email: primaryEmail,
    avatarUrl: profileResponse.data.avatar_url,
    oauthId: String(profileResponse.data.id)
  });

  return res.json(await issueTokenPair(user));
}

module.exports = {
  githubRedirect,
  githubCallback
};
