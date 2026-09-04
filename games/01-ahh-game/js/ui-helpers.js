function pillHTML(icon, label, light = false) {
  return `<div class="hud-pill${light ? " hud-pill--light" : ""}"><span class="icon">${icon}</span><span>${label}</span></div>`;
}

function cardHeaderHTML() {
  return `
    <img class="card-logo" src="${IMG.logo}" alt="AHH game logo" />
    <img class="card-frame" src="${IMG.startBoxFrame}" alt="" />
  `;
}
