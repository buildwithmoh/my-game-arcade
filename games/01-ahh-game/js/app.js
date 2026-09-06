let character = "female";
let color = "red";
const lives = 3;
let bestScore = parseInt(localStorage.getItem("ahhRunnerBest") || "0", 10) || 0;
let currentGame = null;

document.addEventListener("visibilitychange", () => {
  if (currentGame) currentGame.setPaused(document.hidden);
});

appRoot.innerHTML = `
  <div id="stage">
    <img class="bg-image" src="${IMG.background}" alt="" />

    <div id="selectionScreen">
      <div class="dim-backdrop"></div>

      <div class="hud-row">
        ${pillHTML("❤️", `Live: ${lives}`, true)}
        ${pillHTML("🪙", "Coins: 0", true)}
        ${pillHTML("⭐", `<span id="bestPill">Best: ${bestScore}</span>`, true)}
      </div>

      <div class="center-wrap">
        <div class="card">
          ${cardHeaderHTML()}

          <div class="card-interior card-interior--selection">
            <p class="tagline">Choose your character and outfit color, then jump in</p>

            <div class="picker-row">
              <img id="femaleCharImg" alt="Female character" class="char-portrait char-selected" />
              <div id="colorPicker" class="color-picker"></div>
              <img id="maleCharImg" alt="Male character" class="char-portrait char-unselected" />
            </div>

            <p class="hint">Space /↑/ Tap to jump – keep tapping mid-air to climb higher</p>
          </div>

          <img id="startButtonImg" src="${IMG.startButton}" alt="Start game" class="primary-button primary-button--start" />
        </div>
      </div>
    </div>

    <div id="gameplayMount"></div>
  </div>
`;

fitCards();

watchCardFrameLoad(document);

const selectionHud = document.querySelector("#selectionScreen .hud-row");

function fitSelectionHud() {
  selectionHud.style.transform = "scale(1)";
  const hudRect = selectionHud.getBoundingClientRect();
  const leftMargin = 12;
  const available = hudRect.right - leftMargin;
  if (hudRect.width > available) {
    const shrink = Math.max(0.6, available / hudRect.width);
    selectionHud.style.transform = `scale(${shrink})`;
    selectionHud.style.transformOrigin = "top right";
  }
}
fitSelectionHud();

function handleSelectionViewportChange() {
  fitCards();
  fitSelectionHud();
}
window.addEventListener("resize", handleSelectionViewportChange);
window.addEventListener("orientationchange", () => setTimeout(handleSelectionViewportChange, 50));
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleSelectionViewportChange);
}

const femaleCharImg = document.getElementById("femaleCharImg");
const maleCharImg   = document.getElementById("maleCharImg");

function refreshCharacterRow() {
  femaleCharImg.src = character === "female" ? FEMALE_BY_COLOR[color] : IMG.femaleUnselected;
  femaleCharImg.className = "char-portrait " + (character === "female" ? "char-selected" : "char-unselected");
  maleCharImg.src = character === "male" ? MALE_BY_COLOR[color] : IMG.maleUnselected;
  maleCharImg.className = "char-portrait " + (character === "male" ? "char-selected" : "char-unselected");
}
femaleCharImg.addEventListener("click", () => { playClick(); character = "female"; refreshCharacterRow(); });
maleCharImg.addEventListener("click",   () => { playClick(); character = "male";   refreshCharacterRow(); });
refreshCharacterRow();

const colorPicker = document.getElementById("colorPicker");
function refreshColorPicker() {
  colorPicker.innerHTML = "";
  COLOR_OPTIONS.forEach(({ id, label, selectedImg, unselectedImg }) => {
    const isSelected = color === id;
    const img = document.createElement("img");
    img.src = isSelected ? selectedImg : unselectedImg;
    img.alt = label;
    img.className = "color-swatch" + (isSelected ? " is-selected" : "");
    img.addEventListener("click", () => {
      playClick();
      color = id;
      refreshColorPicker();
      refreshCharacterRow();
    });
    colorPicker.appendChild(img);
  });
}
refreshColorPicker();

const startButtonImg = document.getElementById("startButtonImg");
startButtonImg.addEventListener("click", () => { playStart(); handleStart(); });

const selectionScreen = document.getElementById("selectionScreen");
const gameplayMount    = document.getElementById("gameplayMount");

function startGame() {
  currentGame = mountGameplay(character, color, {
    initialLives: lives,
    bestScore,
    onMainMenu: handleMainMenu,
    onPlayAgain: handlePlayAgain,
    onBestScore: (newBest) => { bestScore = newBest; },
  });
  currentGame.setPaused(document.hidden);
}

function handleStart() {
  selectionScreen.classList.add("is-fading");
  setTimeout(() => {
    selectionScreen.classList.add("is-hidden");
    gameplayMount.classList.add("is-active");
    startGame();
  }, 420);
}

function handlePlayAgain() {
  if (currentGame) { currentGame.cleanup(); currentGame = null; }
  startGame();
}

function handleMainMenu() {
  if (currentGame) { currentGame.cleanup(); currentGame = null; }
  gameplayMount.classList.remove("is-active");
  gameplayMount.innerHTML = "";
  selectionScreen.classList.remove("is-hidden");
  requestAnimationFrame(() => { selectionScreen.classList.remove("is-fading"); });
  document.getElementById("bestPill").textContent = `Best: ${bestScore}`;
}
