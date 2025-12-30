const text_area = document.getElementById("text-area");
const accuracy = document.getElementById("accuracy");
const wpm = document.getElementById("wpm");
const time_left = document.getElementById("time");
const typing_area = document.getElementById("typying-area");
const test_over = document.getElementById("test-over");
const bar = document.getElementById("bar");
const final_accuracy = document.getElementById("final-accuracy");
const final_correct = document.getElementById("final-correct");
const final_wpm = document.getElementById("final-wpm");
const personal_best = document.getElementById("personal-best");
const final_wrong = document.getElementById("final-wrong");
const retry_button = document.getElementById("retry-button");
const start_button = document.getElementById("start-button");
const start_menu = document.getElementById("start-menu");

var data;
var current_ind = 0;
var text;
var wrong_set = new Set();
var correct_set = new Set();
var difficulty = "easy";
var mode = "passage";

var seconds_left;
var milli_seconds_passed = 0;
var word_count = 0;

var timer_interval;
var wpm_interval;

function setDifficulty(d) {
  document.getElementById(difficulty + "-button").classList.remove("active");
  difficulty = d;
  document.getElementById(difficulty + "-button").classList.add("active");
  console.log(`difficulty changed to ${difficulty}`);

  setUp();
}

function setMode(m) {
  document.getElementById(mode + "-button").classList.remove("active");
  mode = m;
  document.getElementById(mode + "-button").classList.add("active");
  console.log(`mode changed to ${mode}`);

  setUp();
}

function updateAccuracy() {
  accuracy.innerHTML = Math.floor(
    (correct_set.size / (correct_set.size + wrong_set.size)) * 100
  );
}

function updateTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  time_left.innerHTML =
    String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

function updateWPM() {
  const words = current_ind / 5;
  const seconds_passed = milli_seconds_passed / 1000;
  const raw_wpm = (words / seconds_passed) * 60;

  wpm.innerHTML = Math.floor((raw_wpm * accuracy.innerHTML) / 100);
}

function spawnStar2() {
  const layer = document.getElementById("stars-layer");
  const star = document.createElement("div");
  star.className = "star2";

  // Random position
  const x = Math.random() * window.innerWidth * 0.1 + window.innerWidth * 0.1;
  const y =
    Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2;

  // Random drift direction
  const dx = (Math.random() - 0.5) * 0 + "px";
  const dy = (Math.random() - 0.5) * 0 + "px";

  star.style.left = x + "px";
  star.style.top = y + "px";
  star.style.setProperty("--dx", dx);
  star.style.setProperty("--dy", dy);

  layer.appendChild(star);

  // Remove after a while
  setTimeout(() => {
    star.remove();
  }, 6000);
}

function spawnStar1() {
  const layer = document.getElementById("stars-layer");
  const star = document.createElement("div");
  star.className = "star1";

  // Random position
  const x = Math.random() * window.innerWidth * 0.1 + window.innerWidth * 0.8;
  const y =
    Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2;

  star.style.left = x + "px";
  star.style.top = y + "px";

  layer.appendChild(star);

  // Remove after a while
  setTimeout(() => {
    star.remove();
  }, 6000);
}

function spawnConfetti() {
  const confetti = document.getElementById("confetti");
  confetti.classList.remove("active");

  void confetti.offsetWidth;

  confetti.classList.add("active");
  setTimeout(() => {
    confetti.classList.remove("active");
  }, 1000);
}

async function loadData() {
  try {
    const response = await fetch("data.json");
    data = await response.json();
    console.log(data);
    return data;
  } catch (err) {
    console.error(err);
  }
}

function setUp() {
  let len = data[difficulty].length;
  let idx = Math.floor(Math.random() * len);
  text = data[difficulty][idx].text;
  console.log(`choosing ${difficulty} text number ${idx + 1}`);

  text_area.innerHTML = "";
  wpm.innerHTML = "0";
  accuracy.innerHTML = 100;

  wrong_set.clear();
  correct_set.clear();
  current_ind = 0;
  milli_seconds_passed = 0;
  word_count = 0;

  [...text].forEach((char) => {
    const span = document.createElement("span");
    span.textContent = char;
    text_area.appendChild(span);
  });

  text_area.onclick = () => {
    start();
  };
  text_area.children[0].classList.add("pending");

  if (mode === "passage") {
    time_left.innerHTML = "free";
  } else {
    seconds_left = Number(mode.replace(/\D/g, ""));
    updateTime(seconds_left);
  }
}

