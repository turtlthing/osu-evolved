




const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

const username = loggedUser;
const token = localStorage.getItem("osuToken");
const topplay = JSON.parse(localStorage.getItem("topPlayData"));

if (loggedUser) {
  document.getElementById("loginButton").textContent = `Logged in as ${loggedUser}`;
}

else {
    window.location.href = "index.html";
}



function calcQuestLevel(experience) {
  if (experience < 100) {
    return 1;
  }

  return Math.floor(experience / 100);

}

const questPools = {
  daily: [
    { message: " Play 10 games", image: "assets/images/quests/quest1.png" },
    { message: " Achieve 98% accuracy in a game", image: "assets/images/quests/quest2.png" },
    { message: " Score 100,000 points in a game", image: "assets/images/quests/quest3.png" },
    { message: " Play a game with a friend", image: "assets/images/quests/quest4.png" },
    { message: " Complete a game without missing any notes", image: "assets/images/quests/quest5.png" }
  ],
  weekly: [
    { message: " Play 50 games", image: "assets/images/quests/quest1.png" },
    { message: " Achieve 95% accuracy in 10 games", image: "assets/images/quests/quest2.png" },
    { message: " Score 1,000,000 points", image: "assets/images/quests/quest3.png" },
    { message: " Play with a friend 5 times", image: "assets/images/quests/quest4.png" },
    { message: " Complete 5 games without missing any notes", image: "assets/images/quests/quest5.png" }
  ],
  monthly: [
    { message: " Play 200 games", image: "assets/images/quests/quest1.png" },
    { message: " Achieve 95% accuracy in 50 games", image: "assets/images/quests/quest2.png" },
    { message: " Score 10,000,000 points", image: "assets/images/quests/quest3.png" },
    { message: " Play with a friend 20 times", image: "assets/images/quests/quest4.png" },
    { message: " Complete 20 games without missing any notes", image: "assets/images/quests/quest5.png" }
  ]
};

const questExperienceRewards = {
  daily: 10,
  weekly: 50,
  monthly: 100
};

let questRefreshInterval;

