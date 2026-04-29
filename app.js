const colorTabs = Array.from(document.querySelectorAll("[data-color-tab]"));
const colorPanes = Array.from(document.querySelectorAll("[data-color-pane]"));
const priceTabs = Array.from(document.querySelectorAll("[data-price-tab]"));
const pricePanes = Array.from(document.querySelectorAll("[data-price-pane]"));
const scenarioButtons = Array.from(document.querySelectorAll("[data-scenario]"));

const legacyPageHashes = {
  "#mobility": "mobility.html",
  "#infrastructure": "infrastructure.html",
};

function redirectLegacyHash() {
  const legacyTarget = legacyPageHashes[window.location.hash];
  if (legacyTarget) {
    window.location.replace(legacyTarget);
  }
}

redirectLegacyHash();
window.addEventListener("hashchange", redirectLegacyHash);

const scenarios = {
  campus: {
    title: "Campus microgrid",
    copy:
      "Best for hospitals, universities, airports, and data centers that value long-duration backup. Use green hydrogen where clean power is available; store as compressed gas or through a nearby supplier contract.",
  },
  district: {
    title: "Industrial district",
    copy:
      "Best for ports, refineries, fertilizer, steel pilots, rail yards, and bus depots. Blue or green hydrogen can work if production, storage, and demand are clustered tightly enough to avoid expensive distribution.",
  },
  metro: {
    title: "Metro-scale backbone",
    copy:
      "Best only after anchor customers exist. Plan dedicated pipelines, geologic storage where available, emergency venting, hydrogen-rated compressors, and clear rules for which sectors get hydrogen first.",
  },
};

function showColor(colorName) {
  colorTabs.forEach((tab) => {
    const isActive = tab.dataset.colorTab === colorName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  colorPanes.forEach((pane) => {
    pane.classList.toggle("active", pane.dataset.colorPane === colorName);
  });
}

function showPrice(colorName) {
  priceTabs.forEach((tab) => {
    const isActive = tab.dataset.priceTab === colorName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  pricePanes.forEach((pane) => {
    pane.classList.toggle("active", pane.dataset.pricePane === colorName);
  });
}

function showScenario(name) {
  const scenario = scenarios[name];
  const title = document.getElementById("scenario-title");
  const copy = document.getElementById("scenario-copy");
  if (!scenario || !title || !copy) return;

  scenarioButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.scenario === name);
  });

  title.textContent = scenario.title;
  copy.textContent = scenario.copy;
}

colorTabs.forEach((tab) => {
  tab.addEventListener("click", () => showColor(tab.dataset.colorTab));
});

priceTabs.forEach((tab) => {
  tab.addEventListener("click", () => showPrice(tab.dataset.priceTab));
});

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => showScenario(button.dataset.scenario));
});