function start() {
  startedScreen();
  if (mode !== "passage") {
    timer_interval = setInterval(() => {
      seconds_left--;

      updateTime(seconds_left);

      if (seconds_left === 0) {
        finish();
      }
    }, 1000);
  }

  const rate = 1000;

  wpm_interval = setInterval(() => {
    milli_seconds_passed += rate;
    updateWPM();
  }, rate);
  const option_buttons = document.querySelectorAll(".options-button");

  option_buttons.forEach((b) => {
    b.disabled = true;
  });
}

function nextChar() {
  current_ind++;
  if (current_ind === text.length) {
    finish();
    return;
  } else {
    let span = text_area.children[current_ind];
    span.classList = ["pending"];
    span.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function removeChar() {
  if (current_ind === 0) return;
  let span = text_area.children[current_ind];
  span.classList = [];
  current_ind--;
  span = text_area.children[current_ind];
  span.classList = ["pending"];
}

function increaseCorrect() {
  let span = text_area.children[current_ind];
  span.classList = ["correct"];

  if (!wrong_set.has(current_ind) && !correct_set.has(current_ind)) {
    correct_set.add(current_ind);
  }
}

function increaseWrong() {
  let span = text_area.children[current_ind];
  span.classList = ["wrong"];

  if (!wrong_set.has(current_ind)) {
    wrong_set.add(current_ind);
    if (correct_set.has(current_ind)) {
      correct_set.delete(current_ind);
    }
  }
}

function handleKey(event) {
  let key = event.key;
  console.log(`key "${key}" code "${event.code}" pressed`);

  event.preventDefault();

  if (key === "Backspace") {
    removeChar();
    return;
  }

  if (key.length > 1) {
    return;
  }

  if (text[current_ind] === key) {
    increaseCorrect();
  } else {
    increaseWrong();
  }

  updateAccuracy();

  nextChar();
}

function notStartedScreen() {
  test_over.classList.add("hidden");
  bar.classList.remove("hidden");
  typing_area.classList.remove("hidden");
  start_menu.classList.remove("hidden");
  text_area.classList.add("blurred");

  const option_buttons = document.querySelectorAll(".options-button");

  option_buttons.forEach((b) => {
    b.disabled = false;
  });
}

function startedScreen() {
  document.addEventListener("keydown", handleKey);
  text_area.classList.remove("blurred");
  text_area.onclick = () => {};
  start_menu.classList.add("hidden");
}

function finish() {
  clearInterval(timer_interval);
  clearInterval(wpm_interval);
  document.removeEventListener("keydown", handleKey);
  test_over.classList.remove("hidden");
  bar.classList.add("hidden");
  typing_area.classList.add("hidden");

  updateAccuracy();
  updateWPM();

  final_accuracy.innerHTML = accuracy.innerHTML + "%";
  final_correct.innerHTML = correct_set.size;
  final_wrong.innerHTML = wrong_set.size;
  final_wpm.innerHTML = wpm.innerHTML;

  const completed_img = document.getElementById("completed-img");
  const completed_title = document.getElementById("completed-title");
  const completed_p = document.getElementById("completed-paragraph");

  // baseline established
  if (personal_best.innerHTML == 0) {
    personal_best.innerHTML = final_wpm.innerHTML;
    completed_img.src = "assets/images/icon-completed.svg";
    completed_title.innerHTML = "Baseline Established!";
    completed_p.innerHTML =
      "You've set the bar. Now the real challenge begins—time to beat it.";

    spawnStar2();
    spawnStar1();
    console.log("baseline established");
  }
  // record broken
  else if (final_wpm.innerHTML > personal_best.innerHTML) {
    personal_best.innerHTML = final_wpm.innerHTML;
    completed_img.src = "assets/images/icon-new-pb.svg";
    completed_title.innerHTML = "High Score Smashed!";
    completed_p.innerHTML =
      "You're getting faster. That was incredible typing.";

    console.log("record broken");
    spawnConfetti();
  }
  // normal well done
  else {
    completed_img.src = "assets/images/icon-completed.svg";
    completed_title.innerHTML = "Test Complete!";
    completed_p.innerHTML = "Solid run. Keep pushing to beat your high score.";
    spawnStar2();
    spawnStar1();

    console.log("normal test");
  }

  localStorage.setItem("personal-best", personal_best.innerHTML);
}

async function main() {
  notStartedScreen();
  await loadData();
  setUp();

  personal_best.innerHTML = localStorage.getItem("personal-best") || 0;

  start_button.onclick = () => {
    start();
  };

  retry_button.onclick = () => {
    notStartedScreen();
    setUp();
  };

  // setTimeout(() => {
  //   spawnConfetti();
  // }, 1000);
}

main();
