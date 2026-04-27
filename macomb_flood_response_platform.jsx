import { useMemo, useState } from "react";

// Prototype data follows the same shape that real GIS/API data should use.
// In production, this object would be replaced by API responses from FEMA, NOAA/NWS,
// Macomb County GIS, USGS elevation data, NRCS soil data, sewer/stormwater systems,
// parcel data, and local emergency management feeds.
const neighborhoodData = {
  "Mount Clemens": {
    elevation: "Low",
    elevationFeet: 587,
    rainfall: 3.1,
    intensity: "High",
    soil: "Poor drainage",
    sewer: "Near capacity",
    waterways: "Clinton River nearby",
    impervious: "High",
    risk: "High",
    explanation:
      "This area has low elevation, nearby waterways, older drainage pressure, and high impervious surface coverage, which increases runoff and flood exposure.",
  },
  "Clinton Township": {
    elevation: "Moderate-low",
    elevationFeet: 604,
    rainfall: 2.7,
    intensity: "Medium-high",
    soil: "Mixed drainage",
    sewer: "Moderate pressure",
    waterways: "Local drains and creeks nearby",
    impervious: "Medium-high",
    risk: "Medium-high",
    explanation:
      "Flood risk is driven by mixed soil drainage, concentrated roads and rooftops, and storm drains that may struggle during fast rainfall bursts.",
  },
  Warren: {
    elevation: "Moderate",
    elevationFeet: 620,
    rainfall: 2.2,
    intensity: "Medium",
    soil: "Variable drainage",
    sewer: "Moderate",
    waterways: "Limited nearby waterways",
    impervious: "High",
    risk: "Medium",
    explanation:
      "The main issue is runoff from dense roads, rooftops, and parking lots. Flooding is more likely when rainfall intensity is fast.",
  },
};

const aidOptions = [
  "Electricity / heat / water",
  "Hotel fees",
  "Temporary housing",
  "Rent or mortgage support",
  "Daycare / childcare",
  "Food assistance",
  "Home repairs",
  "Mold remediation",
  "Transportation",
];

const coverageRules = {
  "External floodwater": "Likely flood insurance",
  "Sewer backup": "May require sewer backup endorsement or flood policy review",
  "Burst pipe": "Likely regular home insurance",
  "Roof leak from storm": "Likely regular home insurance",
  "Groundwater seepage": "Often limited or excluded unless flood policy applies",
};

const dataConnectors = [
  {
    label: "Elevation",
    source: "USGS / county LiDAR / DEM data",
    use: "Shows low points, slope, drainage bowls, and property elevation.",
  },
  {
    label: "Rainfall",
    source: "NOAA / National Weather Service / rain gauges",
    use: "Feeds current rainfall, storm totals, rainfall speed, and forecast risk.",
  },
  {
    label: "Flood zones",
    source: "FEMA NFHL / local floodplain maps",
    use: "Displays regulatory flood zones and known floodplain exposure.",
  },
  {
    label: "Soil drainage",
    source: "NRCS SSURGO soil survey",
    use: "Ranks how quickly land absorbs or holds water.",
  },
  {
    label: "Sewer capacity",
    source: "Macomb stormwater / municipal infrastructure data",
    use: "Compares rainfall load with storm sewer capacity and overflow risk.",
  },
  {
    label: "Waterways",
    source: "USGS hydrography / local drain commission layers",
    use: "Maps rivers, drains, creeks, retention basins, and overflow corridors.",
  },
  {
    label: "Impervious surfaces",
    source: "County land cover / parcel / road surface datasets",
    use: "Estimates runoff from roads, parking lots, rooftops, and concrete.",
  },
];

function normalizeAreaRecord(raw) {
  return {
    elevation: raw.elevation ?? "Unknown",
    elevationFeet: Number(raw.elevationFeet ?? 0),
    rainfall: Number(raw.rainfall ?? 0),
    intensity: raw.intensity ?? "Unknown",
    soil: raw.soil ?? "Unknown",
    sewer: raw.sewer ?? "Unknown",
    waterways: raw.waterways ?? "Unknown",
    impervious: raw.impervious ?? "Unknown",
    risk: raw.risk ?? "Unknown",
    explanation: raw.explanation ?? "Risk explanation will appear after GIS and weather data are connected.",
  };
}

