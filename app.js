(function(){
  "use strict";

  const STORAGE_KEY = "macomb-flood-response-platform-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const seasonMonths = {
    annual: [1,2,3,4,5,6,7,8,9,10,11,12],
    winter: [12,1,2],
    spring: [3,4,5],
    summer: [6,7,8],
    fall: [9,10,11]
  };

  const FEMA_NFHL_LAYER_QUERY = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query";
  const gisLayerCatalog = {
    rainElevation: {
      title: "Rain and elevation data",
      shortTitle: "Rain + elevation",
      source: "Open-Meteo weather, archive, geocoding, and elevation APIs",
      status: "Live lookup",
      detail: "Loads the selected area's elevation plus annual, seasonal, monthly, and daily rainfall for the chosen year.",
      url: "https://open-meteo.com/"
    },
    macomb: {
      title: "Macomb GIS layers",
      shortTitle: "Macomb GIS",
      source: "Macomb County GIS layer catalog",
      status: "County layer host",
      detail: "Holds county GIS layers such as basemap, boundaries, environmental assets, flood themes, imagery, and property context.",
      url: "https://gis.macombgov.org/home/layers.html"
    },
    fema: {
      title: "FEMA flood maps",
      shortTitle: "FEMA flood",
      source: "FEMA National Flood Hazard Layer",
      status: "Flood-zone point check",
      detail: "Checks the selected coordinate against FEMA flood hazard zone data when the public NFHL service responds.",
      url: "https://msc.fema.gov/portal/search"
    },
    drains: {
      title: "Drain maps",
      shortTitle: "Drain maps",
      source: "Macomb County Public Works drain maps",
      status: "County drain reference",
      detail: "Connects residents to official county drain maps for rivers, streams, county drains, and drainage-system context.",
      url: "https://www.macombgov.org/departments/public-works/public-works-resources/macomb-county-drain-maps"
    }
  };

  const damageTypes = [
    "Surface floodwater or rising water",
    "Sewer or drain backup",
    "Wind-driven rain through roof/window",
    "Plumbing or appliance leak",
    "Foundation seepage",
    "Mold after flood or leak",
    "Unknown or mixed source"
  ];

  const categories = [
    "Building structure",
    "Building systems",
    "Appliance",
    "Furniture",
    "Electronics",
    "Clothing and personal items",
    "Food or medication",
    "Vehicle",
    "Detached structure",
    "Cleanup or temporary living cost",
    "Unidentified item"
  ];

  const locations = [
    "Basement",
    "First floor",
    "Second floor",
    "Garage",
    "Detached structure",
    "Exterior",
    "Vehicle",
    "Unknown"
  ];

  const coverageRoutes = [
    "Flood insurance / NFIP",
    "Homeowners or renters insurance",
    "Sewer backup endorsement",
    "FEMA or local assistance",
    "Auto comprehensive",
    "Not likely covered / needs review"
  ];

  const assistanceCatalog = {
    electricity: {
      title: "Electricity shutoff or bill help",
      route: "Contact the electric provider for safety/restoration, then add utility assistance documentation if shutoff, repair, or bill support is needed.",
      documents: "Utility account number, shutoff notice, repair invoice, photos of damaged panel or outlets."
    },
    heat: {
      title: "Heat or HVAC loss",
      route: "Request licensed HVAC inspection and include loss of heat in the insurance and assistance packet.",
      documents: "HVAC report, serial/model numbers, photos, estimate, hotel or temporary heat receipts."
    },
    water: {
      title: "Water, sewer, or plumbing help",
      route: "Separate sewer backup, clean-water leak, and floodwater causes because coverage paths can differ.",
      documents: "Plumber report, utility notice, photos, cleanup invoices, backflow/sump records."
    },
    daycare: {
      title: "Daycare or school disruption",
      route: "Log childcare costs caused by displacement, cleanup, transportation, or unsafe home conditions.",
      documents: "Receipts, provider letters, work schedule impact, school closure notice."
    },
    housing: {
      title: "Housing or housing-cost support",
      route: "Track displacement dates, rent/mortgage pressure, and habitability issues for assistance screening.",
      documents: "Lease/mortgage statement, habitability notice, photos, income documents if requested."
    },
    hotel: {
      title: "Hotel or temporary lodging fees",
      route: "Add lodging receipts and the reason the home was unsafe or unavailable.",
      documents: "Hotel folios, dates, evacuation or safety notice, insurer additional-living-expense response."
    },
    repairs: {
      title: "Home repairs or cleanup",
      route: "Gather contractor estimates and separate emergency cleanup from rebuild or code-triggering repairs.",
      documents: "Estimates, invoices, mold reports, debris photos, repair scope."
    },
    food: {
      title: "Food replacement",
      route: "List food loss caused by power outage, refrigerator damage, evacuation, or contamination.",
      documents: "Photos, grocery estimate, power outage proof, SNAP/benefit information if relevant."
    },
    building: {
      title: "Building permits, elevation, or mitigation",
      route: "Ask the local building/floodplain office whether repair work triggers permits, elevation certificates, or substantial damage review.",
      documents: "Repair estimate, photos, elevation certificate if available, contractor scope, property record."
    }
  };

  const issueGuides = {
    flooding: {
      title: "Flooding now",
      body: "Use emergency mode first: life safety, utilities, safe shelter, then documentation. If water is actively rising, do not start the claim workflow until people are safe.",
      actions: [
        ["Open emergency steps", "#urgentHelp"],
        ["Find housing", "#housing"],
        ["Check map", "#gis"]
      ]
    },
    maps: {
      title: "Map and data",
      body: "Add the area you care about, then load rainfall, elevation, Macomb GIS context, FEMA flood-map status, and drain-map references for that exact place.",
      actions: [
        ["Open GIS visual", "#gis"],
        ["See data host", "#data-host"]
      ]
    },
    insurance: {
      title: "Insurance",
      body: "Start with the cause of damage: rising floodwater, sewer backup, wind-driven rain, pipe leak, seepage, or mixed source. Then check structure type, inside/outside damage, contents limits, and temporary housing gaps.",
      actions: [
        ["Open insurance engine", "#insurance"],
        ["Start claim packet", "#visuals"]
      ]
    },
    claim: {
      title: "Claim packet",
      body: "Upload photos, videos, receipts, and item lists. The site creates suggested damage items, asks you to verify them, adds them to inventory, and exports a printable ZIP packet.",
      actions: [
        ["Upload evidence", "#visuals"],
        ["Review inventory", "#inventory"],
        ["Build packet", "#packet"]
      ]
    },
    aid: {
      title: "Aid while waiting",
      body: "Track needs that insurance may not solve quickly: electricity, heat, water, daycare, food, rent, hotel fees, repairs, cleanup, and financial bridge support.",
      actions: [
        ["Open assistance", "#assistance"],
        ["Open housing", "#housing"]
      ]
    },
    housing: {
      title: "Where to stay",
      body: "Use this when the home is unsafe, utilities are off, mold or contamination is present, repairs block access, or a resident needs lodging while waiting on aid or reimbursement.",
      actions: [
        ["Open housing", "#housing"],
        ["Add hotel costs", "#packet"]
      ]
    },
    building: {
      title: "Rebuild stronger",
      body: "Use repair and building guidance to separate emergency cleanup from permit-triggering work, then plan resilience upgrades like raised utilities, drainage, sump backup, backflow valves, and flood-resistant materials.",
      actions: [
        ["Open building help", "building-repairs.html"],
        ["Read rules", "laws-codes.html"],
        ["Flood-proof home", "resilient-home.html"]
      ]
    },
    community: {
      title: "Help community",
      body: "Use the community layer to request or offer help, report repeated flood patterns, and coordinate resources like food, transportation, supplies, cleanup, and accessibility support.",
      actions: [
        ["Open community layer", "#community"],
        ["Report data in GIS", "#gis"]
      ]
    }
  };

  const defaultState = () => ({
    resident: {
      city: "",
      structureType: "Single-family home",
      foundation: "Basement",
      floodPolicy: "Unknown",
      homePolicy: "Unknown",
      damageCause: "Surface floodwater or rising water",
      waterDepth: "1 to 6 inches"
    },
    packet: { contactMethod: "Email" },
    uploads: [],
    pending: [],
    items: [],
    assistance: [],
    selectedIssue: "flooding",
    gis: {
      areas: [],
      selectedAreaId: "",
      selectedYear: new Date().getFullYear(),
      selectedSeason: "annual",
      selectedMonth: 0,
      selectedDay: new Date().toISOString().slice(0,10),
      activeLayer: "rainElevation"
    },
    weather: null,
    liveLocation: null
  });

  let state = defaultState();

  function uid(prefix){
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  }

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function money(value){
    const number = Number(value || 0);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(number);
  }

  function clamp(value, min = 0, max = 100){
    return Math.max(min, Math.min(max, value));
  }

  function optionsFor(options, selected){
    return options.map(option => `<option${option === selected ? " selected" : ""}>${escapeHtml(option)}</option>`).join("");
  }

  function sanitizeFileName(name){
    return String(name || "file").replace(/[^a-z0-9._ -]/gi, "_").replace(/\s+/g, "_").slice(0, 90);
  }

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if(saved && typeof saved === "object"){
        state = { ...defaultState(), ...saved };
        state.resident = { ...defaultState().resident, ...(saved.resident || {}) };
        state.packet = { ...defaultState().packet, ...(saved.packet || {}) };
        state.gis = { ...defaultState().gis, ...(saved.gis || {}) };
        state.gis.areas = Array.isArray(state.gis.areas) ? state.gis.areas : [];
        state.gis.areas = state.gis.areas.map(area => normalizeArea(area));
        if(!gisLayerCatalog[state.gis.activeLayer]) state.gis.activeLayer = "rainElevation";
        state.uploads = [];
        state.items = (saved.items || []).map(item => ({ ...item, receiptFile: null }));
      }
    }catch(error){
      console.warn("Could not load saved case", error);
      state = defaultState();
    }
  }

  function saveState(){
    const clean = {
      ...state,
      uploads: [],
      pending: state.pending.map(({ file, preview, ...entry }) => entry),
      items: state.items.map(({ receiptFile, ...item }) => item)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }

  function collectForm(form){
    const data = {};
    $$("input, select, textarea", form).forEach(field => {
      if(field.type === "file") return;
      data[field.id || field.name] = field.value;
    });
    return data;
  }

  function setFormValues(form, values){
    $$("input, select, textarea", form).forEach(field => {
      if(field.type === "file") return;
      const key = field.id || field.name;
      if(values[key] !== undefined) field.value = values[key];
    });
  }

  function selectedArea(){
    return state.gis.areas.find(area => area.id === state.gis.selectedAreaId) || state.gis.areas[0] || null;
  }

  function setSelectedArea(areaId){
    state.gis.selectedAreaId = areaId;
    const area = selectedArea();
    if(area){
      state.resident.city = area.name;
      const cityInput = $("#city");
      if(cityInput) cityInput.value = area.name;
    }
  }

  function setGisStatus(message, tone = "info"){
    const status = $("#gisStatus");
    if(!status) return;
    status.textContent = message || "";
    status.dataset.tone = tone;
  }

  function normalizeArea(raw){
    const latitude = Number(raw.latitude ?? raw.lat);
    const longitude = Number(raw.longitude ?? raw.lon);
    return {
      id: raw.id || uid("area"),
      name: raw.name || raw.label || "Custom area",
      admin: raw.admin || raw.admin1 || raw.country || "",
      latitude,
      longitude,
      elevationFeet: Number.isFinite(Number(raw.elevationFeet)) ? Number(raw.elevationFeet) : null,
      rainfallByYear: raw.rainfallByYear || {},
      integrations: raw.integrations || {},
      addedAt: raw.addedAt || new Date().toISOString()
    };
  }

  function formatInches(value){
    const number = Number(value || 0);
    return `${number.toFixed(number >= 10 ? 1 : 2)} in`;
  }

  function areaLabel(area){
    return [area.name, area.admin].filter(Boolean).join(", ");
  }

  function selectedRainData(area = selectedArea()){
    if(!area) return [];
    return area.rainfallByYear?.[String(state.gis.selectedYear)] || [];
  }

  function dailyRainMap(data){
    const map = new Map();
    data.forEach(day => map.set(day.date, Number(day.rain || 0)));
    return map;
  }

  function monthFromDate(dateString){
    return Number(dateString.slice(5,7));
  }

  function summarizeRain(data){
    const selectedMonth = Number(state.gis.selectedMonth || 0);
    const selectedSeason = state.gis.selectedSeason || "annual";
    const day = state.gis.selectedDay;
    const annual = data.reduce((sum, item) => sum + Number(item.rain || 0), 0);
    const seasonSet = new Set(seasonMonths[selectedSeason] || seasonMonths.annual);
    const seasonTotal = data
      .filter(item => seasonSet.has(monthFromDate(item.date)))
      .reduce((sum, item) => sum + Number(item.rain || 0), 0);
    const monthTotal = selectedMonth
      ? data.filter(item => monthFromDate(item.date) === selectedMonth).reduce((sum, item) => sum + Number(item.rain || 0), 0)
      : annual;
    const dayTotal = dailyRainMap(data).get(day) || 0;
    const monthlyTotals = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return data.filter(item => monthFromDate(item.date) === month).reduce((sum, item) => sum + Number(item.rain || 0), 0);
    });
    const wettest = data.reduce((best, item) => Number(item.rain || 0) > Number(best.rain || 0) ? item : best, { date: "", rain: 0 });
    return { annual, seasonTotal, monthTotal, dayTotal, monthlyTotals, wettest };
  }

  function latestAnnualRain(area){
    const years = Object.keys(area.rainfallByYear || {}).sort().reverse();
    const data = area.rainfallByYear?.[years[0]] || [];
    return data.reduce((sum, item) => sum + Number(item.rain || 0), 0);
  }

  function integrationFor(area, layerId){
    return area?.integrations?.[layerId] || null;
  }

  function floodZoneRisk(zone){
    const value = String(zone || "").toUpperCase();
    if(!value) return 45;
    if(value.startsWith("V")) return 100;
    if(value.startsWith("A")) return 88;
    if(value.includes("0.2") || value === "X") return 35;
    return 45;
  }

  function layerStatusLabel(status){
    const labels = {
      connected: "Connected",
      "reference-ready": "Reference ready",
      "no-hit": "No mapped hit",
      pending: "Ready to load",
      unavailable: "Needs source access"
    };
    return labels[status] || "Ready";
  }

  function classifyCoverage(item){
    const damage = String(item.damageType || state.resident.damageCause || "").toLowerCase();
    const category = String(item.category || "").toLowerCase();
    const location = String(item.location || "").toLowerCase();
    const structure = String(state.resident.structureType || "").toLowerCase();
    const floodPolicy = state.resident.floodPolicy || "Unknown";
    const homePolicy = state.resident.homePolicy || "Unknown";

    if(category.includes("vehicle") || location === "vehicle"){
      return {
        route: "Auto comprehensive",
        note: "Vehicles are usually handled through auto comprehensive coverage, not flood or homeowners property coverage."
      };
    }

    if(damage.includes("wind-driven") || damage.includes("plumbing") || damage.includes("appliance leak")){
      return {
        route: homePolicy === "No" ? "FEMA or local assistance" : "Homeowners or renters insurance",
        note: "Sudden interior water, wind-driven rain, roof/window intrusion, or appliance leaks are usually regular property-insurance questions, subject to policy terms."
      };
    }

    if(damage.includes("sewer") || damage.includes("drain backup")){
      return {
        route: "Sewer backup endorsement",
        note: "Sewer or drain backup often requires a specific endorsement. If backup was directly caused by widespread floodwater, the flood policy may also need review."
      };
    }

    if(category.includes("cleanup") || category.includes("temporary")){
      return {
        route: "FEMA or local assistance",
        note: "Temporary lodging, food, utilities, and cleanup may be assistance or additional-living-expense items depending on the program and policy."
      };
    }

    if(damage.includes("mold")){
      return {
        route: "Not likely covered / needs review",
        note: "Mold coverage is limited and time-sensitive. Document mitigation steps and ask the insurer which water source created the mold."
      };
    }

    if(damage.includes("surface") || damage.includes("rising") || damage.includes("foundation") || damage.includes("flood")){
      if(structure.includes("detached")){
        return {
          route: floodPolicy === "Yes" ? "Flood insurance / NFIP" : "FEMA or local assistance",
          note: "Detached buildings and contents can have separate limits or exclusions. Confirm whether the structure is insured and eligible."
        };
      }
      if(location.includes("basement")){
        return {
          route: floodPolicy === "Yes" ? "Flood insurance / NFIP" : "FEMA or local assistance",
          note: "NFIP basement coverage is limited. Building systems may be eligible, while many basement contents are restricted or excluded."
        };
      }
      return {
        route: floodPolicy === "Yes" ? "Flood insurance / NFIP" : "FEMA or local assistance",
        note: "Rising surface water is usually a flood-insurance issue. If no flood policy exists, document the loss for assistance screening."
      };
    }

    return {
      route: "Not likely covered / needs review",
      note: "The damage source is not clear enough yet. Keep the item in review until the resident, adjuster, or inspector confirms cause and policy route."
    };
  }

  function inferFromFile(upload){
    const name = (upload.name || "").toLowerCase();
    const type = upload.type || "";
    const base = {
      id: uid("suggestion"),
      sourceId: upload.id,
      sourceName: upload.name,
      name: "Unidentified damaged item",
      category: "Unidentified item",
      damageType: state.resident.damageCause || "Unknown or mixed source",
      location: state.resident.foundation === "Basement" ? "Basement" : "Unknown",
      estimate: "",
      receiptName: "",
      note: "Review the visual, correct the item name, and verify coverage before adding it."
    };

    const has = (...words) => words.some(word => name.includes(word));
    if(type.startsWith("video/")){
      base.name = "Damage video evidence";
      base.category = "Unidentified item";
      base.note = "Video uploaded. Review frame-by-frame and add each visible item separately if needed.";
    }
    if(has("furnace","hvac","boiler","heat")){
      Object.assign(base, { name: "Furnace or HVAC system", category: "Building systems", location: "Basement", estimate: 4200 });
    }else if(has("waterheater","water-heater","water heater","heater")){
      Object.assign(base, { name: "Water heater", category: "Building systems", location: "Basement", estimate: 1800 });
    }else if(has("panel","electrical","outlet","breaker")){
      Object.assign(base, { name: "Electrical panel or outlets", category: "Building systems", location: "Basement", estimate: 2500 });
    }else if(has("washer","dryer","fridge","refrigerator","stove","oven","appliance")){
      Object.assign(base, { name: "Household appliance", category: "Appliance", location: "Basement", estimate: 950 });
    }else if(has("drywall","wall","insulation","floor","carpet","tile","cabinet")){
      Object.assign(base, { name: "Interior building materials", category: "Building structure", location: "First floor", estimate: 3200 });
    }else if(has("roof","window","ceiling","siding")){
      Object.assign(base, { name: "Roof, window, ceiling, or exterior opening", category: "Building structure", damageType: "Wind-driven rain through roof/window", location: "Exterior", estimate: 2800 });
    }else if(has("sofa","couch","chair","table","bed","mattress","furniture")){
      Object.assign(base, { name: "Furniture", category: "Furniture", location: "Basement", estimate: 700 });
    }else if(has("tv","laptop","computer","phone","electronics","game")){
      Object.assign(base, { name: "Electronics", category: "Electronics", location: "Basement", estimate: 600 });
    }else if(has("clothes","clothing","shoe","personal")){
      Object.assign(base, { name: "Clothing or personal items", category: "Clothing and personal items", location: "Basement", estimate: 400 });
    }else if(has("food","freezer","medication","medicine")){
      Object.assign(base, { name: "Food or medication loss", category: "Food or medication", damageType: "Plumbing or appliance leak", location: "First floor", estimate: 300 });
    }else if(has("car","truck","vehicle","auto")){
      Object.assign(base, { name: "Vehicle flood damage", category: "Vehicle", location: "Vehicle", estimate: 6500 });
    }else if(has("garage","shed","detached")){
      Object.assign(base, { name: "Detached garage or shed damage", category: "Detached structure", location: "Detached structure", estimate: 2400 });
    }else if(has("hotel","receipt","invoice","cleanup","mold")){
      Object.assign(base, { name: "Cleanup, hotel, or temporary living cost", category: "Cleanup or temporary living cost", damageType: "Unknown or mixed source", location: "Unknown", estimate: 500 });
    }

    const coverage = classifyCoverage(base);
    return { ...base, coverage: coverage.route, coverageNote: coverage.note };
  }

  function renderUploads(){
    const container = $("#uploadPreview");
    if(!container) return;
    if(!state.uploads.length){
      container.innerHTML = `<div class="file-card"><div class="file-fallback">No files yet</div><div>Uploaded visuals appear here.</div></div>`;
      return;
    }
    container.innerHTML = state.uploads.map(upload => {
      let preview = `<div class="file-fallback">${escapeHtml((upload.type || "file").split("/")[0] || "file")}</div>`;
      if(upload.preview && upload.type.startsWith("image/")){
        preview = `<img src="${upload.preview}" alt="${escapeHtml(upload.name)}">`;
      }else if(upload.preview && upload.type.startsWith("video/")){
        preview = `<video src="${upload.preview}" muted controls></video>`;
      }
      return `<article class="file-card">${preview}<div>${escapeHtml(upload.name)}<br>${Math.round((upload.size || 0)/1024)} KB</div></article>`;
    }).join("");
  }

  function renderPending(){
    const container = $("#pendingList");
    const count = $("#pendingCount");
    if(!container) return;
    if(count) count.textContent = `${state.pending.length} pending`;
    if(!state.pending.length){
      container.innerHTML = `<p class="fine-print">No pending suggestions. Upload visuals and run analysis, or add sample visuals.</p>`;
      return;
    }
    container.innerHTML = state.pending.map(suggestion => `
      <article class="suggestion-card" data-id="${escapeHtml(suggestion.id)}">
        <div class="suggestion-meta">
          <span>${escapeHtml(suggestion.sourceName || "Manual review")}</span>
          <span>${escapeHtml(suggestion.coverage || "Needs review")}</span>
        </div>
        <div class="form-grid two">
          <label>Item or area
            <input data-field="name" value="${escapeHtml(suggestion.name)}">
          </label>
          <label>Category
            <select data-field="category">${optionsFor(categories, suggestion.category)}</select>
          </label>
          <label>Damage type
            <select data-field="damageType">${optionsFor(damageTypes, suggestion.damageType)}</select>
          </label>
          <label>Location
            <select data-field="location">${optionsFor(locations, suggestion.location)}</select>
          </label>
          <label>Estimated price
            <input data-field="estimate" type="number" min="0" step="1" value="${escapeHtml(suggestion.estimate)}">
          </label>
          <label>Coverage route
            <select data-field="coverage">${optionsFor(coverageRoutes, suggestion.coverage)}</select>
          </label>
          <label class="wide">Notes
            <textarea data-field="note" rows="3">${escapeHtml(suggestion.note || "")}</textarea>
          </label>
        </div>
        <p class="coverage-note">${escapeHtml(suggestion.coverageNote || "")}</p>
        <div class="action-row">
          <button class="btn primary" type="button" data-add-suggestion>Verify and add</button>
          <button class="btn ghost" type="button" data-reclassify-suggestion>Reclassify</button>
          <button class="btn danger" type="button" data-skip-suggestion>Skip</button>
        </div>
      </article>
    `).join("");
  }

  function renderInventory(){
    const body = $("#inventoryRows");
    if(!body) return;
    if(!state.items.length){
      body.innerHTML = `<tr><td colspan="6" class="empty-cell">No verified items yet. Upload visuals or add a manual item.</td></tr>`;
      return;
    }
    body.innerHTML = state.items.map(item => `
      <tr data-id="${escapeHtml(item.id)}" class="${coverageClass(item.coverage)}">
        <td>
          <input data-field="name" value="${escapeHtml(item.name)}" aria-label="Item name">
          <select data-field="category" aria-label="Category">${optionsFor(categories, item.category)}</select>
        </td>
        <td><select data-field="damageType" aria-label="Damage type">${optionsFor(damageTypes, item.damageType)}</select></td>
        <td><select data-field="location" aria-label="Location">${optionsFor(locations, item.location)}</select></td>
        <td>
          <select data-field="coverage" aria-label="Coverage route">${optionsFor(coverageRoutes, item.coverage)}</select>
          <p class="fine-print">${escapeHtml(item.coverageNote || "")}</p>
        </td>
        <td>
          <input data-field="estimate" type="number" min="0" step="1" value="${escapeHtml(item.estimate || "")}" aria-label="Estimated price">
          <label class="fine-print">Receipt
            <input data-receipt type="file" accept="image/*,.pdf,.txt,.csv">
          </label>
          <p class="fine-print">${escapeHtml(item.receiptName || "No receipt attached")}</p>
        </td>
        <td>
          <div class="row-actions">
            <button class="mini-btn" type="button" data-reclassify>Classify</button>
            <button class="mini-btn remove" type="button" data-remove>Remove</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function coverageClass(route){
    if(route === "Flood insurance / NFIP") return "coverage-flood";
    if(route === "Homeowners or renters insurance") return "coverage-homeowners";
    if(route === "FEMA or local assistance" || route === "Sewer backup endorsement") return "coverage-assistance";
    if(route === "Auto comprehensive") return "coverage-auto";
    return "coverage-review";
  }

  function renderAssistance(){
    $$("#assistanceChecks input[type='checkbox']").forEach(box => {
      box.checked = state.assistance.includes(box.value);
    });
    const container = $("#assistancePlan");
    if(!container) return;
    if(!state.assistance.length){
      container.innerHTML = `<p class="fine-print">Select assistance needs to build a referral checklist.</p>`;
      return;
    }
    container.innerHTML = state.assistance.map(key => {
      const item = assistanceCatalog[key];
      return `<article class="assistance-card">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.route)}</p>
        <p><strong>Attach:</strong> ${escapeHtml(item.documents)}</p>
      </article>`;
    }).join("");
  }

  function calculateRisk(){
    const area = selectedArea();
    if(!area) return { area: null, summary: null, factors: [], score: "--" };
    const data = selectedRainData(area);
    const summary = summarizeRain(data);
    const elevationFeet = Number(area.elevationFeet || 0);
    const lowElevationScore = elevationFeet ? clamp((900 - elevationFeet) / 7) : 40;
    const annualScore = clamp(summary.annual / 55 * 100);
    const dayScore = clamp(summary.dayTotal / 3 * 100);
    const score = Math.round(lowElevationScore * .38 + annualScore * .42 + dayScore * .20);
    const factors = [
      { name: "Elevation", value: lowElevationScore, detail: elevationFeet ? `${Math.round(elevationFeet)} ft` : "Not loaded" },
      { name: "Year rain", value: annualScore, detail: formatInches(summary.annual) },
      { name: "Season rain", value: clamp(summary.seasonTotal / 20 * 100), detail: formatInches(summary.seasonTotal) },
      { name: "Month rain", value: clamp(summary.monthTotal / 8 * 100), detail: formatInches(summary.monthTotal) },
      { name: "Day rain", value: dayScore, detail: formatInches(summary.dayTotal) },
      { name: "Wettest day", value: clamp(Number(summary.wettest.rain || 0) / 4 * 100), detail: summary.wettest.date ? `${summary.wettest.date}: ${formatInches(summary.wettest.rain)}` : "No data" }
    ];
    const fema = integrationFor(area, "fema");
    if(fema){
      factors.push({ name: "FEMA flood map", value: floodZoneRisk(fema.zone), detail: fema.zone ? `Zone ${fema.zone}` : layerStatusLabel(fema.status) });
    }
    const drains = integrationFor(area, "drains");
    if(drains){
      factors.push({ name: "Drain map", value: drains.status === "reference-ready" ? 58 : 35, detail: layerStatusLabel(drains.status) });
    }
    return { area, summary, factors, score };
  }

  function renderGIS(){
    const area = selectedArea();
    const data = selectedRainData(area);
    const { summary, factors, score } = calculateRisk();
    const scoreEl = $("#riskScore");
    const metricRisk = $("#metricRisk");
    const narrative = $("#riskNarrative");
    if(scoreEl) scoreEl.textContent = score;
    if(metricRisk) metricRisk.textContent = score;
    renderAreaList();
    renderAreaMarkers();
    renderMapLayerOverlay(area, summary);
    renderLayerControls(area);
    renderLayerStatus(area);
    renderGisReadout(area, summary, data);
    renderRainCards(area, summary, data);
    renderRainChart(summary);
    updateMapFrame(area);
    if(narrative){
      if(!area){
        narrative.textContent = "No areas added yet. Search or add coordinates to create your own GIS visual.";
      }else if(!data.length){
        narrative.textContent = `${areaLabel(area)} is selected. Load rainfall to calculate yearly, seasonal, monthly, and daily totals. Elevation is ${area.elevationFeet ? `${Math.round(area.elevationFeet)} ft` : "not loaded yet"}.`;
      }else{
        narrative.textContent = `${areaLabel(area)} is selected for ${state.gis.selectedYear}. Annual rain is ${formatInches(summary.annual)} and elevation is ${area.elevationFeet ? `${Math.round(area.elevationFeet)} ft` : "not loaded"}.`;
      }
    }
    const list = $("#factorList");
    if(list){
      list.innerHTML = factors.length ? factors.map(factor => `
        <div class="factor-row">
          <strong>${escapeHtml(factor.name)}</strong>
          <span class="bar-track"><span class="bar-fill" style="width:${clamp(factor.value)}%"></span></span>
          <span>${escapeHtml(factor.detail)}</span>
        </div>
      `).join("") : `<p class="fine-print">Rainfall and elevation factors appear after an area is added.</p>`;
    }
  }

  function renderAreaList(){
    const container = $("#areaList");
    if(!container) return;
    if(!state.gis.areas.length){
      container.innerHTML = `<p class="fine-print">Added areas will appear here with elevation and loaded rainfall totals.</p>`;
      return;
    }
    container.innerHTML = state.gis.areas.map(area => {
      const rain = latestAnnualRain(area);
      return `<article class="area-card${area.id === state.gis.selectedAreaId ? " active" : ""}" data-area-id="${escapeHtml(area.id)}">
        <strong>${escapeHtml(area.name)}</strong>
        <span>${escapeHtml(area.admin || "Custom area")}</span>
        <span>${area.elevationFeet ? `${Math.round(area.elevationFeet)} ft elevation` : "Elevation not loaded"} / ${rain ? `${formatInches(rain)} latest loaded year rain` : "No rain loaded"}</span>
        <button class="mini-btn remove" type="button" data-remove-area>Remove</button>
      </article>`;
    }).join("");
  }

  function renderAreaMarkers(){
    const group = $("#areaMarkers");
    if(!group) return;
    const areas = state.gis.areas;
    if(!areas.length){
      group.innerHTML = "";
      return;
    }
    const lats = areas.map(area => area.latitude);
    const lons = areas.map(area => area.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const latRange = Math.max(maxLat - minLat, .02);
    const lonRange = Math.max(maxLon - minLon, .02);
    group.innerHTML = areas.map(area => {
      const x = 95 + ((area.longitude - minLon) / lonRange) * 570;
      const y = 340 - ((area.latitude - minLat) / latRange) * 255;
      const annual = latestAnnualRain(area);
      const radius = area.id === state.gis.selectedAreaId ? 16 : 11;
      const rainRatio = clamp(annual / 50, 0, 1);
      const fill = annual ? `rgb(${Math.round(38 + rainRatio * 180)}, ${Math.round(128 - rainRatio * 45)}, ${Math.round(125 - rainRatio * 82)})` : "#ffffff";
      return `<g class="map-area-marker" data-area-id="${escapeHtml(area.id)}" tabindex="0" role="button" aria-label="${escapeHtml(area.name)}">
        <circle class="map-pin-ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(radius + 10).toFixed(1)}"></circle>
        <circle class="map-dot${area.id === state.gis.selectedAreaId ? " active" : ""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" style="fill:${fill}"></circle>
        <text class="map-pin-label" x="${(x + 16).toFixed(1)}" y="${(y - 14).toFixed(1)}">${escapeHtml(area.name.slice(0,22))}</text>
      </g>`;
    }).join("");
  }

  function renderMapLayerOverlay(area, summary){
    const group = $("#mapLayerOverlay");
    if(!group) return;
    const layerId = state.gis.activeLayer || "rainElevation";
    const fema = integrationFor(area, "fema");
    const label = gisLayerCatalog[layerId]?.shortTitle || "GIS layer";
    if(layerId === "rainElevation"){
      const rainLevel = summary ? clamp(summary.dayTotal / 3, 0, 1) : 0;
      const opacity = (.18 + rainLevel * .34).toFixed(2);
      group.innerHTML = `
        <path d="M22 352 C128 320 250 354 360 300 C504 230 626 260 748 174" fill="none" stroke="#155a8a" stroke-width="24" opacity="${opacity}"></path>
        <path d="M56 115 C180 82 278 118 380 96 C520 66 624 82 718 42" fill="none" stroke="#6c8f5f" stroke-width="10" opacity=".38"></path>
        <path d="M80 154 C205 126 292 154 410 132 C535 110 638 126 722 92" fill="none" stroke="#6c8f5f" stroke-width="6" opacity=".32"></path>
        <text x="32" y="40" class="map-layer-label">${escapeHtml(label)}</text>`;
      return;
    }
    if(layerId === "macomb"){
      group.innerHTML = `
        <rect x="72" y="64" width="610" height="282" fill="#fff" opacity=".16" stroke="#155a8a" stroke-width="2"></rect>
        <path d="M112 64 V346 M170 64 V346 M228 64 V346 M286 64 V346 M344 64 V346 M402 64 V346 M460 64 V346 M518 64 V346 M576 64 V346 M634 64 V346" stroke="#155a8a" stroke-width="1.2" opacity=".42"></path>
        <path d="M72 102 H682 M72 140 H682 M72 178 H682 M72 216 H682 M72 254 H682 M72 292 H682 M72 330 H682" stroke="#155a8a" stroke-width="1.2" opacity=".42"></path>
        <path d="M160 338 C244 282 292 306 360 252 C450 181 564 218 656 132" fill="none" stroke="#2a8a65" stroke-width="7" opacity=".45"></path>
        <text x="32" y="40" class="map-layer-label">${escapeHtml(label)} source overlay</text>`;
      return;
    }
    if(layerId === "fema"){
      const zone = fema?.zone ? `Zone ${fema.zone}` : "FEMA zone check pending";
      group.innerHTML = `
        <path d="M38 340 C142 284 210 324 322 274 C420 230 488 244 588 184 C650 148 698 102 760 82 L760 420 L0 420 L0 368 Z" fill="#2b88b5" opacity=".27"></path>
        <path d="M86 310 C176 262 256 292 350 240 C430 196 534 208 690 112" fill="none" stroke="#155a8a" stroke-width="9" opacity=".62"></path>
        <text x="32" y="40" class="map-layer-label">${escapeHtml(label)}: ${escapeHtml(zone)}</text>`;
      return;
    }
    if(layerId === "drains"){
      group.innerHTML = `
        <path d="M32 330 C128 306 214 318 304 262 C400 202 496 222 724 92" fill="none" stroke="#155a8a" stroke-width="8" opacity=".75"></path>
        <path d="M190 330 C220 286 250 266 304 262" fill="none" stroke="#155a8a" stroke-width="5" opacity=".58"></path>
        <path d="M420 236 C455 186 505 164 572 150" fill="none" stroke="#155a8a" stroke-width="5" opacity=".58"></path>
        <path d="M520 208 C580 246 634 250 698 232" fill="none" stroke="#155a8a" stroke-width="5" opacity=".48"></path>
        <circle cx="304" cy="262" r="8" fill="#fff" stroke="#155a8a" stroke-width="3"></circle>
        <circle cx="572" cy="150" r="8" fill="#fff" stroke="#155a8a" stroke-width="3"></circle>
        <text x="32" y="40" class="map-layer-label">${escapeHtml(label)} reference overlay</text>`;
    }
  }

  function renderLayerControls(area){
    const controls = $("#gisLayerControls");
    const source = $("#gisLayerSource");
    if(!controls || !source) return;
    const active = state.gis.activeLayer || "rainElevation";
    controls.innerHTML = Object.entries(gisLayerCatalog).map(([id, layer]) => {
      const integration = id === "rainElevation" && area?.elevationFeet ? { status: "connected" } : integrationFor(area, id);
      return `<button class="layer-button${active === id ? " active" : ""}" type="button" data-gis-layer="${escapeHtml(id)}">
        <strong>${escapeHtml(layer.shortTitle)}</strong>
        <span>${escapeHtml(layerStatusLabel(integration?.status || "pending"))}</span>
      </button>`;
    }).join("");
    const layer = gisLayerCatalog[active] || gisLayerCatalog.rainElevation;
    const integration = active === "rainElevation" && area?.elevationFeet ? { status: "connected" } : integrationFor(area, active);
    source.innerHTML = `
      <div>
        <strong>${escapeHtml(layer.title)}</strong>
        <p>${escapeHtml(layer.detail)}</p>
        ${integration?.details ? `<p>${escapeHtml(integration.details)}</p>` : ""}
      </div>
      <a class="btn ghost" href="${escapeHtml(integration?.url || layer.url)}" target="_blank" rel="noopener">Open source</a>`;
  }

  function renderLayerStatus(area){
    const container = $("#gisLayerStatus");
    if(!container) return;
    container.innerHTML = Object.entries(gisLayerCatalog).map(([id, layer]) => {
      const integration = id === "rainElevation" && area?.elevationFeet ? {
        status: "connected",
        details: `Elevation is ${Math.round(area.elevationFeet)} ft. Rainfall records are loaded by selected year.`
      } : integrationFor(area, id);
      return `<article class="layer-status-card">
        <small>${escapeHtml(layer.status)}</small>
        <strong>${escapeHtml(layer.title)}</strong>
        <span>${escapeHtml(layerStatusLabel(integration?.status || "pending"))}</span>
        <p>${escapeHtml(integration?.details || layer.detail)}</p>
      </article>`;
    }).join("");
  }

  function renderGisReadout(area, summary, data){
    const container = $("#gisReadout");
    if(!container) return;
    if(!area){
      container.innerHTML = `<p><strong>No area selected yet.</strong> Add an area by search, coordinates, or location to show its elevation and rainfall amounts.</p>`;
      return;
    }
    const elevationText = area.elevationFeet ? `${Math.round(area.elevationFeet)} feet` : "not loaded yet";
    if(!data.length || !summary){
      container.innerHTML = `<p><strong>${escapeHtml(area.name)}</strong> elevation is <strong>${escapeHtml(elevationText)}</strong>. Rainfall has not been loaded yet for ${escapeHtml(String(state.gis.selectedYear))}.</p>`;
      return;
    }
    const seasonLabel = state.gis.selectedSeason === "annual" ? "all seasons" : state.gis.selectedSeason;
    const monthLabel = Number(state.gis.selectedMonth || 0) ? monthNames[Number(state.gis.selectedMonth) - 1] : "all months";
    container.innerHTML = `<p><strong>${escapeHtml(area.name)}</strong> elevation is <strong>${escapeHtml(elevationText)}</strong>. Rainfall for <strong>${escapeHtml(String(state.gis.selectedYear))}</strong> is <strong>${escapeHtml(formatInches(summary.annual))}</strong>; ${escapeHtml(seasonLabel)} rainfall is <strong>${escapeHtml(formatInches(summary.seasonTotal))}</strong>; ${escapeHtml(monthLabel)} rainfall is <strong>${escapeHtml(formatInches(summary.monthTotal))}</strong>; and rainfall on <strong>${escapeHtml(state.gis.selectedDay || "the selected day")}</strong> is <strong>${escapeHtml(formatInches(summary.dayTotal))}</strong>.</p>`;
  }

  function renderRainCards(area, summary, data){
    const container = $("#rainCards");
    if(!container) return;
    if(!area){
      container.innerHTML = `
        <article class="rain-card"><strong>--</strong><span>Year rain</span></article>
        <article class="rain-card"><strong>--</strong><span>Season rain</span></article>
        <article class="rain-card"><strong>--</strong><span>Month rain</span></article>
        <article class="rain-card"><strong>--</strong><span>Day rain</span></article>`;
      return;
    }
    const seasonLabel = state.gis.selectedSeason === "annual" ? "All seasons" : state.gis.selectedSeason;
    const monthLabel = Number(state.gis.selectedMonth || 0) ? monthNames[Number(state.gis.selectedMonth) - 1] : "All months";
    container.innerHTML = `
      <article class="rain-card"><strong>${summary ? formatInches(summary.annual) : "--"}</strong><span>${state.gis.selectedYear} year rain</span></article>
      <article class="rain-card"><strong>${summary ? formatInches(summary.seasonTotal) : "--"}</strong><span>${escapeHtml(seasonLabel)} season</span></article>
      <article class="rain-card"><strong>${summary ? formatInches(summary.monthTotal) : "--"}</strong><span>${escapeHtml(monthLabel)} month</span></article>
      <article class="rain-card"><strong>${summary ? formatInches(summary.dayTotal) : "--"}</strong><span>${escapeHtml(state.gis.selectedDay || "selected day")}</span></article>
      <article class="rain-card"><strong>${area.elevationFeet ? `${Math.round(area.elevationFeet)} ft` : "--"}</strong><span>Elevation</span></article>
      <article class="rain-card"><strong>${data.length || 0}</strong><span>Daily records</span></article>`;
  }

  function renderRainChart(summary){
    const container = $("#rainChart");
    if(!container) return;
    if(!summary){
      container.innerHTML = `<p class="fine-print">Monthly rain bars appear after rainfall data is loaded.</p>`;
      return;
    }
    const maxRain = Math.max(...summary.monthlyTotals, 1);
    container.innerHTML = summary.monthlyTotals.map((value, index) => `
      <div class="rain-bar" title="${monthNames[index]} ${formatInches(value)}">
        <span class="rain-bar-fill" style="height:${Math.max(3, (value / maxRain) * 112).toFixed(0)}px"></span>
        <label>${monthNames[index]}</label>
      </div>
    `).join("");
  }

  function updateMapFrame(area){
    const frame = $("#osmFrame");
    if(!frame) return;
    if(!area){
      frame.removeAttribute("src");
      return;
    }
    const delta = .08;
    const bbox = [
      area.longitude - delta,
      area.latitude - delta,
      area.longitude + delta,
      area.latitude + delta
    ].map(value => value.toFixed(5)).join("%2C");
    const marker = `${area.latitude.toFixed(5)}%2C${area.longitude.toFixed(5)}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
    if(frame.getAttribute("src") !== url) frame.setAttribute("src", url);
  }

  function renderMetrics(){
    const total = state.items.reduce((sum, item) => sum + Number(item.estimate || 0), 0);
    $("#metricItems").textContent = state.items.length;
    $("#metricTotal").textContent = money(total);
    $("#metricAssistance").textContent = state.assistance.length;
  }

  function renderIssueDetail(issue = state.selectedIssue || "flooding"){
    const detail = $("#issueDetail");
    if(!detail) return;
    const guide = issueGuides[issue] || issueGuides.flooding;
    $$("#issueGrid [data-issue]").forEach(item => item.classList.toggle("active", item.dataset.issue === issue));
    detail.innerHTML = `
      <p class="eyebrow">Recommended path</p>
      <h3>${escapeHtml(guide.title)}</h3>
      <p>${escapeHtml(guide.body)}</p>
      <div class="issue-actions">
        ${guide.actions.map(([label, href]) => `<a class="btn ghost" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join("")}
      </div>
    `;
  }

  function renderPacket(){
    const preview = $("#documentPreview");
    if(!preview) return;
    preview.innerHTML = buildPacketHtml();
  }

  function buildPacketHtml(){
    const total = state.items.reduce((sum, item) => sum + Number(item.estimate || 0), 0);
    const resident = state.resident;
    const packet = state.packet;
    const { score } = calculateRisk();
    const address = [resident.street, resident.city, resident.zip].filter(Boolean).join(", ");
    const itemsHtml = state.items.length ? state.items.map(item => `
      <li><strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.coverage)} - ${money(item.estimate)}. ${escapeHtml(item.coverageNote || "")}</li>
    `).join("") : "<li>No verified damage items yet.</li>";
    const assistanceHtml = state.assistance.length ? state.assistance.map(key => `<li>${escapeHtml(assistanceCatalog[key].title)}</li>`).join("") : "<li>No assistance needs selected.</li>";
    return `
      <article class="packet-doc">
        <p class="eyebrow">Printable claim packet</p>
        <h2>Macomb Flood Response Packet</h2>
        <p>Generated ${new Date().toLocaleString()}</p>
        <div class="doc-grid">
          <div class="doc-field"><strong>Resident</strong>${escapeHtml(resident.residentName || "Not provided")}</div>
          <div class="doc-field"><strong>Contact</strong>${escapeHtml([resident.phone, resident.email].filter(Boolean).join(" / ") || "Not provided")}</div>
          <div class="doc-field"><strong>Property</strong>${escapeHtml(address || "Not provided")}</div>
          <div class="doc-field"><strong>Structure</strong>${escapeHtml(resident.structureType || "Not provided")} / ${escapeHtml(resident.foundation || "Not provided")}</div>
          <div class="doc-field"><strong>Flood policy</strong>${escapeHtml(resident.floodPolicy || "Unknown")}</div>
          <div class="doc-field"><strong>Home policy</strong>${escapeHtml(resident.homePolicy || "Unknown")}</div>
          <div class="doc-field"><strong>Damage source</strong>${escapeHtml(resident.damageCause || "Unknown")}</div>
          <div class="doc-field"><strong>GIS risk score</strong>${score}/100</div>
          <div class="doc-field"><strong>Insurance company</strong>${escapeHtml(packet.insurerName || "Not provided")}</div>
          <div class="doc-field"><strong>Policy / claim</strong>${escapeHtml(packet.policyNumber || "Not provided")}</div>
        </div>
        <h3>Verified inventory</h3>
        <p><strong>Total estimated amount:</strong> ${money(total)}</p>
        <ol class="packet-list">${itemsHtml}</ol>
        <h3>Assistance checklist</h3>
        <ul class="packet-list">${assistanceHtml}</ul>
        <h3>Resident notes</h3>
        <p>${escapeHtml(packet.residentNotes || "No notes added.")}</p>
        <h3>Attachment checklist</h3>
        <ul class="packet-list">
          <li>Photos and videos of damaged items and water line.</li>
          <li>Receipts or replacement-price estimates for each item.</li>
          <li>Insurance declarations, endorsements, and policy/claim numbers.</li>
          <li>Contractor, plumber, HVAC, electrician, hotel, daycare, food, and cleanup receipts where applicable.</li>
          <li>Permit, elevation, or inspection documents if repairs affect structure or building systems.</li>
        </ul>
      </article>`;
  }

  function buildPlainTextSummary(){
    const resident = state.resident;
    const packet = state.packet;
    const total = state.items.reduce((sum, item) => sum + Number(item.estimate || 0), 0);
    const lines = [
      "Macomb Flood Response Packet Summary",
      `Resident: ${resident.residentName || "Not provided"}`,
      `Contact: ${[resident.phone, resident.email].filter(Boolean).join(" / ") || "Not provided"}`,
      `Property: ${[resident.street, resident.city, resident.zip].filter(Boolean).join(", ") || "Not provided"}`,
      `Structure: ${resident.structureType || "Not provided"} / ${resident.foundation || "Not provided"}`,
      `Policies: Flood=${resident.floodPolicy || "Unknown"}; Home/Renters=${resident.homePolicy || "Unknown"}`,
      `Primary damage source: ${resident.damageCause || "Unknown"}`,
      `Claim/policy: ${packet.policyNumber || "Not provided"}`,
      `Estimated total: ${money(total)}`,
      "",
      "Verified items:"
    ];
    if(state.items.length){
      state.items.forEach((item, index) => lines.push(`${index + 1}. ${item.name} - ${item.coverage} - ${money(item.estimate)} - ${item.coverageNote || ""}`));
    }else{
      lines.push("No verified items yet.");
    }
    lines.push("", "Assistance needs:");
    if(state.assistance.length){
      state.assistance.forEach(key => lines.push(`- ${assistanceCatalog[key].title}`));
    }else{
      lines.push("No assistance needs selected.");
    }
    lines.push("", `Notes: ${packet.residentNotes || "None"}`);
    return lines.join("\n");
  }

  function addFiles(files){
    files.forEach(file => {
      const upload = {
        id: uid("file"),
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        file,
        preview: (file.type || "").startsWith("image/") || (file.type || "").startsWith("video/") ? URL.createObjectURL(file) : ""
      };
      state.uploads.push(upload);
    });
    renderUploads();
    saveState();
  }

  function analyzeUploads(){
    const analyzed = new Set([...state.pending.map(s => s.sourceId), ...state.items.map(i => i.sourceId)]);
    const fresh = state.uploads.filter(upload => !analyzed.has(upload.id));
    if(!fresh.length && !state.uploads.length){
      addSampleSuggestions();
      return;
    }
    fresh.forEach(upload => state.pending.push(inferFromFile(upload)));
    renderPending();
    saveState();
  }

  function addSampleSuggestions(){
    const samples = [
      { id: "sample-water-heater", name: "water_heater_basement.jpg", type: "image/jpeg", size: 250000 },
      { id: "sample-carpet", name: "basement_carpet_waterline.jpg", type: "image/jpeg", size: 180000 },
      { id: "sample-hotel", name: "hotel_receipt_displacement.pdf", type: "application/pdf", size: 90000 }
    ];
    samples.forEach(sample => {
      if(!state.pending.some(s => s.sourceId === sample.id) && !state.items.some(i => i.sourceId === sample.id)){
        state.pending.push(inferFromFile(sample));
      }
    });
    renderPending();
    saveState();
  }

  function addManualItem(){
    const base = {
      id: uid("item"),
      sourceId: "",
      sourceName: "Manual entry",
      name: "New damaged item",
      category: "Unidentified item",
      damageType: state.resident.damageCause || "Unknown or mixed source",
      location: state.resident.foundation === "Basement" ? "Basement" : "Unknown",
      estimate: "",
      note: "Manual entry",
      receiptName: ""
    };
    const coverage = classifyCoverage(base);
    state.items.push({ ...base, coverage: coverage.route, coverageNote: coverage.note });
    renderAll();
    saveState();
  }

  async function searchAreas(){
    const query = $("#areaSearch")?.value.trim();
    const button = $("#searchAreaBtn");
    const results = $("#areaResults");
    if(!query){
      if(results) results.innerHTML = `<p class="fine-print">Type an area, ZIP, address, or place name first.</p>`;
      return;
    }
    const oldText = button?.textContent;
    if(button) button.textContent = "Searching...";
    try{
      const params = new URLSearchParams({ name: query, count: "7", language: "en", format: "json" });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
      if(!response.ok) throw new Error("Location search did not respond.");
      const data = await response.json();
      renderAreaResults(data.results || []);
    }catch(error){
      if(results) results.innerHTML = `<p class="fine-print">Could not search locations right now. Add the area by coordinates below, or try the search again when the data service is available. ${escapeHtml(error.message || "")}</p>`;
    }finally{
      if(button) button.textContent = oldText;
    }
  }

  function renderAreaResults(results){
    const container = $("#areaResults");
    if(!container) return;
    if(!results.length){
      container.innerHTML = `<p class="fine-print">No locations found. Try a city plus state, ZIP code, or manual coordinates.</p>`;
      return;
    }
    container.innerHTML = results.map(result => {
      const admin = [result.admin1, result.country_code].filter(Boolean).join(", ");
      return `<article class="result-card">
        <div>
          <strong>${escapeHtml(result.name)}</strong>
          <span>${escapeHtml(admin)} / ${Number(result.latitude).toFixed(4)}, ${Number(result.longitude).toFixed(4)}${result.elevation ? ` / ${Math.round(Number(result.elevation) * 3.28084)} ft` : ""}</span>
        </div>
        <button class="mini-btn" type="button"
          data-add-search-area
          data-name="${escapeHtml(result.name)}"
          data-admin="${escapeHtml(admin)}"
          data-latitude="${escapeHtml(result.latitude)}"
          data-longitude="${escapeHtml(result.longitude)}"
          data-elevation="${escapeHtml(result.elevation || "")}">Add area</button>
      </article>`;
    }).join("");
  }

  async function addArea(raw, options = {}){
    const area = normalizeArea(raw);
    if(!Number.isFinite(area.latitude) || !Number.isFinite(area.longitude)){
      alert("The area needs valid latitude and longitude.");
      return null;
    }
    const existing = state.gis.areas.find(saved => Math.abs(saved.latitude - area.latitude) < .0001 && Math.abs(saved.longitude - area.longitude) < .0001);
    const target = existing || area;
    if(!existing){
      state.gis.areas.push(target);
    }
    setSelectedArea(target.id);
    try{
      if(!target.elevationFeet){
        target.elevationFeet = await fetchElevationFeet(target);
      }
      if(options.loadRain !== false){
        await loadRainfallForArea(target);
      }
    }catch(error){
      const results = $("#areaResults");
      if(results) results.innerHTML = `<p class="fine-print">Area was added, but live rainfall or elevation data could not be loaded yet. You can try Load rainfall again later. ${escapeHtml(error.message || "")}</p>`;
    }finally{
      renderGIS();
      renderMetrics();
      renderPacket();
      saveState();
    }
    return target;
  }

  async function addManualArea(){
    const name = $("#manualAreaName")?.value.trim() || "Custom area";
    const latitude = Number($("#manualLat")?.value);
    const longitude = Number($("#manualLon")?.value);
    await addArea({ name, admin: "Manual coordinates", latitude, longitude });
  }

  async function addCurrentLocation(){
    const button = $("#locationBtn");
    const oldText = button?.textContent;
    if(window.location.protocol === "file:"){
      setGisStatus("Opening the location-enabled local preview. If the browser asks for location permission, choose Allow to add your current area.", "info");
      setTimeout(() => {
        window.location.href = "http://localhost:8087/index.html#gis";
      }, 700);
      return;
    }
    if(!navigator.geolocation){
      setGisStatus("This browser does not provide location access. Add the area by search or coordinates instead.", "warning");
      return;
    }
    if(button) button.textContent = "Locating...";
    try{
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      setGisStatus("Location found. Loading elevation and rainfall data...", "info");
      await addArea({
        name: "Current location",
        admin: "Browser location",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    }catch(error){
      setGisStatus(`Could not use browser location. You can still search for an area or add coordinates manually. ${error.message || ""}`, "warning");
    }finally{
      if(button) button.textContent = oldText;
    }
  }

  async function fetchElevationFeet(area){
    const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${area.latitude}&longitude=${area.longitude}`);
    if(!response.ok) throw new Error("Elevation service did not respond.");
    const data = await response.json();
    const meters = Array.isArray(data.elevation) ? Number(data.elevation[0]) : Number(data.elevation);
    return Number.isFinite(meters) ? meters * 3.28084 : null;
  }

  function archiveDateRange(year){
    const today = new Date();
    const start = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const end = year === today.getFullYear() ? today : endOfYear;
    if(end < start) throw new Error("Choose a year that has begun.");
    return {
      start: start.toISOString().slice(0,10),
      end: end.toISOString().slice(0,10)
    };
  }

  async function loadRainfallForArea(area = selectedArea()){
    if(!area){
      setGisStatus("Add or select an area first, then load rainfall.", "warning");
      return;
    }
    const button = $("#loadRainBtn");
    const oldText = button?.textContent;
    if(button) button.textContent = "Loading...";
    setGisStatus(`Loading rainfall for ${area.name}...`, "info");
    try{
      const year = Number(state.gis.selectedYear || new Date().getFullYear());
      const range = archiveDateRange(year);
      const params = new URLSearchParams({
        latitude: String(area.latitude),
        longitude: String(area.longitude),
        start_date: range.start,
        end_date: range.end,
        daily: "precipitation_sum",
        precipitation_unit: "inch",
        timezone: "auto"
      });
      const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`);
      if(!response.ok) throw new Error("Rainfall archive did not respond.");
      const data = await response.json();
      const dates = data.daily?.time || [];
      const rain = data.daily?.precipitation_sum || [];
      area.rainfallByYear[String(year)] = dates.map((date, index) => ({
        date,
        rain: Number(rain[index] || 0)
      }));
      setGisStatus(`Rainfall loaded for ${area.name} in ${year}.`, "success");
    }finally{
      if(button) button.textContent = oldText;
      renderGIS();
      renderPacket();
      saveState();
    }
  }

  async function refreshSelectedArea(){
    const area = selectedArea();
    const button = $("#refreshDataBtn");
    const oldText = button?.textContent;
    if(!area){
      setGisStatus("Add an area first. Use search, coordinates, or location before refreshing data.", "warning");
      return;
    }
    if(button) button.textContent = "Refreshing...";
    setGisStatus(`Refreshing elevation and rainfall for ${area.name}...`, "info");
    let elevationError = "";
    try{
      area.elevationFeet = await fetchElevationFeet(area);
    }catch(error){
      elevationError = error.message || "Elevation did not load.";
    }
    try{
      await loadRainfallForArea(area);
      setGisStatus(elevationError ? `Rainfall loaded. Elevation could not refresh: ${elevationError}` : `Data refreshed for ${area.name}.`, elevationError ? "warning" : "success");
    }catch(error){
      setGisStatus(`Could not refresh rainfall. ${elevationError || ""} ${error.message || ""}`.trim(), "warning");
    }finally{
      if(button) button.textContent = oldText;
      renderGIS();
      renderPacket();
      saveState();
    }
  }

  function updateSuggestionField(card, field, value){
    const suggestion = state.pending.find(item => item.id === card.dataset.id);
    if(!suggestion) return;
    suggestion[field] = value;
    if(["category","damageType","location"].includes(field)){
      const coverage = classifyCoverage(suggestion);
      suggestion.coverage = coverage.route;
      suggestion.coverageNote = coverage.note;
      renderPending();
    }
    saveState();
  }

  function updateInventoryField(row, field, value){
    const item = state.items.find(entry => entry.id === row.dataset.id);
    if(!item) return;
    item[field] = field === "estimate" ? Number(value || 0) : value;
    renderMetrics();
    renderPacket();
    saveState();
  }

  function renderAll(){
    renderIssueDetail();
    renderUploads();
    renderPending();
    renderInventory();
    renderAssistance();
    renderGIS();
    renderMetrics();
    renderPacket();
  }

  function setGISControlValues(){
    const year = $("#rainYear");
    const season = $("#rainSeason");
    const month = $("#rainMonth");
    const day = $("#rainDay");
    if(year) year.value = state.gis.selectedYear;
    if(season) season.value = state.gis.selectedSeason;
    if(month) month.value = state.gis.selectedMonth;
    if(day) day.value = state.gis.selectedDay;
  }

  function inventoryCsv(){
    const header = ["Item","Category","Damage Type","Location","Coverage Route","Estimated Price","Receipt","Coverage Note"];
    const rows = state.items.map(item => [
      item.name,
      item.category,
      item.damageType,
      item.location,
      item.coverage,
      item.estimate || 0,
      item.receiptName || "",
      item.coverageNote || ""
    ]);
    return [header, ...rows].map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  }

  function assistanceText(){
    if(!state.assistance.length) return "No assistance needs selected.";
    return state.assistance.map(key => {
      const item = assistanceCatalog[key];
      return `${item.title}\nNext step: ${item.route}\nAttach: ${item.documents}`;
    }).join("\n\n");
  }

  async function downloadZip(){
    const cleanState = {
      resident: state.resident,
      packet: state.packet,
      items: state.items.map(({ receiptFile, ...item }) => item),
      assistance: state.assistance,
      weather: state.weather,
      generatedAt: new Date().toISOString()
    };
    const entries = [
      { name: "claim-summary.html", data: `<!doctype html><html><head><meta charset="utf-8"><title>Macomb Flood Response Packet</title><style>body{font-family:Arial,sans-serif;line-height:1.5;padding:24px;color:#17212b}li{margin-bottom:8px}</style></head><body>${buildPacketHtml()}</body></html>` },
      { name: "inventory.csv", data: inventoryCsv() },
      { name: "resident-info.json", data: JSON.stringify(cleanState, null, 2) },
      { name: "assistance-checklist.txt", data: assistanceText() },
      { name: "forward-summary.txt", data: buildPlainTextSummary() }
    ];

    for(const upload of state.uploads){
      if(upload.file){
        entries.push({
          name: `attachments/visuals/${upload.id}-${sanitizeFileName(upload.name)}`,
          data: new Uint8Array(await upload.file.arrayBuffer())
        });
      }
    }
    for(const item of state.items){
      if(item.receiptFile){
        entries.push({
          name: `attachments/receipts/${item.id}-${sanitizeFileName(item.receiptName || item.receiptFile.name)}`,
          data: new Uint8Array(await item.receiptFile.arrayBuffer())
        });
      }
    }

    const blob = createZip(entries);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `macomb-flood-response-packet-${new Date().toISOString().slice(0,10)}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function createZip(entries){
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const now = dosDate(new Date());

    entries.forEach(entry => {
      const nameBytes = encoder.encode(entry.name.replace(/\\/g, "/"));
      const data = entry.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry.data ?? ""));
      const crc = crc32(data);

      const local = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, now.time, true);
      localView.setUint16(12, now.date, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, nameBytes.length, true);
      local.set(nameBytes, 30);
      localParts.push(local, data);

      const central = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, now.time, true);
      centralView.setUint16(14, now.date, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, data.length, true);
      centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint32(42, offset, true);
      central.set(nameBytes, 46);
      centralParts.push(central);

      offset += local.length + data.length;
    });

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);

    return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
  }

  function dosDate(date){
    const year = Math.max(date.getFullYear(), 1980);
    const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const dosDateValue = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time: dosTime, date: dosDateValue };
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for(let n = 0; n < 256; n++){
      let c = n;
      for(let k = 0; k < 8; k++){
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(data){
    let crc = 0xffffffff;
    for(let i = 0; i < data.length; i++){
      crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function loadSampleCase(){
    state.resident = {
      residentName: "Jordan Smith",
      phone: "(586) 555-0134",
      email: "resident@example.com",
      householdSize: "4",
      street: "100 Sample Street",
      city: "Mount Clemens",
      zip: "48043",
      structureType: "Single-family home",
      foundation: "Basement",
      floodPolicy: "Yes",
      homePolicy: "Yes",
      damageCause: "Surface floodwater or rising water",
      waterDepth: "6 to 18 inches"
    };
    state.packet = {
      insurerName: "Sample Insurance",
      policyNumber: "POL-12345",
      forwardEmail: "",
      contactMethod: "Email",
      residentNotes: "Water entered through the basement during heavy rainfall. Utilities were shut off until inspection."
    };
    state.assistance = ["electricity", "heat", "hotel", "repairs", "building"];
    state.items = [
      {
        id: uid("item"),
        sourceId: "sample-verified-1",
        sourceName: "sample",
        name: "Furnace or HVAC system",
        category: "Building systems",
        damageType: "Surface floodwater or rising water",
        location: "Basement",
        estimate: 4200,
        coverage: "Flood insurance / NFIP",
        coverageNote: "Building systems in a basement may be eligible under flood coverage, but basement limits apply.",
        receiptName: ""
      }
    ];
    state.pending = [];
    state.weather = null;
    state.liveLocation = null;
    const year = new Date().getFullYear();
    state.gis = {
      ...defaultState().gis,
      selectedYear: year,
      selectedAreaId: "sample-mount-clemens",
      areas: [{
        id: "sample-mount-clemens",
        name: "Mount Clemens",
        admin: "MI, US",
        latitude: 42.5973,
        longitude: -82.8780,
        elevationFeet: 604,
        rainfallByYear: {
          [String(year)]: Array.from({ length: 120 }, (_, index) => {
            const date = new Date(year, 0, index + 1);
            return {
              date: date.toISOString().slice(0,10),
              rain: Number((Math.max(0, Math.sin(index / 8) * .18 + (index % 17 === 0 ? .85 : .06))).toFixed(2))
            };
          })
        },
        addedAt: new Date().toISOString()
      }]
    };
    setFormValues($("#residentForm"), state.resident);
    setFormValues($("#packetForm"), state.packet);
    setGISControlValues();
    addSampleSuggestions();
    renderAll();
    saveState();
  }

  function bindEvents(){
    const residentForm = $("#residentForm");
    const packetForm = $("#packetForm");
    residentForm.addEventListener("input", () => {
      state.resident = { ...state.resident, ...collectForm(residentForm) };
      renderGIS();
      renderPacket();
      renderMetrics();
      saveState();
    });
    residentForm.addEventListener("change", () => {
      state.resident = { ...state.resident, ...collectForm(residentForm) };
      renderGIS();
      renderPacket();
      saveState();
    });
    packetForm.addEventListener("input", () => {
      state.packet = { ...state.packet, ...collectForm(packetForm) };
      renderPacket();
      saveState();
    });

    $("#saveCaseBtn").addEventListener("click", () => {
      state.resident = { ...state.resident, ...collectForm(residentForm) };
      state.packet = { ...state.packet, ...collectForm(packetForm) };
      saveState();
      alert("Case saved in this browser.");
    });
    $("#sampleCaseBtn").addEventListener("click", loadSampleCase);
    $("#issueGrid").addEventListener("click", event => {
      const card = event.target.closest("[data-issue]");
      if(!card) return;
      state.selectedIssue = card.dataset.issue;
      renderIssueDetail();
      saveState();
    });
    $("#visualUpload").addEventListener("change", event => {
      addFiles(Array.from(event.target.files || []));
      event.target.value = "";
    });
    const uploadZone = $(".upload-zone");
    uploadZone.addEventListener("dragover", event => {
      event.preventDefault();
      uploadZone.classList.add("is-dragging");
    });
    uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("is-dragging"));
    uploadZone.addEventListener("drop", event => {
      event.preventDefault();
      uploadZone.classList.remove("is-dragging");
      addFiles(Array.from(event.dataTransfer.files || []));
    });

    $("#analyzeBtn").addEventListener("click", analyzeUploads);
    $("#sampleVisualBtn").addEventListener("click", addSampleSuggestions);
    $("#manualItemBtn").addEventListener("click", addManualItem);
    $("#searchAreaBtn").addEventListener("click", () => searchAreas());
    $("#areaSearch").addEventListener("keydown", event => {
      if(event.key === "Enter"){
        event.preventDefault();
        searchAreas();
      }
    });
    $("#areaResults").addEventListener("click", event => {
      const button = event.target.closest("[data-add-search-area]");
      if(!button) return;
      const elevationMeters = Number(button.dataset.elevation);
      addArea({
        name: button.dataset.name,
        admin: button.dataset.admin,
        latitude: Number(button.dataset.latitude),
        longitude: Number(button.dataset.longitude),
        elevationFeet: Number.isFinite(elevationMeters) ? elevationMeters * 3.28084 : null
      });
    });
    $("#manualAreaBtn").addEventListener("click", () => addManualArea());
    $("#locationBtn").addEventListener("click", () => addCurrentLocation());
    $("#refreshDataBtn").addEventListener("click", () => refreshSelectedArea());
    $("#loadRainBtn").addEventListener("click", () => loadRainfallForArea().catch(error => setGisStatus(`Could not load rainfall. ${error.message || ""}`, "warning")));
    ["rainYear","rainSeason","rainMonth","rainDay"].forEach(id => {
      const field = $(`#${id}`);
      field?.addEventListener("change", () => {
        state.gis.selectedYear = Number($("#rainYear").value || new Date().getFullYear());
        state.gis.selectedSeason = $("#rainSeason").value;
        state.gis.selectedMonth = Number($("#rainMonth").value || 0);
        state.gis.selectedDay = $("#rainDay").value;
        renderGIS();
        renderPacket();
        saveState();
      });
    });
    $("#printBtn").addEventListener("click", () => window.print());
    $("#zipBtn").addEventListener("click", () => downloadZip().catch(error => alert(`Could not build ZIP: ${error.message || error}`)));
    $("#forwardBtn").addEventListener("click", () => {
      const summary = buildPlainTextSummary();
      navigator.clipboard?.writeText(summary).catch(() => {});
      const email = state.packet.forwardEmail || "";
      const subject = encodeURIComponent("Macomb Flood Response packet summary");
      const body = encodeURIComponent(summary);
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    });
    $("#clearBtn").addEventListener("click", () => {
      if(!confirm("Clear this saved case from the browser?")) return;
      state.uploads.forEach(upload => upload.preview && URL.revokeObjectURL(upload.preview));
      state = defaultState();
      localStorage.removeItem(STORAGE_KEY);
      residentForm.reset();
      packetForm.reset();
      setFormValues(residentForm, state.resident);
      setFormValues(packetForm, state.packet);
      renderAll();
    });

    $("#pendingList").addEventListener("input", event => {
      const field = event.target.dataset.field;
      const card = event.target.closest(".suggestion-card");
      if(field && card) updateSuggestionField(card, field, event.target.value);
    });
    $("#pendingList").addEventListener("change", event => {
      const field = event.target.dataset.field;
      const card = event.target.closest(".suggestion-card");
      if(field && card) updateSuggestionField(card, field, event.target.value);
    });
    $("#pendingList").addEventListener("click", event => {
      const card = event.target.closest(".suggestion-card");
      if(!card) return;
      const suggestion = state.pending.find(item => item.id === card.dataset.id);
      if(!suggestion) return;
      if(event.target.matches("[data-add-suggestion]")){
        state.items.push({ ...suggestion, id: uid("item"), verifiedAt: new Date().toISOString() });
        state.pending = state.pending.filter(item => item.id !== suggestion.id);
        renderAll();
        saveState();
      }
      if(event.target.matches("[data-reclassify-suggestion]")){
        const coverage = classifyCoverage(suggestion);
        suggestion.coverage = coverage.route;
        suggestion.coverageNote = coverage.note;
        renderPending();
        saveState();
      }
      if(event.target.matches("[data-skip-suggestion]")){
        state.pending = state.pending.filter(item => item.id !== suggestion.id);
        renderPending();
        saveState();
      }
    });

    $("#inventoryRows").addEventListener("input", event => {
      const field = event.target.dataset.field;
      const row = event.target.closest("tr[data-id]");
      if(field && row) updateInventoryField(row, field, event.target.value);
    });
    $("#inventoryRows").addEventListener("change", event => {
      const row = event.target.closest("tr[data-id]");
      if(!row) return;
      const item = state.items.find(entry => entry.id === row.dataset.id);
      if(!item) return;
      if(event.target.matches("[data-receipt]")){
        const file = event.target.files?.[0];
        item.receiptFile = file || null;
        item.receiptName = file?.name || "";
        renderInventory();
        renderPacket();
        saveState();
        return;
      }
      const field = event.target.dataset.field;
      if(field) updateInventoryField(row, field, event.target.value);
    });
    $("#inventoryRows").addEventListener("click", event => {
      const row = event.target.closest("tr[data-id]");
      if(!row) return;
      const item = state.items.find(entry => entry.id === row.dataset.id);
      if(!item) return;
      if(event.target.matches("[data-reclassify]")){
        const coverage = classifyCoverage(item);
        item.coverage = coverage.route;
        item.coverageNote = coverage.note;
        renderAll();
        saveState();
      }
      if(event.target.matches("[data-remove]")){
        state.items = state.items.filter(entry => entry.id !== item.id);
        renderAll();
        saveState();
      }
    });

    $("#assistanceChecks").addEventListener("change", () => {
      state.assistance = $$("#assistanceChecks input:checked").map(box => box.value);
      renderAssistance();
      renderMetrics();
      renderPacket();
      saveState();
    });

    $("#areaList").addEventListener("click", event => {
      const card = event.target.closest("[data-area-id]");
      if(!card) return;
      if(event.target.matches("[data-remove-area]")){
        if(!confirm("Remove this area from the local GIS list?")) return;
        state.gis.areas = state.gis.areas.filter(area => area.id !== card.dataset.areaId);
        state.gis.selectedAreaId = state.gis.areas[0]?.id || "";
      }else{
        setSelectedArea(card.dataset.areaId);
      }
      renderGIS();
      renderPacket();
      saveState();
    });
    $("#areaMarkers").addEventListener("click", event => {
      const marker = event.target.closest("[data-area-id]");
      if(!marker) return;
      setSelectedArea(marker.dataset.areaId);
      renderGIS();
      renderPacket();
      saveState();
    });
  }

  function init(){
    if(!$("#residentForm")) return;
    loadState();
    setFormValues($("#residentForm"), state.resident);
    setFormValues($("#packetForm"), state.packet);
    setGISControlValues();
    bindEvents();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
