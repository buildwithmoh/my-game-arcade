let character = "female";
let color = "red";
const lives = 3;
let bestScore = parseInt(localStorage.getItem("ahhRunnerBest") || "0", 10) || 0;

const root = document.getElementById("app-root");

function getViewportSize() {
  if (window.visualViewport) {
    return { w: window.visualViewport.width, h: window.visualViewport.height };
  }
  return {
    w: window.innerWidth || document.documentElement.clientWidth || 1440,
    h: window.innerHeight || document.documentElement.clientHeight || 1024,
  };
}

function getScale() {
  const { w, h } = getViewportSize();
  return Math.min(w / 1440, h / 1024);
}

let stageEl;
function applyScale() {
  const { w, h } = getViewportSize();
  root.style.width = w + "px";
  root.style.height = h + "px";
  if (stageEl) stageEl.style.transform = `scale(${getScale()})`;
}

window.addEventListener("resize", applyScale);
window.addEventListener("orientationchange", () => setTimeout(applyScale, 50));
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", applyScale);
}

root.innerHTML = `
  <div id="stage" style="width:1440px;height:1024px;flex-shrink:0;position:relative;overflow:hidden;transform-origin:center center;font-family:'Lakki Reddy', cursive;">
    <img src="${IMG.background}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;" />

    <div id="selectionScreen" style="position:absolute;inset:0;opacity:1;transition:opacity 0.4s ease;z-index:3;">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.42);z-index:4;"></div>

      <div style="position:absolute;top:20px;right:24px;z-index:10;display:flex;flex-direction:row;gap:7px;align-items:center;">
        ${pillHTML("❤️", `Live: ${lives}`, true)}
        ${pillHTML("🪙", "Coins: 0", true)}
        ${pillHTML("⭐", `<span id="bestPill">Best: ${bestScore}</span>`, true)}
      </div>

      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:5;">
        <div class="card">
          ${cardHeaderHTML()}

          <div class="card-interior" style="padding-left:16px;padding-right:16px;">
            <p style="font-family:'Lakki Reddy', cursive;font-size:15px;color:rgb(169,118,1);text-align:center;margin:0;line-height:1.3;height:20px;">
              Choose your character and outfit color, then jump in
            </p>

            <div style="display:flex;flex-direction:row;align-items:center;justify-content:center;row-gap:14px;column-gap:24px;">
              <img id="femaleCharImg" alt="Female character" class="char-selected" style="width:180px;cursor:pointer;" />

              <div id="colorPicker" style="display:flex;flex-direction:column;align-items:center;gap:4px;"></div>

              <img id="maleCharImg" alt="Male character" class="char-unselected" style="width:180px;cursor:pointer;" />
            </div>

            <p style="font-family:'Lakki Reddy', cursive;font-size:11px;color:rgb(169,118,1);text-align:center;margin:0;">
              Space /↑/ Tap to jump – tap again mid-air to double jump
            </p>
          </div>

          <img id="startButtonImg" src="${IMG.startButton}" alt="Start game" style="position:absolute;bottom:-46px;left:50%;transform:translateX(-50%);width:316px;z-index:7;cursor:pointer;transition:transform 0.15s, filter 0.15s;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.35));" />
        </div>
      </div>
    </div>

    <div id="gameplayMount" style="position:absolute;inset:0;display:none;width:1440px;height:1024px;"></div>
  </div>
`;

stageEl = document.getElementById("stage");
applyScale();

const femaleCharImg = document.getElementById("femaleCharImg");
const maleCharImg   = document.getElementById("maleCharImg");

function refreshCharacterRow() {
  femaleCharImg.src = character === "female" ? FEMALE_BY_COLOR[color] : IMG.femaleUnselected;
  femaleCharImg.className = character === "female" ? "char-selected" : "char-unselected";
  maleCharImg.src = character === "male" ? MALE_BY_COLOR[color] : IMG.maleUnselected;
  maleCharImg.className = character === "male" ? "char-selected" : "char-unselected";
}
femaleCharImg.addEventListener("click", () => { character = "female"; refreshCharacterRow(); });
maleCharImg.addEventListener("click",   () => { character = "male";   refreshCharacterRow(); });
refreshCharacterRow();

const colorPicker = document.getElementById("colorPicker");
function refreshColorPicker() {
  colorPicker.innerHTML = "";
  COLOR_OPTIONS.forEach(({ id, label, selectedImg, unselectedImg }) => {
    const isSelected = color === id;
    const img = document.createElement("img");
    img.src = isSelected ? selectedImg : unselectedImg;
    img.alt = label;
    img.style.width = "24px";
    img.style.cursor = "pointer";
    img.style.transform = isSelected ? "scale(1.18)" : "scale(1)";
    img.style.opacity = isSelected ? "1" : "0.45";
    img.style.transition = "transform 0.15s, opacity 0.15s";
    img.addEventListener("click", () => {
      color = id;
      refreshColorPicker();
      refreshCharacterRow();
    });
    colorPicker.appendChild(img);
  });
}
refreshColorPicker();

const startButtonImg = document.getElementById("startButtonImg");
startButtonImg.addEventListener("mouseenter", () => {
  startButtonImg.style.transform = "translateX(-50%) scale(1.04)";
  startButtonImg.style.filter = "drop-shadow(0 5px 14px rgba(0,0,0,0.45)) brightness(1.06)";
});
startButtonImg.addEventListener("mouseleave", () => {
  startButtonImg.style.transform = "translateX(-50%)";
  startButtonImg.style.filter = "drop-shadow(0 3px 8px rgba(0,0,0,0.35))";
});
startButtonImg.addEventListener("click", handleStart);

const selectionScreen = document.getElementById("selectionScreen");
const gameplayMount    = document.getElementById("gameplayMount");
let currentCleanup = null;

function handleStart() {
  selectionScreen.style.opacity = "0";
  setTimeout(() => {
    selectionScreen.style.display = "none";
    gameplayMount.style.display = "block";
    currentCleanup = mountGameplay(character, color, {
      initialLives: lives,
      bestScore,
      onExit: handleExit,
      onBestScore: (newBest) => { bestScore = newBest; },
    });
  }, 420);
}

function handleExit() {
  if (currentCleanup) { currentCleanup(); currentCleanup = null; }
  gameplayMount.style.display = "none";
  gameplayMount.innerHTML = "";
  selectionScreen.style.display = "block";
  requestAnimationFrame(() => { selectionScreen.style.opacity = "1"; });
  document.getElementById("bestPill").textContent = `Best: ${bestScore}`;
}
