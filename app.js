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

  const FEMA_NFHL_MAP_SERVICE_URL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
  const FEMA_NFHL_LAYER_QUERY = `${FEMA_NFHL_MAP_SERVICE_URL}/28/query`;
  const FEMA_NFHL_VIEWER_URL = "https://hazards-fema.maps.arcgis.com/apps/webappviewer/index.html?id=8b0adb51996444d4879338b5529aa9cd";
  const MACOMB_GIS_WEBMAP_URL = "https://gis.macombgov.org/webmaps/Flexmobile2/";
  const MACOMB_GIS_LAYER_CATALOG_URL = "https://gis.macombgov.org/home/layers.html";
  const MACOMB_DRAIN_INDEX_URL = "https://www.macombgov.org/departments/public-works/public-works-resources/macomb-county-drain-maps";
  const MACOMB_DRAIN_COUNTY_PDF = "https://www.macombgov.org/sites/default/files/files/2022-10/macomb_county_drain_map_2019.pdf";
  const MICHIGAN_GIS_OPEN_DATA_URL = "https://gis-michigan.opendata.arcgis.com/";
  const MICHIGAN_GIS_STATE_MAPS_URL = "https://www.michigan.gov/dtmb/services/maps";
  const MICHIGAN_ELEVATION_MAP_SERVICE_URL = "https://gisagocss.state.mi.us/arcgis/rest/services/OpenData/elevation/MapServer";
  const MICHIGAN_FRAMEWORK_MAP_SERVICE_URL = "https://gisagocss.state.mi.us/arcgis/rest/services/OpenData/michigan_geographic_framework/MapServer";
  const MICHIGAN_HYDRO_MAP_SERVICE_URL = "https://gisagocss.state.mi.us/arcgis/rest/services/OpenData/hydro/MapServer";
  const drainMapCatalog = [
    {
      label: "Mount Clemens / Fraser / Clinton Township drain map",
      patterns: ["mount clemens", "fraser", "clinton township"],
      url: "https://www.macombgov.org/sites/default/files/files/2022-10/city_of_mount_clemens_city_of_fraser_clinton_township.pdf"
    },
    {
      label: "Warren / Center Line drain map",
      patterns: ["warren", "center line"],
      url: "https://www.macombgov.org/sites/default/files/files/2022-10/mapbookforpublic_warrencenterline21.pdf"
    },
    {
      label: "Countywide drain map",
      patterns: ["macomb county", "macomb"],
      url: MACOMB_DRAIN_COUNTY_PDF
    }
  ];
  const DEFAULT_MAP_AREA = {
    name: "Macomb County",
    admin: "MI, US",
    latitude: 42.67,
    longitude: -82.91
  };
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
      title: "Michigan or local GIS layers",
      shortTitle: "Local GIS",
      source: "Macomb County GIS or Michigan GIS Open Data",
      status: "Local layer host",
      detail: "Opens local GIS when available. In Macomb County this uses the county GIS map; elsewhere in Michigan it points to the State of Michigan GIS data and map source.",
      url: MACOMB_GIS_WEBMAP_URL
    },
    fema: {
      title: "FEMA flood maps",
      shortTitle: "FEMA flood",
      source: "FEMA National Flood Hazard Layer",
      status: "Flood-zone point check",
      detail: "Checks the selected coordinate against FEMA flood hazard zone data when the public NFHL service responds.",
      url: FEMA_NFHL_VIEWER_URL
    },
    drains: {
      title: "Drain and waterway maps",
      shortTitle: "Drain maps",
      source: "Macomb County Public Works drain maps or Michigan hydrography sources",
      status: "Drain reference",
      detail: "Connects residents to official drain, river, stream, and waterway context for the selected location.",
      url: MACOMB_DRAIN_COUNTY_PDF
    }
  };

  const mapSourceProfiles = {
    "Michigan EGLE Maps & Data": {
      summary: "State environmental maps, dashboards, and open data.",
      use: "Use this when a resident needs Michigan water, wetlands, watersheds, wells, environmental layers, or source datasets behind a local flood question.",
      proof: "Save the map name, layer name, date accessed, property address or coordinates, and screenshots if the page is being used for a packet, appeal, or public comment.",
      next: "Open the source, search the address or topic, then pair it with FEMA, county GIS, and local building or public works information."
    },
    "EGLE Floodplain Mapping": {
      summary: "Michigan floodplain mapping guidance and FEMA map connections.",
      use: "Use this when the question is whether a property may be in a floodplain, whether a site-specific flood elevation request may be needed, or which FEMA products apply.",
      proof: "Save FEMA map identifiers, address or coordinates, flood zone notes, elevation request information, and local floodplain administrator follow-up.",
      next: "Use this source with the FEMA Map Service Center and local floodplain administrator before relying on a flood-zone decision."
    },
    "FEMA Flood Map Service Center": {
      summary: "Official FEMA flood maps and flood insurance map products by address.",
      use: "Use this when an insurance, permit, appeal, mortgage, or property decision needs the official Flood Insurance Rate Map or FIRMette.",
      proof: "Download or save the FIRMette, panel number, effective date, flood zone, map scale, and searched property address.",
      next: "Open the source, search the address, download the FIRMette, and attach it to the recovery or zoning packet."
    },
    "FEMA National Flood Hazard Layer Viewer": {
      summary: "Interactive FEMA GIS viewer for current effective flood hazard layers.",
      use: "Use this to view FEMA flood hazard layers on an interactive map and compare the selected point against nearby flood zones.",
      proof: "Save the flood zone, SFHA status when available, visible map screenshot, date accessed, and address or coordinates.",
      next: "Use this with the FEMA Map Service Center because the Map Service Center is the source for official printable map products."
    },
    "Michigan Watershed Boundary GIS Data": {
      summary: "Watershed and HUC boundary data for drainage-area context.",
      use: "Use this to understand which watershed or drainage basin a property belongs to and how water may move beyond city or parcel boundaries.",
      proof: "Save the HUC or watershed name/code, visible boundary, property location, and date accessed.",
      next: "Pair this with hydrography, drain maps, rainfall, and local stormwater/public works information."
    },
    "Michigan Hydrography / Rivers / Lakes / Streams": {
      summary: "Statewide hydrography GIS service for rivers, lakes, streams, wetlands, watersheds, and water features.",
      use: "Use this to see nearby waterways, waterbodies, wetlands, watershed boundaries, and drainage-related map layers.",
      proof: "Save the layer name, nearby feature names, property coordinates, visible map screenshot, and date accessed.",
      next: "Use this with county drain maps and local public works records for municipal drain or sewer-specific questions."
    },
    "EGLE Flood Flow Discharge Database": {
      summary: "Flood discharge estimates used for technical water-flow and infrastructure work.",
      use: "Use this for technical questions involving dams, bridges, culverts, floodplain boundaries, and flood-flow estimates.",
      proof: "Save the query parameters, watercourse or crossing, discharge estimate, date accessed, and any related engineering notes.",
      next: "Use this with an engineer, floodplain administrator, or local infrastructure office when a resident needs technical support."
    },
    "SEMCOG Flood Risk Tool": {
      summary: "Southeast Michigan transportation infrastructure flood-risk tool.",
      use: "Use this for roads, bridges, culverts, pump stations, access routes, and transportation disruption risk in Southeast Michigan.",
      proof: "Save the route, asset, risk layer, visible map screenshot, and date accessed.",
      next: "Pair this with local road commission, public works, emergency management, and resident road-closure evidence."
    },
    "Local County / City GIS Maps": {
      summary: "Local parcel, natural-feature, flood-zone, planning, and infrastructure map layers.",
      use: "Use this when statewide maps are not specific enough and the resident needs county, city, township, parcel, zoning, natural feature, or local flood-zone context.",
      proof: "Save the local layer name, parcel or address, visible flood/natural-feature layer, date accessed, and local office contact.",
      next: "Open the local GIS source, confirm the parcel or address, then contact the building department, floodplain administrator, public works, or drain office if the result affects action."
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
      title: "Electricity or gas shutoff / bill help",
      type: "Utility shutoff and energy bill assistance",
      route: "Use this for electric or gas service shutoff, restoration, damaged electrical service, or energy bill support. Contact the utility provider for safety/restoration and use the assistance source page to find the correct local agency for the resident's city or county.",
      documents: "Utility account number, shutoff notice, past-due bill, repair invoice, photos of damaged panel/outlets/meters, and household income documents if requested.",
      contact: "Utility provider for active hazards/restoration; MI 211, MDHHS, local community action agency, or local emergency services for assistance screening.",
      url: "https://www.michigan.gov/mpsc/consumer/energy-assistance"
    },
    heat: {
      title: "Heat or HVAC loss",
      type: "Heating system repair or temporary heat need",
      route: "Use this when the furnace, boiler, HVAC equipment, or safe heating access is affected by flood damage or displacement.",
      documents: "HVAC report, serial/model numbers, photos, estimate, utility status, hotel or temporary heat receipts.",
      contact: "Licensed HVAC contractor for safety; MI 211, MDHHS, local community action agency, or local emergency support for heat, repair, or lodging help.",
      url: "https://www.michigan.gov/mdhhs/assistance-programs/emergency-relief"
    },
    water: {
      title: "Water/sewer bill or plumbing help",
      type: "Water, sewer, drainage, and plumbing assistance",
      route: "Use this for water/sewer bills, water shutoff, sewer backup, drain backup, sump/backflow issues, plumbing reports, or water-related cleanup. Keep it separate from electric/gas utility assistance because the programs, documents, and local providers differ.",
      documents: "Water/sewer bill or shutoff notice, plumber report, sewer/drain backup notes, utility notice, photos, cleanup invoices, backflow/sump records.",
      contact: "Water/sewer provider, local utility billing office, MI 211, local community action agency, plumber, public works, or county drain office depending on the issue.",
      url: "https://mi211.org/"
    },
    daycare: {
      title: "Daycare or school disruption",
      route: "Log childcare costs caused by displacement, cleanup, transportation, or unsafe home conditions.",
      documents: "Receipts, provider letters, work schedule impact, school closure notice.",
      contact: "Childcare provider, school district, employer, Michigan childcare assistance source, and local agency if costs are caused by flood displacement.",
      url: "https://www.michigan.gov/mde/services/early-learners-and-care/cdc"
    },
    housing: {
      title: "Housing or housing-cost support",
      route: "Track displacement dates, rent/mortgage pressure, and habitability issues for assistance screening.",
      documents: "Lease/mortgage statement, habitability notice, photos, income documents if requested.",
      contact: "MI 211, MSHDA/housing resources, local emergency management, local community action agency, housing provider, landlord/mortgage servicer, and insurer if additional living expense applies.",
      url: "https://www.michigan.gov/mshda"
    },
    hotel: {
      title: "Hotel or temporary lodging fees",
      route: "Add lodging receipts and the reason the home was unsafe or unavailable.",
      documents: "Hotel folios, dates, evacuation or safety notice, insurer additional-living-expense response.",
      contact: "Insurer, FEMA/state/local disaster assistance if available, and local emergency/housing support.",
      url: "https://mi211.org/"
    },
    repairs: {
      title: "Home repairs or cleanup",
      route: "Use the immediate-fixes playbook first to separate safety checks, water extraction, electrical inspection, HVAC checks, mold prevention, debris removal, and safe access documentation from later rebuild work.",
      documents: "Estimates, invoices, mold reports, debris photos, repair scope.",
      contact: "Licensed contractor, mitigation company, insurer, building department, and assistance agency.",
      url: "https://www.disasterassistance.gov/"
    },
    food: {
      title: "Food replacement",
      route: "List food loss caused by power outage, refrigerator damage, evacuation, or contamination.",
      documents: "Photos, grocery estimate, power outage proof, SNAP/benefit information if relevant.",
      contact: "Food assistance provider, SNAP/benefit office if applicable, and insurer if food loss is tied to a covered event.",
      url: "https://www.michigan.gov/mdhhs/assistance-programs/food"
    },
    building: {
      title: "Building permits, elevation, or mitigation",
      route: "Ask the local building/floodplain office whether repair work triggers permits, elevation certificates, or substantial damage review.",
      documents: "Repair estimate, photos, elevation certificate if available, contractor scope, property record.",
      contact: "Local building department, floodplain administrator, licensed contractor, engineer or surveyor if needed.",
      url: "https://www.michigan.gov/egle/about/organization/water-resources/floodplain-management"
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
      body: "Start with the water source to route the claim, then check what was damaged: building structure, building systems, contents, basement items, detached structures, temporary living costs, and policy limits.",
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
        ["Immediate fix playbook", "immediate-fixes.html"],
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
    intake: {
      emergencyStatus: "",
      quickNeed: "",
      quickHomeSafe: ""
    },
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
  let lastCitySyncValue = "";
  let locationUpdateToken = 0;
  const officialMapInstances = {};

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
        state.intake = { ...defaultState().intake, ...(saved.intake || {}) };
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
    if(!form) return data;
    $$("input, select, textarea", form).forEach(field => {
      if(field.type === "file") return;
      data[field.id || field.name] = field.value;
    });
    return data;
  }

  function setFormValues(form, values){
    if(!form) return;
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

  function setActionStatus(selector, message, tone = "info"){
    const status = $(selector);
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

  function insuranceGuidance(){
    const damage = String(state.resident.damageCause || "").toLowerCase();
    const floodPolicy = state.resident.floodPolicy || "Unknown";
    const homePolicy = state.resident.homePolicy || "Unknown";
    const foundation = String(state.resident.foundation || "").toLowerCase();
    const structure = state.resident.structureType || "Structure not entered";
    const result = {
      title: "Confirm the water source before choosing a policy.",
      route: "Start with documentation, then ask the insurer to classify the cause of water damage.",
      ask: "Ask: Which policy responds to this cause of water damage, and what documents do you need before cleanup or repair?",
      attach: "Photos, videos, water line, date/time, weather notes, receipts, repair estimates, and mitigation invoices.",
      flags: []
    };

    if(damage.includes("surface floodwater") || damage.includes("rising water")){
      result.title = floodPolicy === "Yes" ? "Call the flood insurer/NFIP carrier first." : "Flood damage may not be covered by a standard home policy.";
      result.route = floodPolicy === "Yes"
        ? "Open a flood claim, document the water source, and separate building damage from contents."
        : "Document the loss, still notify your homeowners/renters insurer, and check FEMA/state/local assistance if a disaster program is open.";
      result.ask = floodPolicy === "Yes"
        ? "Ask: Do I have building coverage, contents coverage, basement limits, and a proof-of-loss deadline?"
        : "Ask: Does any endorsement apply, and can you provide a written coverage decision for the water source?";
      result.flags.push("Rising surface water is generally a flood-insurance question, not regular homeowners/renters coverage.");
    }else if(damage.includes("sewer") || damage.includes("drain")){
      result.title = "Ask about sewer or water-backup endorsement.";
      result.route = "Call the homeowners/renters carrier and ask whether the policy has sewer, drain, or sump backup coverage.";
      result.ask = "Ask: Is this treated as sewer backup, flood-caused backup, or both? Which endorsement applies?";
      result.flags.push("A backup through drains or sewer lines often needs a separate endorsement.");
    }else if(damage.includes("wind-driven") || damage.includes("plumbing") || damage.includes("appliance leak")){
      result.title = homePolicy === "No" ? "Regular property coverage may be missing." : "Call the homeowners/renters carrier first.";
      result.route = homePolicy === "No"
        ? "Document the damage and check assistance routes because regular home/renters coverage is not listed."
        : "Report the sudden interior water, pipe, appliance, roof, or window intrusion claim to the home/renters insurer.";
      result.ask = "Ask: Is this a covered sudden water loss, and what mitigation work can begin now?";
      result.flags.push("Sudden interior water damage is different from outside floodwater.");
    }else if(damage.includes("foundation") || damage.includes("seepage")){
      result.title = "Foundation seepage needs careful review.";
      result.route = "Document where water entered, ask the insurer for a written coverage position, and collect contractor findings.";
      result.ask = "Ask: Is this seepage, floodwater, sewer backup, or a covered opening created by storm damage?";
      result.flags.push("Seepage and groundwater exclusions are common, so the exact source matters.");
    }

    if(foundation.includes("basement")){
      result.flags.push("Basement coverage can be limited under flood policies, especially for contents.");
    }
    if(/detached|garage|shed|yard|fence|landscap/i.test(structure)){
      result.flags.push("Detached structures and outside property can have separate limits or exclusions.");
    }

    return result;
  }

  function renderInsuranceGuide(){
    const container = $("#insuranceDecision");
    if(!container) return;
    const guide = insuranceGuidance();
    container.innerHTML = `
      <p class="eyebrow">Current insurance path</p>
      <h3>${escapeHtml(guide.title)}</h3>
      <p>${escapeHtml(guide.route)}</p>
      <div class="decision-grid">
        <div><strong>Ask next</strong><span>${escapeHtml(guide.ask)}</span></div>
        <div><strong>Attach now</strong><span>${escapeHtml(guide.attach)}</span></div>
      </div>
      ${guide.flags.length ? `<ul class="decision-flags">${guide.flags.map(flag => `<li>${escapeHtml(flag)}</li>`).join("")}</ul>` : ""}
    `;
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

  function pendingNextStep(suggestion){
    const coverage = suggestion.coverage || "";
    const receipt = Number(suggestion.estimate || 0) > 0 ? "Add a receipt or price proof next." : "Add the best price estimate you have.";
    if(/Flood insurance|NFIP/i.test(coverage)){
      return `Check the item name, location, and water source. Then Verify and add it to the inventory. ${receipt} It will be listed for the flood claim packet.`;
    }
    if(/Homeowners|renters/i.test(coverage)){
      return `Confirm whether the damage came from a sudden interior leak, roof/window opening, or another covered cause. Then Verify and add it. ${receipt}`;
    }
    if(/Sewer backup/i.test(coverage)){
      return `Keep plumber, utility, sump, or backflow documentation with this item. Then Verify and add it so the packet separates sewer backup from floodwater.`;
    }
    if(/FEMA|assistance/i.test(coverage)){
      return `Keep this as an assistance/reimbursement need. Verify and add it, then check Assistance so the right program links and documents are included.`;
    }
    return `Review the suggested classification, fix anything wrong, then choose Verify and add. If unsure, leave the coverage route as needs review and add notes.`;
  }

  function renderPending(){
    const container = $("#pendingList");
    const count = $("#pendingCount");
    if(!container) return;
    if(count) count.textContent = `${state.pending.length} pending`;
    if(!state.pending.length){
      container.innerHTML = `
        <div class="next-step-card">
          <strong>No pending suggestions.</strong>
          <p>Upload photos, videos, receipts, PDFs, or an item list, then run analysis. If verified items already exist, go to Inventory to add receipts and prices, then build the packet.</p>
          <div class="action-row">
            <a class="btn ghost" href="#visuals">Upload evidence</a>
            <a class="btn ghost" href="#inventory">Review inventory</a>
            <a class="btn primary" href="#packet">Build packet</a>
          </div>
        </div>`;
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
        <div class="next-step-card compact">
          <strong>Next step</strong>
          <p>${escapeHtml(pendingNextStep(suggestion))}</p>
        </div>
        <p class="coverage-note">${escapeHtml(suggestion.coverageNote || "")}</p>
        <div class="action-row">
          <button class="btn primary" type="button" data-add-suggestion>Verify and add</button>
          <button class="btn ghost" type="button" data-reclassify-suggestion>Reclassify</button>
          <a class="btn ghost" href="#inventory">Go to inventory</a>
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
        ${item.type ? `<small class="assistance-type">${escapeHtml(item.type)}</small>` : ""}
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.route)}</p>
        <p><strong>Attach:</strong> ${escapeHtml(item.documents)}</p>
        ${item.contact ? `<p><strong>Contact:</strong> ${escapeHtml(item.contact)}</p>` : ""}
        ${item.url ? `<a class="mini-btn" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open help site</a>` : ""}
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
    renderGisReadout(area, summary, data);
    renderOfficialMaps(area, summary, data);
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
      return `<a class="layer-button${active === id ? " active" : ""}" href="${escapeHtml(layerSelectHref(id))}" data-gis-layer="${escapeHtml(id)}" role="button">
        <strong>${escapeHtml(layer.shortTitle)}</strong>
        <span>${escapeHtml(layerStatusLabel(integration?.status || "pending"))}</span>
      </a>`;
    }).join("");
    const layer = gisLayerCatalog[active] || gisLayerCatalog.rainElevation;
    const integration = active === "rainElevation" && area?.elevationFeet ? { status: "connected" } : integrationFor(area, active);
    const sourceLinks = sourceLinksForLayer(active, area, integration);
    source.innerHTML = `
      <div>
        <strong>${escapeHtml(layer.title)}</strong>
        <p>${escapeHtml(layer.detail)}</p>
        ${integration?.details ? `<p>${escapeHtml(integration.details)}</p>` : ""}
      </div>
      <div class="layer-source-actions">
        ${sourceLinks.map(link => `<a class="btn ghost" data-active-source-layer="${escapeHtml(active)}" href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`).join("")}
      </div>`;
    $$("[data-gis-layer]", controls).forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        setActiveGisLayer(button.dataset.gisLayer);
      });
    });
  }

  function setActiveGisLayer(layerId){
    if(!gisLayerCatalog[layerId]) return;
    state.gis.activeLayer = layerId;
    writeLayerToUrl(layerId);
    renderGIS();
    saveState();
  }

  function layerSelectHref(layerId){
    const params = new URLSearchParams(window.location.search);
    params.set("layer", layerId);
    const query = params.toString();
    return `${window.location.pathname}${query ? `?${query}` : ""}#gis`;
  }

  function writeLayerToUrl(layerId){
    if(!window.history?.replaceState || !gisLayerCatalog[layerId]) return;
    const params = new URLSearchParams(window.location.search);
    if(params.get("layer") === layerId) return;
    params.set("layer", layerId);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}#gis`);
  }

  function syncLayerFromUrl(){
    const layerId = new URLSearchParams(window.location.search).get("layer");
    if(gisLayerCatalog[layerId]) state.gis.activeLayer = layerId;
  }

  function rainfallArchiveSourceUrl(area){
    const target = mapTarget(area);
    const year = Number(state.gis.selectedYear || new Date().getFullYear());
    let range;
    try{
      range = archiveDateRange(year);
    }catch(error){
      const fallbackYear = new Date().getFullYear();
      range = archiveDateRange(fallbackYear);
    }
    const params = new URLSearchParams({
      latitude: String(target.latitude),
      longitude: String(target.longitude),
      start_date: range.start,
      end_date: range.end,
      daily: "precipitation_sum",
      precipitation_unit: "inch",
      timezone: "auto"
    });
    return `https://archive-api.open-meteo.com/v1/era5?${params.toString()}`;
  }

  function elevationSourceUrl(area){
    const target = mapTarget(area);
    const params = new URLSearchParams({
      latitude: String(target.latitude),
      longitude: String(target.longitude)
    });
    return `https://api.open-meteo.com/v1/elevation?${params.toString()}`;
  }

  function sourceLinksForLayer(layerId, area, integration){
    const target = mapTarget(area);
    if(layerId === "rainElevation"){
      return [
        { label: "Open rainfall data", href: rainfallArchiveSourceUrl(target) },
        { label: "Open elevation data", href: elevationSourceUrl(target) }
      ];
    }
    if(layerId === "macomb"){
      const source = gisSourceForArea(target);
      const links = [
        { label: "Open precise GIS map", href: source.openUrl || source.catalog || source.url || gisLayerCatalog.macomb.url }
      ];
      if(source.localUrl && source.localUrl !== links[0].href) links.push({ label: "Open local GIS portal", href: source.localUrl });
      if(source.catalog && source.catalog !== links[0].href) links.push({ label: "Open layer catalog", href: source.catalog });
      return links;
    }
    if(layerId === "fema"){
      return [
        { label: "Open precise FEMA map", href: femaMapUrl(target) },
        { label: "Open FEMA NFHL viewer", href: FEMA_NFHL_VIEWER_URL },
        { label: "Open FEMA Map Service Center", href: "https://msc.fema.gov/portal" }
      ];
    }
    if(layerId === "drains"){
      const source = drainSourceForArea(target);
      const links = [
        { label: "Open precise waterway map", href: source.openUrl || source.url || integration?.url || gisLayerCatalog.drains.url }
      ];
      if(source.localUrl && source.localUrl !== links[0].href) links.push({ label: isMacombArea(target) ? "Open local drain map" : "Open local source finder", href: source.localUrl });
      return links;
    }
    const layer = gisLayerCatalog[layerId] || gisLayerCatalog.rainElevation;
    return [{ label: "Open source", href: integration?.url || layer.url }];
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
      const fema = integrationFor(area, "fema");
      container.innerHTML = `<p><strong>${escapeHtml(area.name)}</strong> elevation is <strong>${escapeHtml(elevationText)}</strong>. Rainfall has not been loaded yet for ${escapeHtml(String(state.gis.selectedYear))}. FEMA flood-map status: <strong>${escapeHtml(fema?.zone ? `Zone ${fema.zone}` : layerStatusLabel(fema?.status || "pending"))}</strong>.</p>`;
      return;
    }
    const seasonLabel = state.gis.selectedSeason === "annual" ? "all seasons" : state.gis.selectedSeason;
    const monthLabel = Number(state.gis.selectedMonth || 0) ? monthNames[Number(state.gis.selectedMonth) - 1] : "all months";
    const fema = integrationFor(area, "fema");
    const drains = integrationFor(area, "drains");
    container.innerHTML = `<p><strong>${escapeHtml(area.name)}</strong> elevation is <strong>${escapeHtml(elevationText)}</strong>. Rainfall for <strong>${escapeHtml(String(state.gis.selectedYear))}</strong> is <strong>${escapeHtml(formatInches(summary.annual))}</strong>; ${escapeHtml(seasonLabel)} rainfall is <strong>${escapeHtml(formatInches(summary.seasonTotal))}</strong>; ${escapeHtml(monthLabel)} rainfall is <strong>${escapeHtml(formatInches(summary.monthTotal))}</strong>; and rainfall on <strong>${escapeHtml(state.gis.selectedDay || "the selected day")}</strong> is <strong>${escapeHtml(formatInches(summary.dayTotal))}</strong>. FEMA flood-map status: <strong>${escapeHtml(fema?.zone ? `Zone ${fema.zone}` : layerStatusLabel(fema?.status || "pending"))}</strong>. Drain map status: <strong>${escapeHtml(layerStatusLabel(drains?.status || "pending"))}</strong>.</p>`;
  }

  function setFrameSrc(frameId, url){
    const frame = $(`#${frameId}`);
    if(!frame) return;
    frame.removeAttribute("srcdoc");
    if(frame.getAttribute("src") !== url) frame.setAttribute("src", url);
  }

  function setAnchorHref(anchorId, url){
    const link = $(`#${anchorId}`);
    if(link) link.setAttribute("href", url);
  }

  function mapSourceProfile(title){
    return mapSourceProfiles[title] || {
      summary: "Official map or data source.",
      use: "Use this source to confirm the map or data layer before taking action.",
      proof: "Save the source name, date accessed, property address or coordinates, and any map screenshot or downloaded file.",
      next: "Open the official page and confirm details directly with the agency or local office when needed."
    };
  }

  function sourceDetailCardsHtml(profile, url){
    return `
      <article>
        <small>Use it for</small>
        <p>${escapeHtml(profile.use)}</p>
      </article>
      <article>
        <small>Save as proof</small>
        <p>${escapeHtml(profile.proof)}</p>
      </article>
      <article>
        <small>Next step</small>
        <p>${escapeHtml(profile.next)}</p>
      </article>
      <article>
        <small>Official link</small>
        <a class="inline-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a>
      </article>`;
  }

  function setMapSourceViewer(title, url){
    const body = $("#mapSourceViewerBody");
    const summaryEl = $("#mapSourceViewerSummary");
    const titleEl = $("#mapSourceViewerTitle");
    const openLink = $("#mapSourceViewerOpen");
    const profile = mapSourceProfile(title);
    if(titleEl) titleEl.textContent = title || "Official source";
    if(summaryEl) summaryEl.textContent = profile.summary;
    if(openLink) openLink.setAttribute("href", url);
    if(body) body.innerHTML = sourceDetailCardsHtml(profile, url);
    return profile;
  }

  function sourceControlDetails(trigger){
    const card = trigger?.closest("[data-source-url]");
    return {
      title: trigger?.dataset.sourceTitle || card?.dataset.sourceTitle || card?.querySelector("strong")?.textContent || "Official source",
      url: trigger?.dataset.sourceUrl || card?.dataset.sourceUrl || trigger?.getAttribute("href") || ""
    };
  }

  function showMapSourceDetails(trigger, event){
    const details = sourceControlDetails(trigger);
    if(!details.url) return;
    event?.preventDefault();
    event?.stopPropagation();
    setMapSourceViewer(details.title, details.url);
    $("#mapSourceViewer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bindMapSourceActions(){
    const directory = $("#officialMapSources");
    if(!directory || directory.dataset.actionsBound === "true") return;
    directory.dataset.actionsBound = "true";
    $$("#officialMapSources [data-preview-source]").forEach(trigger => {
      trigger.setAttribute("aria-controls", "mapSourceViewer");
      trigger.addEventListener("click", event => showMapSourceDetails(trigger, event));
    });
    directory.addEventListener("click", event => {
      const preview = event.target.closest("[data-preview-source]");
      if(preview){
        showMapSourceDetails(preview, event);
        return;
      }
      const card = event.target.closest("[data-source-url]");
      if(!card || event.target.closest("a,button")) return;
      const details = sourceControlDetails(card);
      if(details.url) window.open(details.url, "_blank", "noopener");
    });
  }

  function osmEmbedUrl(area, delta = .08){
    const target = area && Number.isFinite(area.latitude) && Number.isFinite(area.longitude) ? area : DEFAULT_MAP_AREA;
    const bbox = [
      target.longitude - delta,
      target.latitude - delta,
      target.longitude + delta,
      target.latitude + delta
    ].map(value => value.toFixed(5)).join("%2C");
    const marker = `${target.latitude.toFixed(5)}%2C${target.longitude.toFixed(5)}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  }

  function osmBrowseUrl(area){
    const target = area && Number.isFinite(area.latitude) && Number.isFinite(area.longitude) ? area : DEFAULT_MAP_AREA;
    return `https://www.openstreetmap.org/?mlat=${target.latitude.toFixed(5)}&mlon=${target.longitude.toFixed(5)}#map=13/${target.latitude.toFixed(5)}/${target.longitude.toFixed(5)}`;
  }

  function arcgisViewerUrl(serviceUrl, area, level = 11, title = "Selected location"){
    const target = area && Number.isFinite(area.latitude) && Number.isFinite(area.longitude) ? area : DEFAULT_MAP_AREA;
    const params = new URLSearchParams({
      url: serviceUrl,
      center: `${target.longitude.toFixed(5)},${target.latitude.toFixed(5)}`,
      level: String(level),
      marker: `${target.longitude.toFixed(5)};${target.latitude.toFixed(5)};4326;${title};;${areaLabel(target)}`
    });
    return `https://www.arcgis.com/apps/mapviewer/index.html?${params.toString()}`;
  }

  function arcgisMapImageUrl(serviceUrl, area, delta = .09){
    const target = area && Number.isFinite(area.latitude) && Number.isFinite(area.longitude) ? area : DEFAULT_MAP_AREA;
    const params = new URLSearchParams({
      bbox: [
        (target.longitude - delta).toFixed(5),
        (target.latitude - delta).toFixed(5),
        (target.longitude + delta).toFixed(5),
        (target.latitude + delta).toFixed(5)
      ].join(","),
      bboxSR: "4326",
      imageSR: "3857",
      size: "900,560",
      format: "png32",
      transparent: "false",
      f: "image"
    });
    return `${serviceUrl}/export?${params.toString()}`;
  }

  function elevationMapUrl(area){
    return arcgisViewerUrl(MICHIGAN_ELEVATION_MAP_SERVICE_URL, area, 11, "Elevation and rain location");
  }

  function frameworkMapUrl(area){
    return arcgisViewerUrl(MICHIGAN_FRAMEWORK_MAP_SERVICE_URL, area, 11, "Local land and runoff location");
  }

  function femaMapUrl(area){
    return arcgisViewerUrl(FEMA_NFHL_MAP_SERVICE_URL, area, 11, "FEMA flood map location");
  }

  function hydroViewerUrl(area){
    return arcgisViewerUrl(MICHIGAN_HYDRO_MAP_SERVICE_URL, area, 11, "Drain and waterway location");
  }

  function elevationMapImageUrl(area){
    return arcgisMapImageUrl(MICHIGAN_ELEVATION_MAP_SERVICE_URL, area, .12);
  }

  function frameworkMapImageUrl(area){
    return arcgisMapImageUrl(MICHIGAN_FRAMEWORK_MAP_SERVICE_URL, area, .11);
  }

  function hydroMapImageUrl(area){
    return arcgisMapImageUrl(MICHIGAN_HYDRO_MAP_SERVICE_URL, area, .11);
  }

  function drainMapForArea(area){
    const haystack = `${area?.name || ""} ${area?.admin || ""}`.toLowerCase();
    if(isMacombArea(area)){
      const match = drainMapCatalog.find(entry => entry.patterns.some(pattern => haystack.includes(pattern)));
      return match || { label: "Macomb Countywide drain map", url: MACOMB_DRAIN_COUNTY_PDF };
    }
    return { label: "Michigan waterway and local drain source finder", url: MICHIGAN_GIS_OPEN_DATA_URL };
  }

  function isMacombArea(area){
    const haystack = `${area?.name || ""} ${area?.admin || ""}`.toLowerCase();
    return [
      "macomb",
      "mount clemens",
      "clinton township",
      "warren",
      "center line",
      "fraser",
      "sterling heights",
      "st. clair shores",
      "st clair shores",
      "roseville",
      "eastpointe",
      "utica",
      "shelby township",
      "chesterfield",
      "harrison township",
      "new baltimore",
      "richmond",
      "romeo",
      "armada"
    ].some(value => haystack.includes(value));
  }

  function gisSourceForArea(area){
    if(isMacombArea(area)){
      return {
        label: "Michigan Geographic Framework map centered on the selected place",
        url: frameworkMapImageUrl(area),
        openUrl: frameworkMapUrl(area),
        localUrl: MACOMB_GIS_WEBMAP_URL,
        catalog: MACOMB_GIS_LAYER_CATALOG_URL,
        detail: "a precise statewide GIS map centered on the selected coordinates, with Macomb's official GIS web map linked for parcel-level lookup"
      };
    }
    return {
      label: "State of Michigan Geographic Framework map",
      url: frameworkMapImageUrl(area),
      openUrl: frameworkMapUrl(area),
      catalog: MICHIGAN_GIS_STATE_MAPS_URL,
      detail: "statewide boundaries, roads, water, and local-source replacement for Michigan locations outside Macomb County"
    };
  }

  function drainSourceForArea(area){
    const local = drainMapForArea(area);
    return {
      label: isMacombArea(area) ? `${local.label} plus Michigan hydrography` : "Michigan hydrography and waterway map",
      url: hydroMapImageUrl(area),
      openUrl: hydroViewerUrl(area),
      localUrl: local.url,
      localLabel: local.label
    };
  }

  function sourcePanelHtml(title, subtitle, status, rows, svg, links = []){
    const rowHtml = rows.map(row => `<div class="row"><b>${escapeHtml(row[0])}</b><span>${escapeHtml(row[1])}</span></div>`).join("");
    const linkHtml = links.map(link => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`).join("");
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      :root{font-family:Arial,sans-serif;color:#17212b;background:#f7fbfd}
      body{margin:0;padding:0;background:#f7fbfd}
      .panel{display:grid;grid-template-columns:minmax(220px,.58fr) minmax(0,1fr);min-height:260px}
      .copy{padding:16px;background:#fff;border-right:1px solid #dbe7ec}
      small{display:inline-flex;background:#e6f3ef;color:#15584e;border-radius:999px;padding:4px 8px;font-weight:700;margin-bottom:8px}
      h1{font-size:20px;line-height:1.15;margin:0 0 7px}
      p{margin:0 0 12px;color:#5d7280;line-height:1.45;font-size:13px}
      .row{display:grid;gap:2px;border-top:1px solid #e5eef2;padding:8px 0}
      .row b{font-size:12px}
      .row span{font-size:12px;color:#5d7280;line-height:1.35}
      .links{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
      a{font-size:12px;font-weight:700;color:#155a8a;text-decoration:none}
      .map{min-height:260px;background:linear-gradient(135deg,#eef8f2,#edf6fb);position:relative;overflow:hidden}
      svg{width:100%;height:100%;display:block;min-height:260px}
      @media(max-width:620px){.panel{grid-template-columns:1fr}.copy{border-right:0;border-bottom:1px solid #dbe7ec}}
    </style></head><body><div class="panel"><section class="copy"><small>${escapeHtml(status)}</small><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>${rowHtml}<div class="links">${linkHtml}</div></section><section class="map">${svg}</section></div></body></html>`;
  }

  function markerPosition(area){
    const target = area && Number.isFinite(area.latitude) && Number.isFinite(area.longitude) ? area : DEFAULT_MAP_AREA;
    const minLat = 42.42;
    const maxLat = 42.92;
    const minLon = -83.12;
    const maxLon = -82.52;
    return {
      x: clamp((target.longitude - minLon) / (maxLon - minLon) * 100, 8, 92),
      y: clamp((maxLat - target.latitude) / (maxLat - minLat) * 100, 8, 92)
    };
  }

  function renderMacombGisFrameHtml(area, placeLabel){
    const pos = markerPosition(area);
    const rows = [
      ["Selected place", placeLabel],
      ["Coordinates", area ? `${area.latitude.toFixed(5)}, ${area.longitude.toFixed(5)}` : "Macomb County center"],
      ["Integrated layers", "Parcels, municipal boundaries, imagery, hydrology, soils, environmental assets, flood hazard themes."],
      ["How to use it", "Open the official map to verify parcel, zoning, waterway, and local GIS context before decisions."]
    ];
    const svg = `<svg viewBox="0 0 640 320" role="img" aria-label="Integrated Macomb GIS layer preview">
      <rect width="640" height="320" fill="#edf7fa"/>
      <path d="M42 34 H598 V284 H42 Z" fill="#fff" opacity=".65" stroke="#155a8a" stroke-width="2"/>
      <g opacity=".42" stroke="#155a8a" stroke-width="1">
        <path d="M96 34 V284 M150 34 V284 M204 34 V284 M258 34 V284 M312 34 V284 M366 34 V284 M420 34 V284 M474 34 V284 M528 34 V284"/>
        <path d="M42 78 H598 M42 122 H598 M42 166 H598 M42 210 H598 M42 254 H598"/>
      </g>
      <path d="M92 244 C160 218 216 226 270 184 C350 124 456 154 548 78" fill="none" stroke="#2c8f72" stroke-width="12" opacity=".34"/>
      <path d="M76 112 C158 92 214 110 282 96 C390 72 462 92 574 58" fill="none" stroke="#6c8f5f" stroke-width="7" opacity=".35"/>
      <path d="M106 258 C162 222 238 240 300 194 C382 134 490 150 572 92" fill="none" stroke="#155a8a" stroke-width="6" opacity=".58"/>
      <circle cx="${(pos.x * 6.4).toFixed(1)}" cy="${(pos.y * 3.2).toFixed(1)}" r="17" fill="#fff" stroke="#c3423f" stroke-width="5"/>
      <circle cx="${(pos.x * 6.4).toFixed(1)}" cy="${(pos.y * 3.2).toFixed(1)}" r="7" fill="#c3423f"/>
      <text x="44" y="306" font-family="Arial" font-size="13" fill="#48616f">Local GIS preview: use official web map for parcel-level decisions.</text>
    </svg>`;
    return sourcePanelHtml("Macomb GIS layers", "Integrated county GIS context for the selected area.", "Map 2 integrated", rows, svg, [
      { label: "Open official GIS web map", href: MACOMB_GIS_WEBMAP_URL },
      { label: "Open layer catalog", href: MACOMB_GIS_LAYER_CATALOG_URL }
    ]);
  }

  function renderDrainFrameHtml(area, placeLabel, drainMap){
    const pos = markerPosition(area);
    const rows = [
      ["Selected place", placeLabel],
      ["Drain source", drainMap.label],
      ["Use with", "Rainfall, elevation, road runoff, waterways, and FEMA flood-map context."],
      ["Decision point", "Look for nearby drains, creeks, ditches, low points, street drains, and repeated overflow paths."]
    ];
    const svg = `<svg viewBox="0 0 640 320" role="img" aria-label="Integrated drain map preview">
      <rect width="640" height="320" fill="#eff8fb"/>
      <path d="M36 264 C122 246 188 252 250 208 C324 154 408 170 582 58" fill="none" stroke="#155a8a" stroke-width="12" opacity=".72"/>
      <path d="M154 262 C186 226 214 216 250 208" fill="none" stroke="#155a8a" stroke-width="7" opacity=".54"/>
      <path d="M346 174 C376 132 420 112 472 102" fill="none" stroke="#155a8a" stroke-width="7" opacity=".54"/>
      <path d="M414 162 C464 198 514 204 574 186" fill="none" stroke="#155a8a" stroke-width="7" opacity=".45"/>
      <path d="M64 80 C152 52 232 80 318 64 C428 44 510 56 604 34" fill="none" stroke="#6c8f5f" stroke-width="7" opacity=".3"/>
      <circle cx="${(pos.x * 6.4).toFixed(1)}" cy="${(pos.y * 3.2).toFixed(1)}" r="17" fill="#fff" stroke="#c3423f" stroke-width="5"/>
      <circle cx="${(pos.x * 6.4).toFixed(1)}" cy="${(pos.y * 3.2).toFixed(1)}" r="7" fill="#c3423f"/>
      <circle cx="250" cy="208" r="9" fill="#fff" stroke="#155a8a" stroke-width="4"/>
      <circle cx="472" cy="102" r="9" fill="#fff" stroke="#155a8a" stroke-width="4"/>
      <text x="44" y="306" font-family="Arial" font-size="13" fill="#48616f">Drain preview: open the county PDF for official drain names and boundaries.</text>
    </svg>`;
    return sourcePanelHtml("Drain maps", "Integrated drainage context for the selected area.", "Map 4 integrated", rows, svg, [
      { label: "Open selected drain map", href: drainMap.url },
      { label: "Open drain map index", href: MACOMB_DRAIN_INDEX_URL }
    ]);
  }

  function mapTarget(area){
    return area && Number.isFinite(area.latitude) && Number.isFinite(area.longitude) ? area : DEFAULT_MAP_AREA;
  }

  function leafletReady(){
    return Boolean(window.L && typeof window.L.map === "function");
  }

  function showLeafletFallback(containerId, message){
    const container = $(`#${containerId}`);
    if(!container) return;
    container.innerHTML = `<div class="official-map-empty">${escapeHtml(message)}</div>`;
  }

  function arcgisDynamicTileLayer(serviceUrl, options = {}){
    if(!leafletReady()) return null;
    const TileLayer = L.GridLayer.extend({
      createTile(coords, done){
        const tile = document.createElement("img");
        const size = this.getTileSize();
        const map = this._map;
        const nwPoint = coords.scaleBy(size);
        const sePoint = nwPoint.add(size);
        const nwLatLng = map.unproject(nwPoint, coords.z);
        const seLatLng = map.unproject(sePoint, coords.z);
        const nw = L.CRS.EPSG3857.project(nwLatLng);
        const se = L.CRS.EPSG3857.project(seLatLng);
        const params = new URLSearchParams({
          bbox: [nw.x, se.y, se.x, nw.y].map(value => value.toFixed(2)).join(","),
          bboxSR: "3857",
          imageSR: "3857",
          size: `${size.x},${size.y}`,
          format: "png32",
          transparent: options.transparent === false ? "false" : "true",
          f: "image"
        });
        if(options.layers) params.set("layers", options.layers);
        tile.alt = "";
        tile.decoding = "async";
        tile.loading = "lazy";
        tile.crossOrigin = "";
        tile.onload = () => done(null, tile);
        tile.onerror = () => done(null, tile);
        tile.src = `${serviceUrl}/export?${params.toString()}`;
        return tile;
      }
    });
    return new TileLayer({
      tileSize: 256,
      opacity: options.opacity ?? .72,
      attribution: options.attribution || ""
    });
  }

  function getOfficialLeafletMap(containerId, area, zoom = 11){
    const container = $(`#${containerId}`);
    if(!container) return null;
    if(!leafletReady()){
      showLeafletFallback(containerId, "Interactive map library did not load. Use the Open button for the official source.");
      return null;
    }
    const target = mapTarget(area);
    if(officialMapInstances[containerId]){
      const record = officialMapInstances[containerId];
      record.handlers.forEach(({ event, handler }) => record.map.off(event, handler));
      record.handlers = [];
      record.overlays.forEach(layer => {
        record.map.removeLayer(layer);
        record.control.removeLayer(layer);
      });
      record.overlays = [];
      record.map.setView([target.latitude, target.longitude], zoom);
      return record;
    }

    container.innerHTML = "";
    const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    });
    const topo = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri"
    });
    const imagery = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "Imagery &copy; Esri"
    });
    const map = L.map(container, {
      layers: [streets],
      scrollWheelZoom: false,
      zoomControl: true
    }).setView([target.latitude, target.longitude], zoom);
    const control = L.control.layers(
      { Streets: streets, Topographic: topo, Satellite: imagery },
      {},
      { collapsed: true }
    ).addTo(map);
    const record = { map, control, overlays: [], handlers: [] };
    officialMapInstances[containerId] = record;
    return record;
  }

  function addOfficialOverlay(record, layer, label, visible = true){
    if(!record || !layer) return null;
    if(visible) layer.addTo(record.map);
    record.control.addOverlay(layer, label);
    record.overlays.push(layer);
    return layer;
  }

  function selectedBoundsEnvelope(map){
    const bounds = map.getBounds();
    return {
      xmin: bounds.getWest(),
      ymin: bounds.getSouth(),
      xmax: bounds.getEast(),
      ymax: bounds.getNorth(),
      spatialReference: { wkid: 4326 }
    };
  }

  function arcgisFeatureQueryUrl(serviceUrl, layerId, map, options = {}){
    const params = new URLSearchParams({
      f: "geojson",
      where: options.where || "1=1",
      geometry: JSON.stringify(selectedBoundsEnvelope(map)),
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      outSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      returnGeometry: "true",
      outFields: options.outFields || "*",
      resultRecordCount: String(options.limit || 250)
    });
    return `${serviceUrl}/${layerId}/query?${params.toString()}`;
  }

  function firstProperty(properties, keys){
    for(const key of keys){
      const value = properties?.[key];
      if(value !== undefined && value !== null && String(value).trim()) return String(value);
    }
    return "";
  }

  function featurePopupHtml(title, feature, keys = []){
    const props = feature.properties || {};
    const primary = firstProperty(props, keys);
    const rows = keys
      .map(key => [key, props[key]])
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
      .slice(0, 6)
      .map(([key, value]) => `<br><span>${escapeHtml(key)}: ${escapeHtml(String(value))}</span>`)
      .join("");
    return `<strong>${escapeHtml(title)}</strong>${primary ? `<br>${escapeHtml(primary)}` : ""}${rows}`;
  }

  function addQueryableFeatureOverlay(record, config){
    if(!record || !leafletReady()) return null;
    const group = L.geoJSON(null, {
      style: feature => typeof config.style === "function" ? config.style(feature) : config.style,
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, config.pointStyle || {
        radius: 5,
        color: "#155a8a",
        weight: 2,
        fillColor: "#fff",
        fillOpacity: .9
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(featurePopupHtml(config.label, feature, config.popupKeys || []));
      }
    });
    addOfficialOverlay(record, group, config.label, config.visible !== false);

    let requestId = 0;
    const refresh = async () => {
      if(config.minZoom && record.map.getZoom() < config.minZoom){
        group.clearLayers();
        return;
      }
      const currentRequest = ++requestId;
      try{
        const response = await fetch(arcgisFeatureQueryUrl(config.serviceUrl, config.layerId, record.map, config));
        if(!response.ok) throw new Error(`${config.label} returned ${response.status}`);
        const data = await response.json();
        if(currentRequest !== requestId) return;
        group.clearLayers();
        if(data?.features?.length) group.addData(data);
      }catch(error){
        if(currentRequest === requestId){
          console.warn(`Could not load ${config.label}`, error);
        }
      }
    };
    refresh();
    record.map.on("moveend", refresh);
    record.map.on("zoomend", refresh);
    record.handlers.push({ event: "moveend", handler: refresh });
    record.handlers.push({ event: "zoomend", handler: refresh });
    return group;
  }

  function officialMapPopup(title, area, summary, extra = ""){
    const target = mapTarget(area);
    const elevation = target.elevationFeet ? `${Math.round(target.elevationFeet)} ft` : "not loaded";
    const rain = summary ? `${formatInches(summary.annual)} in ${state.gis.selectedYear}` : "load rainfall for totals";
    return `<strong>${escapeHtml(title)}</strong><br>${escapeHtml(areaLabel(target))}<br>Elevation: ${escapeHtml(elevation)}<br>Rainfall: ${escapeHtml(rain)}${extra ? `<br>${extra}` : ""}<br><em>Drag this marker or click the map to adjust the selected location.</em>`;
  }

  function addAdjustableLocationMarker(record, title, area, summary, extra = "", overlayLabel = "Selected location"){
    const target = mapTarget(area);
    const marker = L.marker([target.latitude, target.longitude], {
      draggable: true,
      autoPan: true
    }).bindPopup(officialMapPopup(title, target, summary, extra));
    marker.on("dragend", event => {
      const latLng = event.target.getLatLng();
      updateSelectedLocationFromMap(latLng.lat, latLng.lng, "Adjusted location");
    });
    const clickHandler = event => {
      updateSelectedLocationFromMap(event.latlng.lat, event.latlng.lng, "Adjusted location");
    };
    record.map.on("click", clickHandler);
    record.handlers.push({ event: "click", handler: clickHandler });
    return addOfficialOverlay(record, marker, overlayLabel);
  }

  function renderRainElevationLeaflet(area, summary){
    const target = mapTarget(area);
    const record = getOfficialLeafletMap("officialRainMap", target, 11);
    if(!record) return;
    addAdjustableLocationMarker(record, "Rain and elevation", target, summary, "", "Elevation/rain point");
    const rainRadius = summary
      ? clamp((summary.dayTotal * 2600) + (summary.monthTotal * 90) + 700, 700, 15000)
      : 1800;
    const rainCircle = L.circle([target.latitude, target.longitude], {
      radius: rainRadius,
      color: "#155a8a",
      weight: 2,
      fillColor: "#2d9bd8",
      fillOpacity: summary ? .18 : .08
    }).bindPopup(officialMapPopup("Loaded rainfall amount", target, summary, "Circle grows with selected day and month rainfall."));
    addOfficialOverlay(record, rainCircle, "Rainfall amount");
    setTimeout(() => record.map.invalidateSize(), 80);
  }

  function renderFrameworkLeaflet(area, summary){
    const target = mapTarget(area);
    const record = getOfficialLeafletMap("officialMacombMap", target, 11);
    if(!record) return;
    addQueryableFeatureOverlay(record, {
      label: "City/township boundary",
      serviceUrl: MICHIGAN_FRAMEWORK_MAP_SERVICE_URL,
      layerId: 2,
      limit: 150,
      popupKeys: ["NAME", "LABEL", "TYPE", "SQMILES"],
      style: { color: "#1f6f63", weight: 2.4, fillColor: "#6fb292", fillOpacity: .08 }
    });
    addQueryableFeatureOverlay(record, {
      label: "Roads and hard surfaces",
      serviceUrl: MICHIGAN_FRAMEWORK_MAP_SERVICE_URL,
      layerId: 20,
      limit: 350,
      minZoom: 10,
      popupKeys: ["RDNAME", "NAME", "ZIPL", "ZIPR"],
      style: { color: "#6b7884", weight: 1.5, opacity: .72 }
    });
    addQueryableFeatureOverlay(record, {
      label: "Groundwater recharge",
      serviceUrl: MICHIGAN_HYDRO_MAP_SERVICE_URL,
      layerId: 8,
      limit: 250,
      popupKeys: ["Recharge_I", "COUNTY", "TWN", "RNG", "SEC"],
      style: feature => {
        const recharge = Number(feature?.properties?.Recharge_I || 0);
        const opacity = recharge >= 8 ? .2 : recharge >= 5 ? .14 : .08;
        return {
          color: "#7b6633",
          weight: 1,
          fillColor: recharge >= 8 ? "#78a86c" : recharge >= 5 ? "#d6bc6a" : "#e8d9aa",
          fillOpacity: opacity
        };
      }
    });
    addQueryableFeatureOverlay(record, {
      label: "Aquifer / drainage context",
      serviceUrl: MICHIGAN_HYDRO_MAP_SERVICE_URL,
      layerId: 7,
      limit: 80,
      popupKeys: ["AQU_CHAR", "AQU_UNIT"],
      style: { color: "#6b4f8a", weight: 1.5, fillColor: "#8f79b6", fillOpacity: .1 }
    });
    addQueryableFeatureOverlay(record, {
      label: "Nearby lakes and ponds",
      serviceUrl: MICHIGAN_HYDRO_MAP_SERVICE_URL,
      layerId: 23,
      limit: 160,
      popupKeys: ["LAKE_NAME", "NAME", "LAKE_TYPE", "ACRES_GIS"],
      style: { color: "#155a8a", weight: 1.4, fillColor: "#2d9bd8", fillOpacity: .22 }
    });
    const runoffRadius = summary
      ? clamp((summary.monthTotal * 75) + (summary.dayTotal * 1900) + 900, 900, 9000)
      : 1800;
    const runoffCircle = L.circle([target.latitude, target.longitude], {
      radius: runoffRadius,
      color: "#7b6633",
      weight: 2,
      fillColor: "#f0c95e",
      fillOpacity: .12
    }).bindPopup(officialMapPopup("Local runoff context", target, summary, "Circle marks the area to inspect for roads, rooftops, low ground, recharge limits, and nearby water features."));
    addOfficialOverlay(record, runoffCircle, "Runoff review area");
    addAdjustableLocationMarker(record, "Local land and runoff context", target, summary, isMacombArea(target) ? "Open GIS map links to Macomb's parcel-level web map. Use this panel to compare local roads, boundaries, recharge, aquifer context, and nearby water features." : "Statewide Michigan context is shown here. Use county or city GIS for parcel-level confirmation.");
    setTimeout(() => record.map.invalidateSize(), 80);
  }

  function renderFemaLeaflet(area, summary){
    const target = mapTarget(area);
    const record = getOfficialLeafletMap("officialFemaMap", target, 11);
    if(!record) return;
    addQueryableFeatureOverlay(record, {
      label: "FEMA flood hazard polygons",
      serviceUrl: FEMA_NFHL_MAP_SERVICE_URL,
      layerId: 28,
      limit: 300,
      popupKeys: ["FLD_ZONE", "ZONE_SUBTY", "SFHA_TF", "STATIC_BFE", "DEPTH"],
      style: feature => {
        const zone = String(feature?.properties?.FLD_ZONE || "");
        const special = String(feature?.properties?.SFHA_TF || "").toUpperCase() === "T" || /A|V/.test(zone);
        return {
          color: special ? "#0b5e89" : "#6f7f89",
          weight: special ? 2 : 1,
          fillColor: special ? "#2d9bd8" : "#b7c7d1",
          fillOpacity: special ? .22 : .1
        };
      }
    });
    const fema = integrationFor(area, "fema");
    const zone = fema?.zone ? `FEMA Zone ${escapeHtml(fema.zone)}` : escapeHtml(layerStatusLabel(fema?.status || "pending"));
    addAdjustableLocationMarker(record, "FEMA flood map", target, summary, `Flood-zone point check: ${zone}. Confirm with the official FEMA map.`);
    setTimeout(() => record.map.invalidateSize(), 80);
  }

  function renderHydroLeaflet(area, summary){
    const target = mapTarget(area);
    const record = getOfficialLeafletMap("officialDrainMap", target, 11);
    if(!record) return;
    addQueryableFeatureOverlay(record, {
      label: "Hydrography lines",
      serviceUrl: MICHIGAN_HYDRO_MAP_SERVICE_URL,
      layerId: 2,
      limit: 350,
      popupKeys: ["NAME", "NAME2", "FCC", "LENGTH"],
      style: { color: "#155a8a", weight: 2.5, opacity: .82 }
    });
    addQueryableFeatureOverlay(record, {
      label: "Wetlands",
      serviceUrl: MICHIGAN_HYDRO_MAP_SERVICE_URL,
      layerId: 18,
      limit: 250,
      popupKeys: ["WETLAND_TYPE", "ATTRIBUTE", "ACRES"],
      style: { color: "#2f7d63", weight: 1.2, fillColor: "#6fb292", fillOpacity: .18 }
    });
    addQueryableFeatureOverlay(record, {
      label: "Watershed boundary",
      serviceUrl: MICHIGAN_HYDRO_MAP_SERVICE_URL,
      layerId: 20,
      limit: 120,
      popupKeys: ["NAME", "HUC_12", "HU_12_NAME", "ACRES"],
      style: { color: "#6c5f2b", weight: 2, fillColor: "#f0c95e", fillOpacity: .08 }
    });
    const drainSource = drainSourceForArea(target);
    addAdjustableLocationMarker(record, "Drain and waterway map", target, summary, `${escapeHtml(drainSource.label)}. Use official local drain records before construction or legal decisions.`);
    setTimeout(() => record.map.invalidateSize(), 80);
  }

  function invalidateOfficialMaps(){
    Object.values(officialMapInstances).forEach(record => {
      if(record?.map) setTimeout(() => record.map.invalidateSize(), 80);
    });
  }

  function renderOfficialMaps(area, summary, data){
    const target = area && Number.isFinite(area.latitude) && Number.isFinite(area.longitude) ? area : null;
    const placeLabel = target ? areaLabel(target) : "Macomb County";
    const elevationText = target?.elevationFeet ? `${Math.round(target.elevationFeet)} ft elevation` : "elevation not loaded yet";
    const rainText = summary ? `${formatInches(summary.annual)} rain in ${state.gis.selectedYear}` : "rainfall not loaded yet";
    const fema = target ? integrationFor(target, "fema") : null;
    const gisSource = gisSourceForArea(target);
    const drainSource = drainSourceForArea(target);

    renderRainElevationLeaflet(target, summary);
    renderFrameworkLeaflet(target, summary);
    renderFemaLeaflet(target, summary);
    renderHydroLeaflet(target, summary);

    setAnchorHref("officialRainLink", elevationMapUrl(target));
    setAnchorHref("officialMacombLink", gisSource.openUrl || gisSource.url);
    setAnchorHref("officialFemaLink", femaMapUrl(target));
    setAnchorHref("officialDrainLink", drainSource.openUrl || drainSource.url);

    const rainStatus = $("#rainElevationMapStatus");
    if(rainStatus) rainStatus.textContent = `${placeLabel}: digital elevation/rain layer is tied to the selected location. ${elevationText}; ${rainText}. Use Load rainfall to update annual, season, month, and day totals.`;
    const macombStatus = $("#macombMapStatus");
    if(macombStatus) macombStatus.textContent = `${placeLabel}: local land/runoff layers are loaded for city or township boundary, roads and hard surfaces, groundwater recharge, aquifer or drainage context, and nearby lakes or ponds. Use this map to understand what around the address may speed up runoff or limit absorption.`;
    const femaStatus = $("#femaMapStatus");
    if(femaStatus) femaStatus.textContent = `${placeLabel}: queryable FEMA NFHL flood hazard polygons are loaded in the current map view. ${fema?.zone ? `Point check returned Zone ${fema.zone}.` : layerStatusLabel(fema?.status || "pending")} Open the FEMA map to confirm the official regulatory flood map.`;
    const drainStatus = $("#drainMapStatus");
    if(drainStatus){
      const drainDetail = `${drainSource.label}. ${isMacombArea(target) ? `Local PDF backup: ${drainSource.localLabel}.` : "Use local county or city sources for municipal drain details."}`;
      drainStatus.textContent = `${placeLabel}: queryable Michigan hydrography, wetlands, and watershed layers are loaded in the current view. ${drainDetail} Use this with rain and elevation because flooding often follows drainage routes, ditches, waterways, and low points.`;
    }
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

  async function fetchFemaFloodZone(area){
    const params = new URLSearchParams({
      f: "json",
      where: "1=1",
      geometry: `${area.longitude},${area.latitude}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE",
      returnGeometry: "false"
    });
    for(const layerId of [28, 4]){
      try{
        const response = await fetch(`${FEMA_NFHL_LAYER_QUERY.replace("/28/query", `/${layerId}/query`)}?${params.toString()}`);
        if(!response.ok) continue;
        const data = await response.json();
        const feature = data.features?.[0]?.attributes;
        if(feature){
          return {
            status: "connected",
            zone: feature.FLD_ZONE || "",
            subtype: feature.ZONE_SUBTY || "",
            sfha: feature.SFHA_TF || "",
            bfe: feature.STATIC_BFE || "",
            url: gisLayerCatalog.fema.url,
            details: `FEMA NFHL point check returned ${feature.FLD_ZONE ? `Zone ${feature.FLD_ZONE}` : "a mapped flood-hazard record"}${feature.SFHA_TF ? `; SFHA: ${feature.SFHA_TF}` : ""}.`
          };
        }
      }catch(error){
        // Try the next known NFHL layer id, then fall back to a source link.
      }
    }
    return {
      status: "no-hit",
      zone: "",
      url: gisLayerCatalog.fema.url,
      details: "No flood-hazard polygon was returned for this point, or the FEMA service could not be queried from this browser. Open the FEMA map to confirm."
    };
  }

  async function refreshLayerData(area = selectedArea()){
    if(!area){
      setGisStatus("Add or sync a city first, then refresh GIS layers.", "warning");
      return;
    }
    if(!area.integrations) area.integrations = {};
    const button = $("#loadLayerDataBtn");
    const oldText = button?.textContent;
    if(button) button.textContent = "Checking...";
    setGisStatus(`Checking GIS layers for ${area.name}...`, "info");
    try{
      const gisSource = gisSourceForArea(area);
      area.integrations.macomb = {
        status: "reference-ready",
        url: gisSource.openUrl || gisSource.catalog || gisSource.url,
        details: `Use ${gisSource.label} for ${gisSource.detail} near ${area.name}.`
      };
      const drainSource = drainSourceForArea(area);
      area.integrations.drains = {
        status: "reference-ready",
        url: drainSource.openUrl || drainSource.localUrl || drainSource.url,
        details: `Use ${drainSource.label} to identify drains, rivers, streams, waterways, and drainage context near ${area.name}.`
      };
      area.integrations.fema = await fetchFemaFloodZone(area);
      setGisStatus(`GIS layers updated for ${area.name}.`, "success");
    }catch(error){
      setGisStatus(`Layer checks could not fully complete. ${error.message || ""}`, "warning");
    }finally{
      if(button) button.textContent = oldText;
      renderGIS();
      renderPacket();
      saveState();
    }
  }

  async function updateSelectedLocationFromMap(latitude, longitude, label = "Adjusted location"){
    const lat = Number(latitude);
    const lon = Number(longitude);
    if(!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const token = ++locationUpdateToken;
    let area = selectedArea();
    if(!area){
      area = normalizeArea({
        name: label,
        admin: "Michigan map point",
        latitude: lat,
        longitude: lon
      });
      state.gis.areas.push(area);
      state.gis.selectedAreaId = area.id;
    }else{
      area.name = label;
      area.admin = "Michigan map point";
      area.latitude = lat;
      area.longitude = lon;
      area.elevationFeet = null;
      area.integrations = {};
    }
    setGisStatus(`Location moved to ${lat.toFixed(5)}, ${lon.toFixed(5)}. Updating elevation, rainfall, FEMA, GIS, and drain layers...`, "info");
    renderGIS();
    renderPacket();
    saveState();
    try{
      area.elevationFeet = await fetchElevationFeet(area);
    }catch(error){
      if(token === locationUpdateToken) setGisStatus(`Location moved. Elevation did not load yet: ${error.message || ""}`, "warning");
    }
    if(token !== locationUpdateToken) return;
    try{
      await loadRainfallForArea(area);
    }catch(error){
      if(token === locationUpdateToken) setGisStatus(`Location moved. Rainfall did not load yet: ${error.message || ""}`, "warning");
    }
    if(token !== locationUpdateToken) return;
    try{
      await refreshLayerData(area);
      if(token === locationUpdateToken) setGisStatus(`Location updated for ${lat.toFixed(5)}, ${lon.toFixed(5)}. The maps now follow this point.`, "success");
    }catch(error){
      if(token === locationUpdateToken) setGisStatus(`Location moved, but one layer check could not finish. ${error.message || ""}`, "warning");
    }finally{
      if(token === locationUpdateToken){
        renderGIS();
        renderPacket();
        saveState();
      }
    }
  }

  function updateMapFrame(area){
    const frame = $("#osmFrame");
    if(!frame) return;
    if(!area){
      const fallbackUrl = osmEmbedUrl(null, .26);
      if(frame.getAttribute("src") !== fallbackUrl) frame.setAttribute("src", fallbackUrl);
      return;
    }
    const url = osmEmbedUrl(area);
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

  function issueFromCurrentHash(){
    const hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
    if(!hash.startsWith("issue-")) return "";
    const issue = hash.slice("issue-".length);
    return issueGuides[issue] ? issue : "";
  }

  function issueFromQuickNeed(need){
    return ({
      flooding: "flooding",
      sewer: "insurance",
      utilities: "aid",
      housing: "housing",
      insurance: "insurance",
      repairs: "building",
      aid: "aid"
    })[need] || "flooding";
  }

  function damageFromQuickNeed(need){
    return ({
      flooding: "Surface floodwater or rising water",
      sewer: "Sewer or drain backup",
      utilities: "Unknown or mixed source",
      housing: "Unknown or mixed source",
      insurance: state.resident.damageCause || "Unknown or mixed source",
      repairs: "Unknown or mixed source",
      aid: "Unknown or mixed source"
    })[need] || state.resident.damageCause || "Unknown or mixed source";
  }

  function assistanceFromQuickStart(need, homeSafe){
    const set = new Set(state.assistance);
    if(homeSafe === "unsafe" || homeSafe === "unknown"){
      set.add("housing");
      set.add("hotel");
    }
    if(homeSafe === "utilities"){
      set.add("electricity");
      set.add("heat");
      set.add("water");
    }
    if(need === "utilities"){
      set.add("electricity");
      set.add("heat");
      set.add("water");
    }
    if(need === "housing"){
      set.add("housing");
      set.add("hotel");
    }
    if(need === "sewer"){
      set.add("water");
      set.add("repairs");
    }
    if(need === "repairs"){
      set.add("repairs");
      set.add("building");
    }
    if(need === "aid"){
      set.add("food");
      set.add("hotel");
      set.add("daycare");
      set.add("housing");
    }
    return Array.from(set);
  }

  function quickStartCards(){
    const intake = state.intake || {};
    const emergency = intake.emergencyStatus;
    const need = intake.quickNeed;
    const homeSafe = intake.quickHomeSafe;
    const cards = [];
    if(emergency === "yes"){
      cards.push({
        title: "Get safe first",
        body: "If water is rising, power may be unsafe, exits are blocked, or someone may be hurt, use emergency steps before paperwork.",
        href: "#urgentHelp",
        label: "Open emergency steps",
        tone: "danger"
      });
    }else{
      cards.push({
        title: "Start a recovery record",
        body: "You are not reporting active danger. Save the address, issue, photos, receipts, and notes so help can stay organized.",
        href: "#visuals",
        label: "Add photos or notes",
        tone: "primary"
      });
    }

    if(homeSafe === "unsafe" || homeSafe === "unknown"){
      cards.push({
        title: "Plan where to stay",
        body: "Track why the home may not be safe and save hotel, shelter, utility, inspection, and access documents.",
        href: "#housing",
        label: "Find housing help",
        tone: "primary"
      });
    }else if(homeSafe === "utilities"){
      cards.push({
        title: "Separate utility needs",
        body: "Electric/gas, heat/HVAC, and water/sewer help use different contacts and documents.",
        href: "#assistance",
        label: "Open assistance",
        tone: "primary"
      });
    }

    const needCard = {
      flooding: {
        title: "Check the location and water source",
        body: "Use map data for rainfall, elevation, FEMA flood maps, GIS layers, and drain context for this area.",
        href: "#gis",
        label: "Open map data"
      },
      sewer: {
        title: "Separate sewer backup from floodwater",
        body: "A plumber report, backup photos, cleanup invoices, and sump/backflow records help route insurance and assistance correctly.",
        href: "#insurance",
        label: "Check coverage route"
      },
      utilities: {
        title: "Use the right utility path",
        body: "Do not mix electric/gas shutoff help with water/sewer or plumbing help. Each has different proof.",
        href: "#assistance",
        label: "Open utility help"
      },
      housing: {
        title: "Document why the home is not usable",
        body: "Unsafe access, no heat, no power, contamination, or repair barriers can support shelter, hotel, aid, or claim notes.",
        href: "#housing",
        label: "Open housing help"
      },
      insurance: {
        title: "Find which policy to call",
        body: "Coverage depends on whether the damage came from floodwater, sewer backup, pipe leak, roof opening, or another source.",
        href: "#insurance",
        label: "Open insurance tool"
      },
      repairs: {
        title: "Use the first-fix playbook",
        body: "Get the order for water extraction, electrical checks, HVAC, mold prevention, debris removal, and safe access.",
        href: "immediate-fixes.html",
        label: "Open fix playbook"
      },
      aid: {
        title: "Match the need to the right help",
        body: "Food, hotel, childcare, bills, utilities, housing, and repairs should be tracked separately.",
        href: "#assistance",
        label: "Open aid matcher"
      }
    }[need];
    if(needCard) cards.push({ ...needCard, tone: "primary" });

    cards.push({
      title: "Build one packet",
      body: "Put map context, photos, receipts, item values, assistance needs, and contact notes in one printable/downloadable packet.",
      href: "#packet",
      label: "Build packet",
      tone: "secondary"
    });
    return cards.slice(0, 4);
  }

  function quickStartIsReady(){
    const intake = state.intake || {};
    return Boolean(intake.emergencyStatus && (state.resident.city || state.resident.street) && intake.quickNeed);
  }

  function setQuickStartValues(){
    const form = $("#quickStartForm");
    if(!form) return;
    setFormValues(form, {
      quickName: state.resident.residentName || "",
      quickContact: state.resident.email || state.resident.phone || "",
      quickStreet: state.resident.street || "",
      quickCity: state.resident.city || "",
      quickHomeSafe: state.intake?.quickHomeSafe || "",
      quickNeed: state.intake?.quickNeed || ""
    });
  }

  function syncQuickStartFromForm(){
    const form = $("#quickStartForm");
    if(!form) return;
    const data = collectForm(form);
    const contact = (data.quickContact || "").trim();
    state.intake = {
      ...(state.intake || {}),
      quickNeed: data.quickNeed || "",
      quickHomeSafe: data.quickHomeSafe || ""
    };
    state.resident = {
      ...state.resident,
      residentName: data.quickName || state.resident.residentName || "",
      street: data.quickStreet || state.resident.street || "",
      city: data.quickCity || state.resident.city || "",
      damageCause: damageFromQuickNeed(data.quickNeed)
    };
    if(contact.includes("@")){
      state.resident.email = contact;
    }else if(contact){
      state.resident.phone = contact;
    }
    if(data.quickNeed){
      state.selectedIssue = issueFromQuickNeed(data.quickNeed);
      state.assistance = assistanceFromQuickStart(data.quickNeed, data.quickHomeSafe);
    }
    setFormValues($("#residentForm"), state.resident);
  }

  function renderQuickHelpPlan(){
    const plan = $("#quickHelpPlan");
    if(!plan) return;
    const intake = state.intake || {};
    $$("#emergencyChoice [data-emergency-status]").forEach(button => {
      button.classList.toggle("active", button.dataset.emergencyStatus === intake.emergencyStatus);
    });
    const ready = quickStartIsReady();
    if(!ready){
      plan.classList.remove("ready");
      plan.innerHTML = `
        <div class="step-number">3</div>
        <div>
          <h3>Your next steps will appear here</h3>
          <p>Choose emergency status, enter the property location, and select the main problem. The page will then show the first steps to take.</p>
        </div>
      `;
      return;
    }
    const address = [state.resident.street, state.resident.city].filter(Boolean).join(", ");
    const cards = quickStartCards();
    plan.classList.add("ready");
    plan.innerHTML = `
      <div class="step-number">3</div>
      <div>
        <p class="eyebrow">Your help plan</p>
        <h3>Start here for ${escapeHtml(address || "this property")}</h3>
        <p class="plan-note">If danger changes at any point, stop and use emergency services first. Otherwise, follow these steps in order.</p>
        <div class="plan-grid">
          ${cards.map((card, index) => `
            <article class="plan-card">
              <strong>${index + 1}. ${escapeHtml(card.title)}</strong>
              <span>${escapeHtml(card.body)}</span>
              <a class="btn ${card.tone === "danger" ? "danger" : card.tone === "secondary" ? "secondary" : "primary"}" href="${escapeHtml(card.href)}">${escapeHtml(card.label)}</a>
            </article>
          `).join("")}
        </div>
      </div>
    `;
  }

  function applyQuickStart(){
    syncQuickStartFromForm();
    renderAll();
    saveState();
    $("#quickHelpPlan")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const city = (state.resident.city || "").trim();
    if(quickStartIsReady() && city && !/\d/.test(city) && city.toLowerCase() !== lastCitySyncValue){
      syncCityToMap();
    }
  }

  function renderPacket(){
    const preview = $("#documentPreview");
    if(!preview) return;
    preview.innerHTML = buildPacketHtml();
  }

  function renderLocalLawReadout(){
    const container = $("#localLawReadout");
    if(!container) return;
    const area = selectedArea();
    const residentCity = (state.resident.city || "").trim();
    const place = residentCity || area?.name || "the selected property";
    const fema = integrationFor(area, "fema");
    const femaStatus = fema?.zone ? `FEMA flood map returned Zone ${fema.zone}` : layerStatusLabel(fema?.status || "pending");
    const elevation = area?.elevationFeet ? `${Math.round(area.elevationFeet)} ft` : "not loaded yet";
    container.innerHTML = `
      <p class="eyebrow">Location law readout</p>
      <h3>Start with ${escapeHtml(place)}</h3>
      <p>Use the city or township for zoning, permits, building inspections, and local floodplain administration. Use county/state sources for drain, floodplain, waterway, and permit context when local rules point there.</p>
      <div class="decision-grid">
        <div><strong>Map status</strong><span>${escapeHtml(femaStatus)}. Elevation: ${escapeHtml(elevation)}.</span></div>
        <div><strong>Ask locally</strong><span>Is this parcel in a regulated floodplain, floodway, wetland, shoreline, drain corridor, or zoning overlay?</span></div>
        <div><strong>Repair trigger</strong><span>Ask whether permits, inspections, substantial damage review, substantial improvement review, or an elevation certificate apply.</span></div>
        <div><strong>Better standard</strong><span>Compare minimum code to freeboard, raised utilities, flood-resistant materials, drainage, backflow, sump backup, and safe access.</span></div>
      </div>
    `;
  }

  function buildPacketHtml(){
    const total = state.items.reduce((sum, item) => sum + Number(item.estimate || 0), 0);
    const resident = state.resident;
    const packet = state.packet;
    const { score } = calculateRisk();
    const gisArea = selectedArea();
    const gisData = selectedRainData(gisArea);
    const gisSummary = gisData.length ? summarizeRain(gisData) : null;
    const fema = integrationFor(gisArea, "fema");
    const drains = integrationFor(gisArea, "drains");
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
          <div class="doc-field"><strong>Map location</strong>${escapeHtml(gisArea ? areaLabel(gisArea) : "Not set")}</div>
          <div class="doc-field"><strong>Elevation</strong>${escapeHtml(gisArea?.elevationFeet ? `${Math.round(gisArea.elevationFeet)} ft` : "Not loaded")}</div>
          <div class="doc-field"><strong>Rainfall</strong>${escapeHtml(gisSummary ? `${state.gis.selectedYear}: ${formatInches(gisSummary.annual)}` : "Not loaded")}</div>
          <div class="doc-field"><strong>Flood map status</strong>${escapeHtml(fema?.zone ? `FEMA Zone ${fema.zone}` : layerStatusLabel(fema?.status || "pending"))}</div>
          <div class="doc-field"><strong>Drain map status</strong>${escapeHtml(layerStatusLabel(drains?.status || "pending"))}</div>
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
    const gisArea = selectedArea();
    const gisData = selectedRainData(gisArea);
    const gisSummary = gisData.length ? summarizeRain(gisData) : null;
    const fema = integrationFor(gisArea, "fema");
    const drains = integrationFor(gisArea, "drains");
    const lines = [
      "Macomb Flood Response Packet Summary",
      `Resident: ${resident.residentName || "Not provided"}`,
      `Contact: ${[resident.phone, resident.email].filter(Boolean).join(" / ") || "Not provided"}`,
      `Property: ${[resident.street, resident.city, resident.zip].filter(Boolean).join(", ") || "Not provided"}`,
      `Structure: ${resident.structureType || "Not provided"} / ${resident.foundation || "Not provided"}`,
      `Policies: Flood=${resident.floodPolicy || "Unknown"}; Home/Renters=${resident.homePolicy || "Unknown"}`,
      `Primary damage source: ${resident.damageCause || "Unknown"}`,
      `Map location: ${gisArea ? areaLabel(gisArea) : "Not set"}`,
      `Elevation: ${gisArea?.elevationFeet ? `${Math.round(gisArea.elevationFeet)} ft` : "Not loaded"}`,
      `Rainfall: ${gisSummary ? `${state.gis.selectedYear}: ${formatInches(gisSummary.annual)}` : "Not loaded"}`,
      `FEMA flood map status: ${fema?.zone ? `Zone ${fema.zone}` : layerStatusLabel(fema?.status || "pending")}`,
      `Drain map status: ${layerStatusLabel(drains?.status || "pending")}`,
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
      renderPending();
      setActionStatus("#visualActionStatus", "Select photos, videos, receipts, PDFs, or an item list first. Then run analysis.", "warning");
      return;
    }
    if(!fresh.length){
      setActionStatus("#visualActionStatus", "No new files to analyze. Review pending suggestions or upload another file.", "info");
      $("#pendingList")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    fresh.forEach(upload => state.pending.push(inferFromFile(upload)));
    renderPending();
    setActionStatus("#visualActionStatus", `${fresh.length} file(s) analyzed. Review each suggestion, correct it, then choose Verify and add.`, "success");
    $("#pendingList")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    setActionStatus("#inventoryActionStatus", "Manual item added. Fill in the item, location, coverage route, receipt, and price.", "success");
    $("#inventoryRows")?.scrollIntoView({ behavior: "smooth", block: "start" });
    saveState();
  }

  async function searchMichiganLocations(query, limit = 8){
    const results = [];
    try{
      const params = new URLSearchParams({ name: query, count: String(limit), language: "en", format: "json" });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
      if(response.ok){
        const data = await response.json();
        (data.results || []).forEach(item => results.push({
          name: item.name,
          admin1: item.admin1 || "",
          admin2: item.admin2 || "",
          country_code: item.country_code || "",
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          elevation: item.elevation || "",
          source: "Open-Meteo"
        }));
      }
    }catch(error){
      // Address search below can still succeed.
    }

    try{
      const addressQuery = /\bmichigan\b|\bmi\b/i.test(query) ? query : `${query}, Michigan`;
      const params = new URLSearchParams({ q: addressQuery, format: "jsonv2", addressdetails: "1", limit: String(limit), countrycodes: "us" });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      if(response.ok){
        const data = await response.json();
        data.forEach(item => {
          const address = item.address || {};
          results.push({
            name: address.city || address.town || address.village || address.hamlet || address.suburb || item.name || String(item.display_name || "").split(",")[0],
            admin1: address.state || "",
            admin2: address.county || "",
            country_code: "US",
            latitude: Number(item.lat),
            longitude: Number(item.lon),
            elevation: "",
            displayName: item.display_name || "",
            source: "OpenStreetMap"
          });
        });
      }
    }catch(error){
      // Return any city-level results already found.
    }

    const seen = new Set();
    return results
      .filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
      .filter(item => {
        const key = `${item.name}|${item.latitude.toFixed(4)}|${item.longitude.toFixed(4)}`;
        if(seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const aMi = String(a.admin1 || "").toLowerCase() === "michigan" ? 0 : 1;
        const bMi = String(b.admin1 || "").toLowerCase() === "michigan" ? 0 : 1;
        return aMi - bMi;
      })
      .slice(0, limit);
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
      const data = await searchMichiganLocations(query, 8);
      renderAreaResults(data);
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
      const admin = [result.admin2, result.admin1, result.country_code].filter(Boolean).join(", ");
      const display = result.displayName || admin;
      return `<article class="result-card">
        <div>
          <strong>${escapeHtml(result.name)}</strong>
          <span>${escapeHtml(display)} / ${Number(result.latitude).toFixed(4)}, ${Number(result.longitude).toFixed(4)}${result.elevation ? ` / ${Math.round(Number(result.elevation) * 3.28084)} ft` : ""}</span>
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
      if(options.loadLayers !== false){
        await refreshLayerData(target);
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

  function fallbackLocationQuery(){
    const city = (state.resident.city || $("#city")?.value || "").trim();
    if(city && !/\d/.test(city)) return city;
    const searchedPlace = ($("#areaSearch")?.value || "").trim();
    if(searchedPlace && !/\d/.test(searchedPlace)) return searchedPlace;
    return "";
  }

  async function geocodeMichiganPlace(query){
    const matches = await searchMichiganLocations(query, 8);
    const result = matches.find(item => item.country_code === "US" && String(item.admin1 || "").toLowerCase() === "michigan") ||
      matches.find(item => item.country_code === "US") ||
      matches[0];
    if(!result) throw new Error("No matching city was found.");
    return result;
  }

  async function addPlaceResultToMap(result){
    return addArea({
      name: result.name,
      admin: [result.admin2, result.admin1, result.country_code].filter(Boolean).join(", "),
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
      elevationFeet: Number.isFinite(Number(result.elevation)) ? Number(result.elevation) * 3.28084 : null
    });
  }

  async function fallbackToKnownLocation(reason){
    const query = fallbackLocationQuery();
    if(!query){
      setGisStatus(`${reason} Enter a city/community in Resident Info, or use GIS search/coordinates. Exact browser location cannot be added without permission.`, "warning");
      return null;
    }
    setGisStatus(`${reason} Using ${query} as the map location instead...`, "info");
    const result = await geocodeMichiganPlace(query);
    const area = await addPlaceResultToMap(result);
    const results = $("#areaResults");
    if(results) results.innerHTML = `<p class="fine-print">Exact browser location was not available. The map is using ${escapeHtml(result.name)} instead.</p>`;
    return area;
  }

  async function geolocationPermissionState(){
    if(!navigator.permissions?.query) return "unknown";
    try{
      const permission = await navigator.permissions.query({ name: "geolocation" });
      return permission.state || "unknown";
    }catch(error){
      return "unknown";
    }
  }

  function geolocationErrorReason(error){
    if(error?.code === 1) return "Location permission is blocked or denied.";
    if(error?.code === 2) return "The browser could not determine an exact location.";
    if(error?.code === 3) return "Location lookup timed out.";
    return error?.message ? `Location failed: ${error.message}` : "Exact location could not be used.";
  }

  async function syncCityToMap(){
    const city = state.resident.city || $("#city")?.value.trim() || "";
    const results = $("#areaResults");
    if(!city){
      setGisStatus("Enter a city or community in the resident information first, then sync it to the map.", "warning");
      return;
    }
    if(/\d/.test(city)){
      setGisStatus("The map can auto-sync city or community names. For a street address or ZIP, use the GIS search box so you choose the exact result.", "warning");
      return;
    }
    lastCitySyncValue = city.toLowerCase();
    const button = $("#syncCityBtn");
    const oldText = button?.textContent;
    if(button) button.textContent = "Syncing...";
    setGisStatus(`Finding ${city} in Michigan, then loading map layers...`, "info");
    try{
      const result = await geocodeMichiganPlace(city);
      await addPlaceResultToMap(result);
      if(results) results.innerHTML = `<p class="fine-print">Synced ${escapeHtml(result.name)} to the map. FEMA flood-map and drain-map references now follow this selected location.</p>`;
    }catch(error){
      lastCitySyncValue = "";
      setGisStatus(`Could not sync the city. You can still use GIS search or coordinates. ${error.message || ""}`, "warning");
    }finally{
      if(button) button.textContent = oldText;
    }
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
      await fallbackToKnownLocation("This browser does not provide exact location access.");
      return;
    }
    if(button) button.textContent = "Locating...";
    try{
      const permissionState = await geolocationPermissionState();
      if(permissionState === "denied"){
        await fallbackToKnownLocation("Location permission is blocked for this site.");
        return;
      }
      if(permissionState === "prompt"){
        setGisStatus("The browser should ask for location permission. Choose Allow to use exact location, or the map will fall back to city if permission is blocked.", "info");
      }
      const position = await Promise.race([
        new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 60000, timeout: 12000 });
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject({ code: 3, message: "The browser did not return a location response." }), 15000);
        })
      ]);
      setGisStatus("Location found. Loading elevation and rainfall data...", "info");
      await addArea({
        name: "Current location",
        admin: "Browser location",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    }catch(error){
      try{
        await fallbackToKnownLocation(geolocationErrorReason(error));
      }catch(fallbackError){
        setGisStatus(`${geolocationErrorReason(error)} ${fallbackError.message || "Use GIS search or coordinates instead."}`, "warning");
      }
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
      const response = await fetch(`https://archive-api.open-meteo.com/v1/era5?${params.toString()}`);
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
    renderQuickHelpPlan();
    renderIssueDetail();
    renderInsuranceGuide();
    renderUploads();
    renderPending();
    renderInventory();
    renderAssistance();
    renderGIS();
    renderLocalLawReadout();
    renderMetrics();
    renderPacket();
  }

  function topLevelSectionFor(target){
    const main = $(".app-main");
    if(!main || !target) return null;
    let node = target;
    while(node && node.parentElement !== main){
      node = node.parentElement;
    }
    return node && node.parentElement === main ? node : null;
  }

  function currentHashTarget(){
    const requestedId = decodeURIComponent((window.location.hash || "#start").slice(1));
    return document.getElementById(requestedId) || $("#start");
  }

  function scrollCurrentHashTarget(){
    const target = currentHashTarget();
    requestAnimationFrame(() => {
      target?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }

  function setActiveFocusSection(){
    const main = $(".app-main");
    if(!main) return;
    const target = currentHashTarget();
    const activeTop = topLevelSectionFor(target) || $("#start");
    const issueHash = issueFromCurrentHash();
    if(issueHash && state.selectedIssue !== issueHash){
      state.selectedIssue = issueHash;
      renderIssueDetail(issueHash);
    }
    main.classList.add("focus-mode");

    $$(".app-main > .status-strip, .app-main > .section-band, .app-main > .app-grid").forEach(section => {
      section.classList.toggle("active-section", section === activeTop);
      section.classList.remove("focus-nested-mode");
      $$(".active-nested", section).forEach(child => child.classList.remove("active-nested"));
    });

    if(activeTop?.classList.contains("app-grid") && target !== activeTop){
      activeTop.classList.add("focus-nested-mode");
      const directChild = Array.from(activeTop.children).find(child => child === target || child.contains(target));
      if(directChild) directChild.classList.add("active-nested");
    }

    const currentHash = `#${target?.id || "start"}`;
    const topHash = activeTop?.id ? `#${activeTop.id}` : currentHash;
    $$(".focus-link-grid a, .nav-links a").forEach(link => {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("active", href === currentHash || href === topHash || href.endsWith(currentHash) || href.endsWith(topHash));
    });
    if(activeTop?.id === "gis") invalidateOfficialMaps();
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
      return `${item.title}\nType: ${item.type || "Assistance"}\nNext step: ${item.route}\nAttach: ${item.documents}\nContact: ${item.contact || "Confirm with the correct assistance provider."}\nResource: ${item.url || "Not listed"}`;
    }).join("\n\n");
  }

  async function downloadZip(){
    const cleanState = {
      resident: state.resident,
      packet: state.packet,
      items: state.items.map(({ receiptFile, ...item }) => item),
      assistance: state.assistance,
      gis: {
        selectedArea: selectedArea(),
        activeLayer: state.gis.activeLayer,
        selectedYear: state.gis.selectedYear,
        selectedSeason: state.gis.selectedSeason,
        selectedMonth: state.gis.selectedMonth,
        selectedDay: state.gis.selectedDay
      },
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
    state.intake = {
      emergencyStatus: "yes",
      quickNeed: "flooding",
      quickHomeSafe: "unsafe"
    };
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
        integrations: {
          macomb: { status: "reference-ready", url: MACOMB_GIS_WEBMAP_URL, details: "Use Macomb County GIS layers as the official county context for Mount Clemens." },
          drains: { status: "reference-ready", url: "https://www.macombgov.org/sites/default/files/files/2022-10/city_of_mount_clemens_city_of_fraser_clinton_township.pdf", details: "Use the Mount Clemens / Fraser / Clinton Township drain map to identify drainage assets and waterways near Mount Clemens." },
          fema: { status: "reference-ready", url: gisLayerCatalog.fema.url, details: "Open FEMA flood maps to confirm the official flood zone for this sample location." }
        },
        addedAt: new Date().toISOString()
      }]
    };
    setFormValues($("#residentForm"), state.resident);
    setFormValues($("#packetForm"), state.packet);
    setQuickStartValues();
    setGISControlValues();
    addSampleSuggestions();
    renderAll();
    saveState();
  }

  function bindEvents(){
    const residentForm = $("#residentForm");
    const packetForm = $("#packetForm");
    $("#emergencyChoice")?.addEventListener("click", event => {
      const button = event.target.closest("[data-emergency-status]");
      if(!button) return;
      state.intake = {
        ...(state.intake || {}),
        emergencyStatus: button.dataset.emergencyStatus
      };
      renderQuickHelpPlan();
      saveState();
      $("#quickStartForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#quickStartForm")?.addEventListener("input", () => {
      syncQuickStartFromForm();
      renderAll();
      saveState();
    });
    $("#quickStartForm")?.addEventListener("change", () => {
      syncQuickStartFromForm();
      renderAll();
      saveState();
    });
    $("#showHelpPlanBtn")?.addEventListener("click", applyQuickStart);
    residentForm.addEventListener("input", () => {
      state.resident = { ...state.resident, ...collectForm(residentForm) };
      renderInsuranceGuide();
      renderGIS();
      renderPacket();
      renderMetrics();
      saveState();
    });
    residentForm.addEventListener("change", event => {
      state.resident = { ...state.resident, ...collectForm(residentForm) };
      renderInsuranceGuide();
      renderGIS();
      renderPacket();
      saveState();
      if(event.target?.id === "city"){
        const city = state.resident.city.trim();
        if(city && !/\d/.test(city) && city.toLowerCase() !== lastCitySyncValue){
          syncCityToMap();
        }
      }
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
    $("#sampleCaseBtn")?.addEventListener("click", loadSampleCase);
    $("#issueGrid").addEventListener("click", event => {
      const card = event.target.closest("[data-issue]");
      if(!card) return;
      event.preventDefault();
      state.selectedIssue = card.dataset.issue;
      renderIssueDetail();
      const nextHash = `#issue-${state.selectedIssue}`;
      if(window.location.hash !== nextHash){
        window.location.hash = nextHash;
      }else{
        setActiveFocusSection();
      }
      $("#issueDetail")?.scrollIntoView({ behavior: "auto", block: "start" });
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
    $("#sampleVisualBtn")?.addEventListener("click", addSampleSuggestions);
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
    $("#syncCityBtn").addEventListener("click", () => syncCityToMap());
    $("#loadLayerDataBtn").addEventListener("click", () => refreshLayerData());
    $("#gisLayerControls").addEventListener("click", event => {
      const button = event.target.closest("[data-gis-layer]");
      if(!button) return;
      setActiveGisLayer(button.dataset.gisLayer);
    });
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
      setQuickStartValues();
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
        setActionStatus("#inventoryActionStatus", `${suggestion.name || "Item"} was added to inventory. Next: add receipt/price proof, confirm coverage route, then build the packet.`, "success");
        $("#inventory")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    $("#officialMaps")?.addEventListener("click", event => {
      const button = event.target.closest("[data-use-map-center]");
      if(!button) return;
      const mapId = button.dataset.useMapCenter;
      const record = officialMapInstances[mapId];
      if(!record?.map){
        setGisStatus("That map is still loading. Try again after the map appears.", "warning");
        return;
      }
      const center = record.map.getCenter();
      updateSelectedLocationFromMap(center.lat, center.lng, "Map center location");
    });
    bindMapSourceActions();
    window.addEventListener("hashchange", () => {
      setActiveFocusSection();
      scrollCurrentHashTarget();
    });
  }

  function init(){
    if(!$("#residentForm")) return;
    loadState();
    syncLayerFromUrl();
    setFormValues($("#residentForm"), state.resident);
    setFormValues($("#packetForm"), state.packet);
    setQuickStartValues();
    setGISControlValues();
    bindEvents();
    renderAll();
    setActiveFocusSection();
    scrollCurrentHashTarget();
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindMapSourceActions();
    init();
  });
})();
