import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// BACKEND TOKEN FUNCTION
async function getToken() {
  const response = await fetch("https://osu.ppy.sh/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: 65956,
      client_secret: "wZI0OksPUV9BRzPGW8FSCzVC19DA5Fu1pj9rGdkT",
      grant_type: "client_credentials",
      scope: "public"
    })
  });

  return await response.json();
}

// ROUTE: GET TOKEN (frontend calls this)
app.post("/token", async (req, res) => {
  const response = await fetch("https://osu.ppy.sh/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();
  res.json(data);
});

// ROUTE: GET USER PROFILE
app.get("/user/:username", async (req, res) => {
  const token = req.headers.authorization;

  const response = await fetch(
    `https://osu.ppy.sh/api/v2/users/${encodeURIComponent(req.params.username)}?key=username`,
    {
      headers: { Authorization: token }
    }
  );

  const data = await response.json();
  res.json(data);
});

// ROUTE: GET USER TOP PLAYS
app.get("/user/:username/top", async (req, res) => {
  const username = req.params.username;
  const token = await getToken();

  // First get user ID
  const userRes = await fetch(
    `https://osu.ppy.sh/api/v2/users/${encodeURIComponent(username)}?key=username`,
    {
      headers: { Authorization: `Bearer ${token.access_token}` }
    }
  );
  const user = await userRes.json();

  if (!user.id) {
    return res.status(404).json({ error: "User not found" });
  }

  // Then get top plays
  const scoresRes = await fetch(
    `https://osu.ppy.sh/api/v2/users/${user.id}/scores/best?limit=50`,
    {
      headers: { Authorization: `Bearer ${token.access_token}` }
    }
  );
  const scores = await scoresRes.json();

  res.json(scores);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  const tokenRes = await fetch("https://osu.ppy.sh/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: 65956,
      client_secret: "wZI0OksPUV9BRzPGW8FSCzVC19DA5Fu1pj9rGdkT",
      code: code,
      grant_type: "authorization_code",
      redirect_uri: "http://localhost:3000/callback"
    })
  });

  const token = await tokenRes.json();

  // Now you have the user's access token
  // Fetch their profile:
  const userRes = await fetch("https://osu.ppy.sh/api/v2/me", {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });

  const user = await userRes.json();

  // Redirect back to your frontend with the username
  res.redirect(`http://127.0.0.1:5500/index.html?user=${user.username}`);
});




app.get("/callback", async (req, res) => {
  res.send("Callback reached!");
});

app.get("/osekai/pp", async (req, res) => {
  const { map, acc, mods } = req.query;

  if (!map || !acc) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const url = `https://osekai.net/api/pp?map=${map}&acc=${acc}&mods=${mods || ""}`;
    console.log("Fetching:", url);

    const response = await fetch(url);

    // Log raw response text for debugging
    const raw = await response.text();
    console.log("Raw Osekai response:", raw);

    // Try parsing JSON
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse error:", e);
      return res.status(500).json({ error: "Osekai returned non-JSON", raw });
    }

    res.json(data);

  } catch (err) {
    console.error("Osekai error:", err);
    res.status(500).json({ error: "Failed to fetch Osekai PP" });
  }
});

// START SERVER (MUST BE LAST)
app.listen(3000, () => console.log("Proxy running on http://localhost:3000"));