const tabs = [
  ["map", "Flood Map"],
  ["data", "Data"],
  ["insurance", "Insurance"],
  ["claimbuilder", "Claim Builder"],
  ["aid", "Aid"],
  ["building", "Building"],
  ["housing", "Housing"],
  ["community", "Community"],
];

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Button({ children, onClick, variant = "primary", className = "", type = "button" }) {
  const styles =
    variant === "secondary"
      ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
      : "bg-blue-700 text-white hover:bg-blue-800";
  return (
    <button type={type} onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${styles} ${className}`}>
      {children}
    </button>
  );
}

export default function FloodSite() {
  const [activeTab, setActiveTab] = useState("map");
  const [area, setArea] = useState("Mount Clemens");
  const [address, setAddress] = useState("");
  const [activeLayer, setActiveLayer] = useState("Risk");
  const [damageCause, setDamageCause] = useState("External floodwater");
  const [structureType, setStructureType] = useState("Primary home");
  const [damageLocation, setDamageLocation] = useState("Basement");
  const [itemName, setItemName] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [receiptStatus, setReceiptStatus] = useState("Need receipt");
  const [uploadedEvidence, setUploadedEvidence] = useState([]);
  const [claimItems, setClaimItems] = useState([
    { name: "Washer", value: 650, location: "Basement", receipt: "Need receipt", coverage: "Flood policy / limited" },
    { name: "Drywall", value: 1200, location: "Interior wall", receipt: "Estimate needed", coverage: "Flood or home policy" },
  ]);
  const [selectedAid, setSelectedAid] = useState(["Hotel fees", "Food assistance"]);
  const [repairPriority, setRepairPriority] = useState("Mold remediation");
  const [paidAlready, setPaidAlready] = useState(0);
  const [reimbursementRate, setReimbursementRate] = useState(70);

  const selectedArea = normalizeAreaRecord(neighborhoodData[area] || {});

  const totalClaimValue = useMemo(
    () => claimItems.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [claimItems]
  );

  const estimatedReimbursement = useMemo(
    () => Math.round(totalClaimValue * (reimbursementRate / 100)),
    [totalClaimValue, reimbursementRate]
  );

  const remainingOutOfPocket = useMemo(
    () => Math.max(totalClaimValue - estimatedReimbursement, 0),
    [totalClaimValue, estimatedReimbursement]
  );

  const stillNeedToPay = useMemo(
    () => Math.max(totalClaimValue - paidAlready, 0),
    [totalClaimValue, paidAlready]
  );

  function addClaimItem() {
    if (!itemName.trim()) return;
    setClaimItems([
      ...claimItems,
      {
        name: itemName,
        value: Number(itemValue || 0),
        location: damageLocation,
        receipt: receiptStatus,
        coverage: coverageRules[damageCause],
      },
    ]);
    setItemName("");
    setItemValue("");
  }

  function removeClaimItem(index) {
    setClaimItems(claimItems.filter((_, i) => i !== index));
  }

  function updateClaimValue(index, value) {
    const next = [...claimItems];
    next[index] = { ...next[index], value: Number(value || 0) };
    setClaimItems(next);
  }

  function toggleAid(option) {
    setSelectedAid((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
    );
  }

  function handleEvidenceUpload(event) {
    const files = Array.from(event.target.files || []).map((file) => ({
      name: file.name,
      type: file.type || "unknown file",
      size: `${Math.round(file.size / 1024)} KB`,
    }));
    setUploadedEvidence((current) => [...current, ...files]);
  }

  function addEvidenceAsItem(file) {
    const guessedName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setClaimItems((current) => [
      ...current,
      {
        name: guessedName || "Evidence item",
        value: 0,
        location: damageLocation,
        receipt: "Needs price / receipt verification",
        coverage: coverageRules[damageCause],
      },
    ]);
  }

  function downloadClaimSummary() {
    const summary = {
      property: { address, area, structureType, damageCause },
      gisRisk: selectedArea,
      claimItems,
      totalClaimValue,
      uploadedEvidence,
      requestedAid: selectedAid,
      repairPriority,
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "macomb-flood-claim-summary.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function printPacket() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Civic flood recovery platform</p>
            <h1 className="text-4xl font-bold tracking-tight">Macomb Flood Response System</h1>
            <p className="max-w-3xl text-slate-600">
              A workable front-end demo for flood mapping, GIS risk explanation, insurance routing, claim documentation, aid matching, rebuilding support, and community recovery.
            </p>
          </div>

          <Card className="p-4">
            <h2 className="mb-3 text-lg font-semibold">Live Status</h2>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-green-100 p-3"><p className="font-medium">Status</p><p>Monitoring</p></div>
              <div className="rounded-xl bg-blue-100 p-3"><p className="font-medium">Rain</p><p>{selectedArea.rainfall} in</p></div>
              <div className="rounded-xl bg-yellow-100 p-3"><p className="font-medium">Risk</p><p>{selectedArea.risk}</p></div>
            </div>
          </Card>
        </section>

        <nav className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-2 shadow-sm md:grid-cols-8">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${activeTab === value ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "map" && (
          <section className="grid gap-4 lg:grid-cols-[.75fr_1.25fr_.9fr]">
            <Card className="p-4 space-y-4">
              <h2 className="text-xl font-semibold">GIS Risk Search</h2>
              <div>
                <label className="text-sm font-medium">Address</label>
                <input className="mt-1 w-full rounded-lg border p-2 text-sm" placeholder="Enter Macomb address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Area</label>
                <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={area} onChange={(e) => setArea(e.target.value)}>
                  {Object.keys(neighborhoodData).map((name) => <option key={name}>{name}</option>)}
                </select>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-sm">
                <p className="font-medium">Plain-language risk explanation</p>
                <p className="mt-1 text-slate-700">{selectedArea.explanation}</p>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">Interactive Map Demo</h2>
                <div className="flex flex-wrap gap-2">
                  {["Risk", "Elevation", "Rain", "Sewer", "Impervious"].map((layer) => (
                    <button key={layer} onClick={() => setActiveLayer(layer)} className={`rounded-full border px-3 py-1 text-xs ${activeLayer === layer ? "bg-blue-700 text-white" : "bg-white"}`}>{layer}</button>
                  ))}
                </div>
              </div>
              <div className="relative h-80 overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-100 via-slate-200 to-green-100">
                <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_30%_70%,rgba(59,130,246,.35),transparent_25%),radial-gradient(circle_at_65%_35%,rgba(14,165,233,.35),transparent_22%),radial-gradient(circle_at_55%_75%,rgba(239,68,68,.25),transparent_20%)]" />
                <div className={`absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl ${activeLayer === "Elevation" ? "bg-purple-500/70" : activeLayer === "Rain" ? "bg-blue-600/70" : activeLayer === "Sewer" ? "bg-orange-500/70" : activeLayer === "Impervious" ? "bg-slate-700/60" : "bg-red-500/70"}`} />
                <div className="absolute left-6 top-8 rounded-xl bg-white/90 p-3 text-sm shadow">
                  <p className="font-semibold">{area}</p>
                  <p>Layer: {activeLayer}</p>
                  <p>Risk: {selectedArea.risk}</p>
                  <p>Rainfall: {selectedArea.rainfall} in</p>
                </div>
                <div className="absolute bottom-5 right-5 rounded-xl bg-white/90 p-3 text-xs shadow">
                  <p className="font-semibold">Visible GIS Layers</p>
                  <p>● Elevation heatmap</p>
                  <p>● Rain intensity</p>
                  <p>● Drainage pressure</p>
                  <p>● Impervious surfaces</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <h2 className="text-xl font-semibold">GIS Factors</h2>
              <div className="space-y-2 text-sm">
                <p><b>Elevation:</b> {selectedArea.elevation} / {selectedArea.elevationFeet} ft</p>
                <p><b>Rain volume:</b> {selectedArea.rainfall} inches</p>
                <p><b>Rain intensity:</b> {selectedArea.intensity}</p>
                <p><b>Soil drainage:</b> {selectedArea.soil}</p>
                <p><b>Sewer capacity:</b> {selectedArea.sewer}</p>
                <p><b>Waterways:</b> {selectedArea.waterways}</p>
                <p><b>Impervious surfaces:</b> {selectedArea.impervious}</p>
              </div>
            </Card>
          </section>
        )}

        {activeTab === "data" && (
          <section className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
            <Card className="p-4 space-y-4">
              <h2 className="text-xl font-semibold">Actual Data Integration</h2>
              <p className="text-sm text-slate-600">
                The prototype is designed around a replaceable data model. Sample neighborhood values can be swapped for real GIS layers, API responses, CSV uploads, or database records without changing the user interface.
              </p>
              <div className="rounded-xl bg-blue-50 p-4 text-sm">
                <p className="font-medium">Production data flow</p>
                <p className="mt-1 text-slate-700">Address search → geocode coordinates → pull GIS layers → calculate factor scores → classify flood risk → explain the result in plain language.</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 text-sm">
                <p className="font-medium">Data format expected by the UI</p>
                <pre className="mt-2 overflow-auto rounded-lg bg-white p-3 text-xs">{`{
  elevation: "Low",
  elevationFeet: 587,
  rainfall: 3.1,
  intensity: "High",
  soil: "Poor drainage",
  sewer: "Near capacity",
  waterways: "Clinton River nearby",
  impervious: "High",
  risk: "High",
  explanation: "Plain-language reason..."
}`}</pre>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h2 className="text-xl font-semibold">Connectable Data Sources</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {dataConnectors.map((connector) => (
                  <div key={connector.label} className="rounded-xl border bg-white p-3 text-sm">
                    <p className="font-medium">{connector.label}</p>
                    <p className="mt-1 text-xs text-blue-700">{connector.source}</p>
                    <p className="mt-2 text-slate-600">{connector.use}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {activeTab === "insurance" && (
          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4 space-y-4">
              <h2 className="text-xl font-semibold">Coverage Classifier</h2>
              <p className="text-sm text-slate-600">Classify damage by cause, structure type, and location.</p>
              <select className="w-full rounded-lg border p-2" value={damageCause} onChange={(e) => setDamageCause(e.target.value)}>{Object.keys(coverageRules).map((cause) => <option key={cause}>{cause}</option>)}</select>
              <select className="w-full rounded-lg border p-2" value={structureType} onChange={(e) => setStructureType(e.target.value)}>{["Primary home", "Rental", "Condo", "Detached garage", "Basement", "Commercial structure"].map((type) => <option key={type}>{type}</option>)}</select>
              <select className="w-full rounded-lg border p-2" value={damageLocation} onChange={(e) => setDamageLocation(e.target.value)}>{["Basement", "Living room", "Kitchen", "Exterior", "Garage", "Utility room"].map((loc) => <option key={loc}>{loc}</option>)}</select>
              <div className="rounded-xl bg-amber-50 p-4"><p className="font-medium">Likely coverage path</p><p className="text-sm text-slate-700">{coverageRules[damageCause]}</p></div>
            </Card>
            <Card className="p-4 space-y-4">
              <h2 className="text-xl font-semibold">Policy Logic</h2>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-xl bg-slate-100 p-3"><p className="font-medium">Flood insurance</p><p>External rising water, floodwater entering from outside, foundation, essential systems, some contents.</p></div>
                <div className="rounded-xl bg-slate-100 p-3"><p className="font-medium">Regular insurance</p><p>Burst pipes, accidental internal leaks, wind or roof damage, theft, some storm-related interior damage.</p></div>
                <div className="rounded-xl bg-slate-100 p-3"><p className="font-medium">Structure matters</p><p>Basements, garages, rentals, condos, and commercial buildings can have different eligibility rules.</p></div>
                <div className="rounded-xl bg-slate-100 p-3"><p className="font-medium">Verification needed</p><p>The app flags uncertain items and asks the user to confirm before adding them to the claim packet.</p></div>
              </div>
            </Card>
          </section>
        )}

        {activeTab === "claimbuilder" && (
          <section className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
            <Card className="p-4 space-y-4">
              <h2 className="text-xl font-semibold">Evidence Upload + Verification</h2>
              <p className="text-sm text-slate-600">Upload photos, videos, receipts, or item lists. The demo turns uploaded filenames into reviewable claim items.</p>
              <input className="w-full rounded-lg border p-2 text-sm" type="file" multiple accept="image/*,video/*,.pdf,.csv,.txt" onChange={handleEvidenceUpload} />
              <div className="max-h-48 space-y-2 overflow-auto">
                {uploadedEvidence.length === 0 ? <p className="text-sm text-slate-500">No evidence uploaded yet.</p> : uploadedEvidence.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm">
                    <div><p className="font-medium">{file.name}</p><p className="text-slate-500">{file.type} • {file.size}</p></div>
                    <Button variant="secondary" onClick={() => addEvidenceAsItem(file)}>Add</Button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-medium">Manual / Verified Claim Item</h3>
                <input className="w-full rounded-lg border p-2" placeholder="Item name from photo/video" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                <input className="w-full rounded-lg border p-2" placeholder="Estimated price or receipt value" value={itemValue} onChange={(e) => setItemValue(e.target.value)} />
                <select className="w-full rounded-lg border p-2" value={receiptStatus} onChange={(e) => setReceiptStatus(e.target.value)}>{["Receipt attached", "Need receipt", "Estimate needed", "User-entered price"].map((status) => <option key={status}>{status}</option>)}</select>
                <Button onClick={addClaimItem}>Verify & Add Item</Button>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Claim Packet</h2><div className="flex gap-2"><Button onClick={downloadClaimSummary}>Download JSON</Button><Button variant="secondary" onClick={printPacket}>Print</Button></div></div>
              <div className="space-y-2">
                {claimItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="grid items-center gap-2 rounded-xl border bg-white p-3 text-sm md:grid-cols-[1fr_.7fr_.8fr_.3fr]">
                    <div><p className="font-medium">{item.name}</p><p className="text-slate-500">{item.location}</p></div>
                    <input className="rounded-lg border p-2" value={item.value} onChange={(e) => updateClaimValue(index, e.target.value)} />
                    <div><p>{item.coverage}</p><p className="text-slate-500">{item.receipt}</p></div>
                    <Button variant="secondary" onClick={() => removeClaimItem(index)}>Remove</Button>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="font-medium">Estimated claim value: ${totalClaimValue.toLocaleString()}</p>
                  <p className="text-sm text-slate-600">Output includes forms, evidence list, receipts, coverage path, and missing items checklist.</p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4 space-y-3">
                  <h3 className="font-medium">Cost & Reimbursement Estimator</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium">Already Paid Up Front ($)</label>
                      <input className="mt-1 w-full rounded-lg border p-2 text-sm" type="number" value={paidAlready} onChange={(e) => setPaidAlready(Number(e.target.value || 0))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Likely Reimbursement %</label>
                      <input className="mt-1 w-full" type="range" min="0" max="100" value={reimbursementRate} onChange={(e) => setReimbursementRate(Number(e.target.value))} />
                      <p className="text-xs text-slate-600">{reimbursementRate}%</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4 text-sm">
                    <div className="rounded-lg bg-white p-3 border">
                      <p className="font-medium">Paid Up Front</p>
                      <p>${paidAlready.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 border">
                      <p className="font-medium">Likely Reimbursed</p>
                      <p>${estimatedReimbursement.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 border">
                      <p className="font-medium">Still Need To Pay</p>
                      <p>${stillNeedToPay.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 border">
                      <p className="font-medium">Out of Pocket</p>
                      <p>${remainingOutOfPocket.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {activeTab === "aid" && (
          <Card className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Aid & Recovery Assistance</h2>
            <p className="text-sm text-slate-600">Select what your household needs. The app creates a recovery support checklist.</p>
            <div className="grid gap-3 md:grid-cols-3">
              {aidOptions.map((option) => (
                <button key={option} onClick={() => toggleAid(option)} className={`rounded-xl border p-4 text-left text-sm ${selectedAid.includes(option) ? "border-blue-300 bg-blue-100" : "bg-white"}`}><p className="font-medium">{option}</p><p className="mt-1 text-slate-500">{selectedAid.includes(option) ? "Added to recovery plan" : "Click to add"}</p></button>
              ))}
            </div>
            <div className="rounded-xl bg-blue-50 p-4"><p className="font-medium">Recovery plan</p><p className="text-sm text-slate-700">{selectedAid.length ? selectedAid.join(" • ") : "No assistance selected yet."}</p></div>
          </Card>
        )}

        {activeTab === "building" && (
          <Card className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Building, Repair & Floodproofing</h2>
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div className="rounded-xl bg-slate-100 p-4"><p className="font-medium">Immediate fixes</p><p>Water extraction, mold remediation, electrical safety, structural inspection.</p></div>
              <div className="rounded-xl bg-slate-100 p-4"><p className="font-medium">Rebuilding help</p><p>Permit guidance, contractor estimates, grants, repair documentation.</p></div>
              <div className="rounded-xl bg-slate-100 p-4"><p className="font-medium">Future protection</p><p>Backflow valves, sump pumps, grading, raised utilities, flood-resistant materials.</p></div>
            </div>
            <div className="rounded-xl bg-green-50 p-4"><p className="font-medium">Repair priority planner</p><div className="mt-3 flex flex-wrap gap-3"><select className="rounded-lg border p-2 text-sm" value={repairPriority} onChange={(e) => setRepairPriority(e.target.value)}>{["Mold remediation", "Water extraction", "Electrical safety", "Foundation inspection", "Sump pump installation", "Backflow valve", "Raised utilities", "Drainage grading"].map((item) => <option key={item}>{item}</option>)}</select><Button variant="secondary">Add to rebuild plan</Button></div><p className="mt-2 text-sm text-slate-700">Users upload photos of the structure, basement, drains, foundation, and yard. The system suggests floodproofing upgrades and flags code/policy weaknesses.</p></div>
          </Card>
        )}

        {activeTab === "housing" && (
          <Card className="p-4 space-y-4"><h2 className="text-xl font-semibold">Emergency Housing</h2><p className="text-sm text-slate-600">Find shelter, hotel options, temporary rental support, and relocation resources.</p><div className="grid gap-4 text-sm md:grid-cols-3"><div className="rounded-xl border bg-white p-4"><p className="font-medium">Shelters</p><p>Open shelters and community centers.</p></div><div className="rounded-xl border bg-white p-4"><p className="font-medium">Hotels</p><p>Hotel fee support and reimbursement tracking.</p></div><div className="rounded-xl border bg-white p-4"><p className="font-medium">Temporary housing</p><p>Rental help and family relocation support.</p></div></div></Card>
        )}

        {activeTab === "community" && (
          <Card className="p-4 space-y-4"><h2 className="text-xl font-semibold">Community Response</h2><div className="grid gap-4 text-sm md:grid-cols-3"><div className="rounded-xl border bg-white p-4"><p className="font-medium">Request help</p><p>Cleanup, transport, supplies, childcare, food delivery.</p></div><div className="rounded-xl border bg-white p-4"><p className="font-medium">Volunteer</p><p>Match skills and availability with local needs.</p></div><div className="rounded-xl border bg-white p-4"><p className="font-medium">Donate resources</p><p>List available tools, food, clothing, housing space, or supplies.</p></div></div></Card>
        )}

        <p className="pt-4 text-xs text-slate-500">Macomb Flood Response System • Functional front-end UX demo. Data shown is sample/synthetic for prototype purposes.</p>
      </div>
    </div>
  );
}
