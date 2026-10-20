const user = JSON.parse(localStorage.getItem("profileData"));
const topplay = JSON.parse(localStorage.getItem("topPlayData"));
const profileLink = `https://osu.ppy.sh/users/${user.id}`;
const test = localStorage.getItem("test");


const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
const token = localStorage.getItem("osuToken");

if (loggedUser) {
  document.getElementById("loginButton").textContent = `Logged in as ${loggedUser}`;
}

console.log(test);
console.log(loggedUser);

function wow_playtime(playtime) {
  const hours = Math.floor(playtime / 3600).toFixed(2);
  const days = (hours / 24).toFixed(2);

  if (days < 1) {
    return hours + " hours ";
  }
  return days + " days ";
}

function accuracy_fixed(accuracy) {
  return (accuracy * 100).toFixed(2) + " %";
}

async function showDetails(play) {

  if (play.score === 0) {
    var score = "Score was submitted on osu!lazer, which does not support score submission yet.";


  }



  document.getElementById("topplays_inflation").innerHTML = `

  

    <img src="${play.beatmapset.covers.cover}" width="100%">
    <h2>${play.beatmapset.title} [${play.beatmap.version}]</h2>

    <div>

    <div class="play-details">
    <p> Artist: ${play.beatmapset.artist}</p>
    </div>

    <div class="play-details">
    <p> BPM: ${play.beatmap.bpm}</p>
    </div>

    <div class="play-details">
    <p> Mapper: ${play.beatmapset.creator}</p>
    </div>

    <div class="play-details">
    <p> View Map: <a href="https://osu.ppy.sh/beatmapsets/${play.beatmapset.id}#${play.beatmap.mode}/${play.beatmap.id}" target="_blank">Click Here</a></p>

    </div>

    <div>

    <div class="play-details">
    <p> Song Length: ${Math.floor(play.beatmap.total_length / 60)}:${(play.beatmap.total_length % 60).toString().padStart(2, '0')}</p>
    </div>

    <div class="play-details">
    <p> Stars: ${play.beatmap.difficulty_rating}</p>
    </div>

    </div>


    <div>

    <div class="play-details">
    <h2> Score: ${score}</h2>
    </div>

    <div class="play-details">
    <h2> Accuracy: ${accuracy_fixed(play.accuracy)}</h2>
    </div>

    <div class="play-details">
    <h2> Max Combo: ${play.max_combo}</h2>
    </div>

    <div class="play-details">
    <h2> Mods: ${play.mods.join(", ") || "None"}</h2>
    </div>

    </div>



    <div> 
    <div class="play-details_b">
    <h3>CS: ${play.beatmap.cs} &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; AR: ${play.beatmap.ar}  &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; OD: ${play.beatmap.accuracy}  &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; HP: ${play.beatmap.drain}</h3>
    </div>

    
   
    <div class="play-details_b">
    <h3>Date Submitted: ${new Date(play.created_at).toLocaleDateString()} </h3>
    </div>


    <div class="play-details_c">
    <h3>Rank: ${play.rank} </h3>
    </div>



    </div>


    

    

    <p>Rank: ${play.rank}</p>
    <p>Max Combo: ${play.max_combo}</p>
    <p>Mods: ${play.mods.join(", ") || "None"}</p>
    <p>Date Submitted: ${new Date(play.created_at).toLocaleDateString()}</p>
    </div>




    <p>PP: ${play.pp}</p>
    <p>Score: ${play.score}</p>
    <p>Accuracy: ${accuracy_fixed(play.accuracy)}</p>
  `;
}

if (!user) {
  document.getElementById("errorMessage").textContent = "No profile data found.";
} else {
  document.getElementById("profilemain_a").innerHTML = `
    <h2>${user.username}
        <a href="${profileLink}" target="_blank" class="osulink">View osu! Profile</a>
    </h2>
    <img src="${user.avatar_url}" width="200">
    <span class="inline-text">
    <p>Global Rank: ${user.statistics.global_rank ?? "Inactive"}</p>
    <p>PP: ${user.statistics.pp}</p>
    <p>Ranked Score: ${user.statistics.ranked_score}</p>
    <p>Play Time: ${wow_playtime(user.statistics.play_time)}</p>
    <p>Join Date: ${new Date(user.join_date).toLocaleDateString()}</p>


  `;
}

if (Array.isArray(topplay) && topplay.length > 0) {
  const best = topplay[0];
  document.getElementById("topplay").innerHTML = `
    <h2>Top Play</h2>
    <img src="${best.beatmapset.covers.cover}" width="100%">

    <p>${best.beatmapset.title} [${best.beatmap.version}]</p>
    <p>PP: ${best.pp}</p>
    <p>Score: ${best.score}</p>
    <p>Accuracy: ${accuracy_fixed(best.accuracy)}</p>
    </span>
    
  `;
}


if (Array.isArray(topplay) && topplay.length > 0) {
  let html = "<h2>Top Plays</h2>";

  topplay.forEach((play, index) => {

    

    html += `
      <div class="play clickable" data-index="${index}">
        <div class="play-content">
        <img src="${play.beatmapset.covers.cover}" width="200">
        <span class="inline-text">
        <p>${play.beatmapset.title} [${play.beatmap.version}] </p>
        <p>PP: ${play.pp} Rank: ${play.rank}</p>
        </span>
        <p>Score: ${play.score} [${accuracy_fixed(play.accuracy)}] Max Combo: ${play.max_combo}</p>
        <p> Date Submitted: ${play.created_at} </p>
        </div>
        
      </div>

    `;
  });

  document.getElementById("topplays").innerHTML = html;
}

document.getElementById("topplays").addEventListener("click", (e) => {
  const card = e.target.closest(".play");
  if (!card) return;

  const index = card.dataset.index;
  const play = topplay[index];

  showDetails(play);
});


async function getPPBreakdown(play) {
    const mapId = play.beatmap.id;
    const acc = (play.accuracy * 100).toFixed(2);
    const mods = play.mods.join("");

    const url = `https://osekai.net/api/pp?map=${mapId}&acc=${acc}&mods=${mods}`;

    try {
        const res = await fetch(url);
        return await res.json();
    } catch (err) {
        console.error("Osekai error:", err);
        return null;
    }
}

document.getElementById("loginButton").addEventListener("click", () => {
  const params = new URLSearchParams({
    client_id: 65956,
    redirect_uri: "http://localhost:3000/callback",
    response_type: "code",
    scope: "identify"
  });

  window.location.href = `https://osu.ppy.sh/oauth/authorize?${params.toString()}`;
});


const params = new URLSearchParams(window.location.search);


