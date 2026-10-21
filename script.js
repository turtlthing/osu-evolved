const params = new URLSearchParams(window.location.search);
const loggedUser = params.get("user");
const user = JSON.parse(localStorage.getItem("osuUser"));
const token = localStorage.getItem("osuToken");

// login with osu! OAuth
document.getElementById("loginButton").addEventListener("click", () => {
  const params = new URLSearchParams({
    client_id: 65956,
    redirect_uri: "http://localhost:3000/callback",
    response_type: "code",
    scope: "identify"
  });

  window.location.href = `https://osu.ppy.sh/oauth/authorize?${params.toString()}`;
});


// access to osu! api
async function getToken() {
  const response = await fetch("http://localhost:3000/token", {
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

// fetch user data by username
async function getUserByUsername(username) {
  const token = await getToken();

  const response = await fetch(
    `http://localhost:3000/user/${encodeURIComponent(username)}`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    }
  );

  return await response.json();
}


function accuracy_fixed(accuracy) {
  return (accuracy * 100).toFixed(2) + " %";
}

// calculate playtime 
function wow_playtime(playtime) {
  const hours = Math.floor(playtime / 3600).toFixed(2);
  const days = (hours / 24).toFixed(2);

  let statement = "";

  if (days < 1) {
    statement = "wow, you have played less than a day!";
  } else if (days < 7) {
    statement = "wow, you have played less than a week!";
  } else if (days < 30) {
    statement = "wow, you have a decent playtime!";
  } else {
    statement = "wow, you have a lot of playtime! get off the game and go outside!";
  }

  return days + " days: " + statement;
}

// calculate join date 
function wow_joindate(joinDate, days) {
  const join = new Date(joinDate);
  const now = new Date();
  const diffTime = Math.abs(now - join);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statement = "";

  if (diffDays < 30) {
    statement = "wow, you joined not long ago!";
  } else if (diffDays < 365) {
    statement = "wow, you've been with us for a bit!";
  } else if (diffDays < 730) {
    statement = "wow, you're getting the hang of it!";
  } else if (diffDays < 3500) {
    statement = "wow, you're a true legend!";
  } else {
    statement = "wow, uncle you need to get a life!";
  }

  return diffDays + " days: " + statement;
}

// search button
document.getElementById("searchButton").addEventListener("click", async () => {

  const username = document.getElementById("searchInput").value.trim();
  const errorBox = document.getElementById("errorMessage");
  
  errorBox.textContent = "";

  if (!username) {
    errorBox.textContent = "Please enter a valid username.";
    return;
  }

  try {

    const user = await getUserByUsername(username);
    console.log("Fetched user:", user);


    if (!user || typeof user !== "object") {
      errorBox.textContent = "Unexpected response from server.";
      return;
    }


    if (user.error || user.status === 404) {
      errorBox.textContent = "User not found.";
      return;
    }

  const global_rank = user.statistics.global_rank ?? "User is inactive.";


    const profileLink = `https://osu.ppy.sh/users/${user.id}`;

// top row: button flag and profile link
// details: avatar, country, pp, rank, playcount, accuracy, max combo, level, join date, play time, join duration
    document.getElementById("profile").innerHTML = `

      <h2>

        <button id="profilebutton"> <h1> ${user.username} </h1> </button>
        <img src="https://flagsapi.com/${user.country.code}/flat/64.png" class="flag">
        <a href="${profileLink}" target="_blank" class="osulink">View osu! Profile</a>
      </h2>
      
      <img src="${user.avatar_url}" width="200">
      <p>Country: ${user.country.name}</p>
      <p>PP: ${user.statistics.pp}</p>
      <p>Global Rank: ${global_rank}</p>
      <p>Play Count: ${user.statistics.play_count}</p>
      <p>Accuracy: ${accuracy_fixed(user.statistics.accuracy)}</p>
      <p>Max Combo: ${user.statistics.maximum_combo}</p>
      <p>Level: ${user.statistics.level.current}</p>
      <p>Join Date: ${new Date(user.join_date).toLocaleDateString()}</p>
      <p>Play Time: ${wow_playtime(user.statistics.play_time)}</p>
      <p>Join Duration: ${wow_joindate(user.join_date, user.statistics.play_time)}</p>
    `;

    // save profile data, test transfer of data betwee
    localStorage.setItem("profileData", JSON.stringify(user));
    localStorage.setItem("test", 3);

    // Profile button
document.getElementById("profilebutton").addEventListener("click", async () => {
      window.location.href = "profile.html"

});

  // show top play
    const top = await getUserTop(username);


    localStorage.setItem("topPlayData", JSON.stringify(top));


    if (!Array.isArray(top) || top.length === 0) {
      document.getElementById("topplays").innerHTML = "<p>No top plays found.</p>";
      return;
    }
    
    const best = top[0];

    document.getElementById("topplay").innerHTML = `
      <h2>Top Play</h2>
      <div class="play">
        <img src="${best.beatmapset.covers.cover}" class="thumbnail">
        <h3>${best.beatmapset.title} [${best.beatmap.version}]</h3>
        <p><strong>PP:</strong> ${best.pp}</p>
        <p><strong>Accuracy:</strong> ${accuracy_fixed(best.accuracy)}</p>
        <p><strong>Mods:</strong> ${best.mods.join(", ") || "None"}</p>
        <p><strong>Combo:</strong> ${best.max_combo}x</p>
        <p><strong>Rank:</strong> ${best.rank}</p>
      </div>
    `;

  } catch (err) {

    errorBox.textContent = "Something went wrong. Please try again.";
    console.error(err);
  }
});


// search button
const input = document.getElementById("searchInput");
const button = document.getElementById("searchButton");

input.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    button.click();  
  }
});

// gets top plays of user
async function getUserTop(username) {
  const token = await getToken();

  const response = await fetch(
    `http://localhost:3000/user/${encodeURIComponent(username)}/top`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    }
  );

  return await response.json();
}


const response = await fetch(`http://localhost:3000/user/${user}`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});


// save profile data to localStorage

localStorage.setItem("loggedUser", JSON.stringify(loggedUser));
localStorage.setItem("profileData", JSON.stringify(user));


// quests section
if (loggedUser) {
  document.getElementById("loginButton").textContent = `Logged in as ${loggedUser}`;


  document.getElementById("quests").innerHTML = `
      <h1> Personal Quests</h1>
      <p> Welcome, ${loggedUser}! Click here to view your personal quests:</p>

      <button id="viewQuestsButton"> <span class="button-text"> View Quests</a></span> </button>
    `;
}


// Quests button
document.getElementById("viewQuestsButton").addEventListener("click", async () => {
      window.location.href = "quests.html"

});

// Home button
document.getElementById("homebutton").addEventListener("click", async () => {
      window.location.href = "index.html"

});

// Debugging logs
console.log(window.location.href);
console.log(params.get("user"));
console.log(localStorage.getItem("loggedUser"));
