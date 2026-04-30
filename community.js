(function(){
  "use strict";
  if(window.MFR_COMMUNITY_SCRIPT_LOADED) return;
  window.MFR_COMMUNITY_SCRIPT_LOADED = true;

  const advice = {
    street: ["Photograph water depth, direction, drains, curbs, ditches, and timing.", "Add the location to the map page and compare rain, elevation, drains, and impervious surfaces.", "Start or join a rain garden, drain reporting, or repeated-flooding map-note initiative."],
    basement: ["Do not enter if electricity, gas, sewage, structure, or medical risk is present.", "Photograph water lines, utilities, sump, walls, contents, and exterior water paths.", "Use the immediate-fixes playbook before cleanup and consider sump backup, raised storage, and wall/drainage improvements."],
    sewer: ["Separate sewer backup from surface floodwater and clean-water leaks.", "Save plumber reports, backup photos, sump/backflow records, cleanup invoices, and utility notices.", "Ask neighbors if similar backups happened at the same time and report patterns to the correct water/sewer or public works contact."],
    walls: ["Photograph cracks, seepage points, grading, gutters, downspouts, window wells, and water paths.", "Do not cover wet walls with new finishes until moisture and source are addressed.", "Consider exterior drainage, grading, backfill, waterproofing scope, sump/backflow systems, and flood-resistant lower materials."],
    drain: ["Photograph the blocked drain or ditch without entering unsafe water.", "Record date, time, rainfall, water depth, and nearby impacts.", "Coordinate a reporting group and send consistent evidence to public works, drain office, or local officials."],
    rebuild: ["Sort work into emergency cleanup, permit-triggering repairs, code requirements, and resilience upgrades.", "Compare contractor scopes and ask what can be raised, protected, or rebuilt with flood-resistant materials.", "Use a rebuild support circle for estimates, permits, receipts, and safe-material choices."],
    items: ["List what was lost and what is needed: beds, chairs, appliances, storage, clothes, tools, cleaning supplies.", "Keep personal requests separate from insurance inventory if values differ.", "Use the furniture and household replacement initiative to match offers with needs."]
  };

  function clean(value){
    return String(value || "").replace(/[<>&]/g, "");
  }

  function loadOffers(){
    try{
      const parsed = JSON.parse(localStorage.getItem("mfr-community-offers") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    }catch(error){
      return [];
    }
  }

  const offers = loadOffers();

  function renderAdvice(){
    const adviceBox = document.getElementById("communityAdvice");
    if(!adviceBox) return;
    const area = clean(document.getElementById("communityArea")?.value.trim()) || "this area";
    const type = document.getElementById("communityIssueType")?.value || "street";
    const description = clean(document.getElementById("communityDescription")?.value.trim());
    const photoCount = document.getElementById("communityPhotos")?.files.length || 0;
    const items = advice[type] || advice.street;
    adviceBox.innerHTML = `
      <p class="eyebrow">Suggested path</p>
      <h3>First steps for ${area}</h3>
      ${description ? `<p>${description}</p>` : ""}
      ${photoCount ? `<p><strong>${photoCount} file(s) selected.</strong> Keep copies with dates and location notes.</p>` : ""}
      <ul>${items.map(item => `<li>${item}</li>`).join("")}</ul>
      <div class="hero-actions">
        <a class="btn primary" href="index.html#photo-guide">Photo checklist</a>
        <a class="btn secondary" href="prepare.html">Prepare page</a>
        <a class="btn ghost" href="index.html#gis">Map data</a>
      </div>
    `;
  }

  function renderOffers(){
    const supportList = document.getElementById("supportList");
    if(!supportList) return;
    if(!offers.length){
      supportList.innerHTML = '<p class="fine-print">No local offers saved in this browser yet.</p>';
      return;
    }
    supportList.innerHTML = offers.map(offer => `
      <article class="support-card">
        <small>${clean(offer.type)}</small>
        <strong>${clean(offer.name)}</strong>
        <span>${clean(offer.area)}</span>
        <p>${clean(offer.details)}</p>
        <p><strong>Contact:</strong> ${clean(offer.contact)}</p>
      </article>
    `).join("");
  }

  function addOffer(){
    const offer = {
      name: document.getElementById("supportName")?.value.trim() || "Local supporter",
      contact: document.getElementById("supportContact")?.value.trim() || "Not provided",
      area: document.getElementById("supportArea")?.value.trim() || "Area not listed",
      type: document.getElementById("supportType")?.value || "Volunteer support",
      details: document.getElementById("supportDetails")?.value.trim() || "No details added."
    };
    offers.unshift(offer);
    localStorage.setItem("mfr-community-offers", JSON.stringify(offers.slice(0, 20)));
    renderOffers();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("communityAdviceBtn")?.addEventListener("click", renderAdvice);
    document.getElementById("communityIssueForm")?.addEventListener("reset", () => {
      const adviceBox = document.getElementById("communityAdvice");
      setTimeout(() => {
        if(adviceBox) adviceBox.innerHTML = "<h3>Advice will appear here</h3><p>Choose an issue type and describe what is happening. The page will suggest the first practical path.</p>";
      }, 0);
    });
    document.getElementById("communityResetBtn")?.addEventListener("click", () => {
      const adviceBox = document.getElementById("communityAdvice");
      setTimeout(() => {
        if(adviceBox) adviceBox.innerHTML = "<h3>Advice will appear here</h3><p>Choose an issue type and describe what is happening. The page will suggest the first practical path.</p>";
      }, 0);
    });
    document.getElementById("addSupportBtn")?.addEventListener("click", addOffer);
    renderOffers();
  });
})();
