function pillHTML(icon, label, light = false) {
  return `<div class="hud-pill${light ? " hud-pill--light" : ""}"><span class="icon">${icon}</span><span>${label}</span></div>`;
}

function cardHeaderHTML() {
  return `
    <img class="card-logo" src="${IMG.logo}" alt="AHH game logo" />
    <img class="card-frame" src="${IMG.startBoxFrame}" alt="" />
  `;
}

const appRoot = document.getElementById("app-root");

function computeCardFit(card, containerRect) {
  card.style.transform = "scale(1)";
  const cardRect = card.getBoundingClientRect();
  if (cardRect.width === 0 || cardRect.height === 0) return null;
  let top = cardRect.top, bottom = cardRect.bottom, left = cardRect.left, right = cardRect.right;
  card.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
  });
  const margin = 0.94 / 1.05;
  const scale = Math.min(1, (containerRect.width * margin) / (right - left), (containerRect.height * margin) / (bottom - top));
  const cardCenterX = (cardRect.left + cardRect.right) / 2;
  const cardCenterY = (cardRect.top + cardRect.bottom) / 2;
  const fullCenterX = (left + right) / 2;
  const fullCenterY = (top + bottom) / 2;
  const dx = -(fullCenterX - cardCenterX) * scale;
  const dy = -(fullCenterY - cardCenterY) * scale;
  return { scale, dx, dy };
}

function applyCardFit(card, containerRect) {
  const fit = computeCardFit(card, containerRect);
  if (fit) card.style.transform = `translate(${fit.dx}px, ${fit.dy}px) scale(${fit.scale})`;
}

function fitCards() {
  const rootRect = appRoot.getBoundingClientRect();
  document.querySelectorAll(".card").forEach((card) => applyCardFit(card, rootRect));
}

function prepareCardEntrance(card) {
  const rootRect = appRoot.getBoundingClientRect();
  const fit = computeCardFit(card, rootRect);
  card.style.transform = "";
  card.style.setProperty("--fit-scale", fit ? fit.scale : 1);
  card.style.setProperty("--fit-dx", `${fit ? fit.dx : 0}px`);
  card.style.setProperty("--fit-dy", `${fit ? fit.dy : 0}px`);
}

function watchCardFrameLoad(root) {
  root.querySelectorAll(".card-frame").forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", fitCards);
  });
}
