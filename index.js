let timerInterval;
let clickCount = 0;
let matchedCount = 0;
let totalPairs = 3;
let timeLeft = 60;
let gameStarted = false;
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let streak = 0;

const difficulties = {
  easy: { pairs: 2, time: 90 },
  medium: { pairs: 3, time: 60 },
  hard: { pairs: 4, time: 5 }
};

function setDifficulty(level) {
  totalPairs = difficulties[level].pairs;
  timeLeft = difficulties[level].time;
  $("#total").text(totalPairs);
  $("#left").text(totalPairs);
  $("#timer").text(timeLeft);

  $("#game_grid").removeClass("easy medium hard").addClass(level);

  $(".card").each((i, el) => {
    if (i < totalPairs * 2) {
      $(el).show().removeClass("flip");
    } else {
      $(el).hide().removeClass("flip");
    }
  });
}

async function fetchPokemonList() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=150");
  return (await res.json()).results;
}

async function getPokemonImage(url) {
  const res = await fetch(url);
  await new Promise(resolve => setTimeout(resolve, 150));
  return (await res.json()).sprites.front_default;
}

async function shuffleAndDeal() {
  const list = await fetchPokemonList();
  const sel = [];
  while (sel.length < totalPairs) {
    const p = list[Math.floor(Math.random() * list.length)];
    if (!sel.some(x => x.name === p.name)) sel.push(p);
  }

  const deck = [...sel, ...sel].sort(() => Math.random() - 0.5);
  const activeCards = $(".card:visible");

  for (let i = 0; i < activeCards.length; i++) {
    const poke = deck[i];
    const imageUrl = await getPokemonImage(poke.url);

    const img = new Image();
    img.src = imageUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    $(activeCards[i]).find(".front_face").attr("src", imageUrl).attr("data-name", poke.name);
  }
}

function resetBoardState() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function unflip() {
  $(firstCard).closest(".card").removeClass("flip");
  $(secondCard).closest(".card").removeClass("flip");
  streak = 0;
  resetBoardState();
}

function cardClick() {
  if (!gameStarted || lockBoard || $(this).hasClass("flip")) return;

  $(this).addClass("flip");
  clickCount++;
  $("#clicks").text(clickCount);

  const img = $(this).find(".front_face")[0];

  if (!firstCard) {
    firstCard = img;
    return;
  }

  secondCard = img;
  lockBoard = true;

  if ($(firstCard).data("name") === $(secondCard).data("name")) {
    matchedCount++;
    streak++;
    $("#matched").text(matchedCount);
    $("#left").text(totalPairs - matchedCount);
    resetBoardState();

    if (streak >= 2) {
      $("#powerUpBtn").show();
    }

    if (matchedCount === totalPairs) {
      clearInterval(timerInterval);
      $("#win_msg").show();
      $("#startBtn").prop("disabled", false);
      $("#resetBtn").prop("disabled", true);
      gameStarted = false;
    }
  } else {
    setTimeout(unflip, 1000);
  }
}

function startTimer() {
  timeLeft = difficulties[$("#difficulty").val()].time;
  $("#timer").text(timeLeft);
  timerInterval = setInterval(() => {
    timeLeft--;
    $("#timer").text(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      $("#game_over").show();
      $("#startBtn").prop("disabled", false);
      $("#resetBtn").prop("disabled", true);
      gameStarted = false;
    }
  }, 1000);
}

$(function () {
  setDifficulty($("#difficulty").val());
  $(".card").on("click", cardClick);
  $("#resetBtn").prop("disabled", true);

  $("#difficulty").on("change", () => {
    if (!gameStarted) {
      setDifficulty($("#difficulty").val());
    }
  });

  $("#startBtn").on("click", async () => {
    clearInterval(timerInterval);
    clickCount = 0;
    matchedCount = 0;
    lockBoard = false;
    streak = 0;
    resetBoardState();
    gameStarted = false;

    $("#clicks,#matched").text(0);
    $("#left").text(totalPairs);
    $("#game_over,#win_msg").hide();
    $("#startBtn").prop("disabled", true);
    $("#resetBtn").prop("disabled", false);
    $("#powerUpBtn").hide();
    $(".card").removeClass("flip");
    setDifficulty($("#difficulty").val());

    await shuffleAndDeal();

    gameStarted = true;
    startTimer();
  });

  $("#resetBtn").on("click", () => {
    window.location.reload();
  });

  $("#powerUpBtn").on("click", () => {
    timeLeft += 3;
    $("#timer").text(timeLeft);
    $("#powerUpBtn").hide();
    streak = 0;
  });

  let darkMode = false;
  $("#themeToggle").on("click", () => {
    darkMode = !darkMode;
    $("body").toggleClass("bg-dark text-light", darkMode);
    $("#gameContainer").toggleClass("bg-secondary-subtle", darkMode);
    $(".card").toggleClass("border-light", darkMode);
    $("#themeToggle").text(darkMode ? "Switch to Light Mode" : "Switch to Dark Mode");
  });
});