function getCalendarPeriods(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekStart = new Date(year, date.getMonth(), date.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const weekYear = weekStart.getFullYear();
  const weekMonth = String(weekStart.getMonth() + 1).padStart(2, "0");
  const weekDay = String(weekStart.getDate()).padStart(2, "0");

  return {
    daily: `${year}-${month}-${day}`,
    weekly: `${weekYear}-${weekMonth}-${weekDay}`,
    monthly: `${year}-${month}`
  };
}

function generateQuests(type) {
  const availableQuests = [...questPools[type]];
  const quests = [];

  while (quests.length < 3 && availableQuests.length > 0) {
    const index = Math.floor(Math.random() * availableQuests.length);
    quests.push(availableQuests.splice(index, 1)[0]);
  }

  return quests;
}

function getQuestStorageKey(user) {
  return `osuQuests:${encodeURIComponent(user.toLowerCase())}`;
}

function getQuestProgress(state) {
  const progress = state.progress || {};
  return {
    dailyCompleted: Number.isSafeInteger(progress.dailyCompleted) ? progress.dailyCompleted : 0,
    weeklyCompleted: Number.isSafeInteger(progress.weeklyCompleted) ? progress.weeklyCompleted : 0,
    monthlyCompleted: Number.isSafeInteger(progress.monthlyCompleted) ? progress.monthlyCompleted : 0,
    experience: Number.isSafeInteger(progress.experience) ? progress.experience : 0
  };
}

function loadAndRenderQuests(user) {
  const storageKey = getQuestStorageKey(user);
  const periods = getCalendarPeriods();
  let savedQuests;
  const savedData = localStorage.getItem(storageKey);

  if (savedData) {
    try {
      savedQuests = JSON.parse(savedData);
    } catch (error) {
      console.warn("Saved quests were invalid; generating new quests.", error);
    }
  }

  if (!savedQuests || typeof savedQuests !== "object") {
    savedQuests = {};
  }

  for (const type of Object.keys(questPools)) {
    const savedSet = savedQuests[type];
    const hasValidQuests = savedSet && Array.isArray(savedSet.quests) &&
      savedSet.quests.length === 3 &&
      savedSet.quests.every(quest => quest && questPools[type].some(
        availableQuest => availableQuest.message === quest.message && availableQuest.image === quest.image
      ));

    if (!savedSet || savedSet.period !== periods[type] || !hasValidQuests) {
      savedQuests[type] = {
        period: periods[type],
        quests: generateQuests(type).map(quest => ({ ...quest, completed: false }))
      };
    } else {
      savedSet.quests.forEach(quest => {
        quest.completed = quest.completed === true;
      });
    }

    for (let slot = 1; slot <= 3; slot++) {
      const container = document.getElementById(`${type}-quest-${slot}`);
      if (!container) {
        throw new Error(`Missing quest container: ${type}-quest-${slot}`);
      }

      const quest = savedQuests[type].quests[slot - 1];
      container.innerHTML = `
        <img src="${quest.image}" alt="" width="100">
        <p>${quest.message}</p>
        <button class="quest-complete-button" type="button" ${quest.completed ? "disabled" : ""}>
          ${quest.completed ? "Completed" : `Complete (+${questExperienceRewards[type]} XP)`}
        </button>
        <p class="quest-action-status" aria-live="polite"></p>
      `;
      container.querySelector(".quest-complete-button").addEventListener("click", () => {
        try {
          completeQuest(user, type, slot);
        } catch (error) {
          console.error("Could not save quest completion.", error);
          container.querySelector(".quest-action-status").textContent =
            "Could not save completion. Please try again.";
        }
      });
    }
  }

  savedQuests.progress = getQuestProgress(savedQuests);
  localStorage.setItem(storageKey, JSON.stringify(savedQuests));
  renderQuestCountdowns();
}

function completeQuest(user, type, slot) {
  const storageKey = getQuestStorageKey(user);
  const savedData = localStorage.getItem(storageKey);
  if (!savedData) {
    throw new Error("Quest data is missing; reload the page and try again.");
  }

  let savedQuests;
  try {
    savedQuests = JSON.parse(savedData);
  } catch (error) {
    throw new Error("Could not read saved quest data.", { cause: error });
  }

  if (savedQuests[type]?.period !== getCalendarPeriods()[type]) {
    loadAndRenderQuests(user);
    return;
  }

  const quest = savedQuests[type]?.quests?.[slot - 1];
  if (!quest || quest.completed) {
    return;
  }

  quest.completed = true;
  const progress = getQuestProgress(savedQuests);
  progress[`${type}Completed`] += 1;
  progress.experience += questExperienceRewards[type];
  savedQuests.progress = progress;
  localStorage.setItem(storageKey, JSON.stringify(savedQuests));

  loadAndRenderQuests(user);
  renderQuestSummary(user);
}

function getNextQuestRefresh(type, date = new Date()) {
  if (type === "daily") {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  }
  if (type === "weekly") {
    const daysUntilMonday = (8 - date.getDay()) % 7 || 7;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntilMonday);
  }
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function formatTimeRemaining(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function renderQuestCountdowns() {
  const now = new Date();
  for (const type of Object.keys(questPools)) {
    const countdown = document.getElementById(`${type}-refresh`);
    if (countdown) {
      countdown.textContent = `Refreshes in ${formatTimeRemaining(getNextQuestRefresh(type, now) - now)}`;
    }
  }
}

function startQuestRefreshCountdown(user) {
  if (questRefreshInterval) {
    clearInterval(questRefreshInterval);
  }

  let currentPeriods = getCalendarPeriods();
  questRefreshInterval = setInterval(() => {
    const periods = getCalendarPeriods();
    const periodChanged = Object.keys(periods).some(type => periods[type] !== currentPeriods[type]);
    if (periodChanged) {
      currentPeriods = periods;
      loadAndRenderQuests(user);
      renderQuestSummary(user);
    }
    renderQuestCountdowns();
  }, 1000);
}

function renderQuestSummary(user) {
  const summary = document.getElementById("quest-progress-summary");
  if (!summary) {
    return;
  }

  const savedData = localStorage.getItem(getQuestStorageKey(user));
  const state = savedData ? JSON.parse(savedData) : {};
  const progress = getQuestProgress(state);
  summary.innerHTML = `
    <p>Quest Level: ${calcQuestLevel(progress.experience)}</p>
    <p>Daily Quests Completed (all time): ${progress.dailyCompleted}</p>
    <p>Weekly Quests Completed (all time): ${progress.weeklyCompleted}</p>
    <p>Monthly Quests Completed (all time): ${progress.monthlyCompleted}</p>
    <p>Total Quest Experience: ${progress.experience} XP</p>
  `;
}



async function loadProfile() {

  const errorBox = document.getElementById("errorMessage");

  errorBox.textContent = "";

  // 1. Empty input
  if (!username) {
    errorBox.textContent = "Please enter a valid username.";
    return;
  }

  try {
    loadAndRenderQuests(loggedUser);
    startQuestRefreshCountdown(loggedUser);

    // 2. Fetch profile
    const user = await getUserByUsername(loggedUser);
    console.log(user);  
    // If API returns HTML instead of JSON
    if (!user || typeof user !== "object") {
      errorBox.textContent = "Unexpected response from server.";
      return;
    }

    // If user not found
    if (user.error || user.status === 404) {
      errorBox.textContent = "User not found.";
      return;
    }

    const profileLink = `https://osu.ppy.sh/users/${user.id}`;
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
      </span>
    `;

    
  document.getElementById("profilemain_b").innerHTML = `
      <h1> Quests </h1>
      <div id="quest-progress-summary" aria-live="polite"></div>
      
    `;

    renderQuestSummary(loggedUser);







}


  




  
  
  
  catch (err) {
    // 5. Catch server errors, JSON errors, network errors
    errorBox.textContent = "Something went wrong. Please try again.";
    console.error(err);
  }

  
}





function accuracy_fixed(accuracy) {
  return (accuracy * 100).toFixed(2) + " %";
}
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



// 2. define getUserByUsername SECOND
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

if (loggedUser) {
  loadProfile();
}
