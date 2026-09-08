import React, { useMemo, useState } from "react";
import { Search, ExternalLink, BookOpen, Loader2, Download } from "lucide-react";

const SOURCES = {
  archive: "Internet Archive",
  gallica: "Gallica / BnF",
  googleBooks: "Google Books",
  loc: "Library of Congress",
  pares: "PARES Espagne",
  cia: "CIA Reading Room",
  nara: "NARA",
  tna: "UK National Archives",
  portugal: "Archives portugaises / Digitarq",
  turkey: "Archives d'État de Turquie",
};

const SOURCE_COLORS = {
  archive: "#0f766e", gallica: "#9a3412", googleBooks: "#7c3aed", loc: "#1d4ed8",
  pares: "#b91c1c", cia: "#334155", nara: "#0f4c81", tna: "#111827",
  portugal: "#166534", turkey: "#92400e",
};

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

function normalizeArabic(value = "") {
  return String(value).replace(/[\u064B-\u065F\u0670]/g, "").replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
}

function normalize(value = "") {
  return normalizeArabic(String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    .replace(/[+،,;:()[\]{}"'’`!?./\\|_-]/g, " ").replace(/\s+/g, " ").trim();
}

function stemToken(token = "") {
  let value = normalize(token);
  if (/^[\u0600-\u06FF]+$/.test(value)) {
    if (value.startsWith("ال") && value.length > 4) value = value.slice(2);
    for (const suffix of ["يات", "يون", "يين", "ية", "يه", "يا", "ات", "ون", "ين"]) {
      if (value.endsWith(suffix) && value.length - suffix.length >= 4) { value = value.slice(0, -suffix.length); break; }
    }
  }
  return value;
}

function tokens(value = "") {
  return normalize(value).split(" ").map(stemToken).filter((token) => token.length > 1);
}

function parseStructuredQuery(input) {
  const parts = input.split("+").map((part) => part.trim()).filter(Boolean);
  return { titleHint: parts[0] || input.trim(), contextHint: parts.length > 1 ? parts.slice(1).join(" ") : "", structured: parts.length > 1 };
}

function tokenCoverage(haystack, needle) {
  const hay = tokens(haystack), wanted = tokens(needle);
  if (!hay.length || !wanted.length) return 0;
  let matched = 0;
  for (const target of wanted) {
    if (hay.some((candidate) => candidate === target || (candidate.length >= 4 && target.length >= 4 && (candidate.startsWith(target) || target.startsWith(candidate))))) matched += 1;
  }
  return matched / wanted.length;
}

function phraseScore(haystack, needle) {
  const h = normalize(haystack), n = normalize(needle);
  if (!h || !n) return 0;
  if (h === n) return 1;
  if (h.includes(n)) return 0.9;
  return tokenCoverage(h, n);
}

function detectLanguage(q) {
  if (/[\u0600-\u06FF]/.test(q)) return "ar";
  const n = normalize(q);
  if (/\b(le|la|les|du|des|livre|ouvrage|maroc|algerie|histoire|traite|colonial|francais)\b/.test(n)) return "fr";
  if (/\b(el|los|las|espana|espanol|archivo)\b/.test(n)) return "es";
  if (/\b(the|book|british|american|archive|history)\b/.test(n)) return "en";
  return "unknown";
}

function classifyIntent(query) {
  const n = normalize(query);
  const structured = parseStructuredQuery(query).structured;
  const bookWords = /(\blivre\b|\bbook\b|\bouvrage\b|\bauteur\b|\bauthor\b|كتاب|مؤلف|مصنف|عنوان)/;
  const archiveWords = /(archive|archives|archivo|document|dossier|correspondance|correspondence|telegram|telegraphe|rapport diplomatique|diplomatic report|foia|declassifie|declassified|memorandum|مراسلات|وثيقة|وثائق|ارشيف|أرشيف|تقرير|برقية)/;
  const manuscriptWords = /(manuscrit|manuscript|مخطوط|مخطوطة)/;
  const mapWords = /(carte|map|خريطة|خرائط)/;
  const explicitBook = bookWords.test(n) || manuscriptWords.test(n);
  const explicitArchive = archiveWords.test(n);

  if (explicitArchive && !explicitBook) return "archive";
  if (explicitBook || (structured && !explicitArchive)) return "book";
  if (mapWords.test(n)) return "mixed";
  return "topic";
}

function hasAny(n, terms) { return terms.some((term) => n.includes(term)); }

function routeSources(query) {
  const n = normalize(query);
  const intent = classifyIntent(query);
  const lang = detectLanguage(query);
  const sources = new Set();
  const reasons = [];

  const france = hasAny(n, ["france", "francais", "french", "protectorat", "protectorate", "colonial", "maroc colonial", "algerie francaise", "المغرب الفرنسي", "الحماية الفرنسية"]);
  const spain = hasAny(n, ["espagne", "spain", "spanish", "espanol", "ceuta", "melilla", "simancas", "pares", "andalus", "غرناطة", "الاندلس", "إسبانيا", "اسبانيا", "سبتة", "مليلية"]);
  const usa = hasAny(n, ["usa", "united states", "american", "americain", "cia", "nara", "foia", "declassified", "washington", "امريكا", "أمريكا", "الولايات المتحدة", "سي اي اي"]);
  const britain = hasAny(n, ["britain", "british", "england", "uk", "london", "royaume uni", "britannique", "بريطانيا", "انجلترا", "إنجلترا"]);
  const portugal = hasAny(n, ["portugal", "portugais", "portuguese", "lisbonne", "lisbon", "portugais", "البرتغال", "برتغالي"]);
  const turkey = hasAny(n, ["ottoman", "ottomane", "ottoman empire", "turkey", "turc", "turquie", "istanbul", "ottomans", "عثماني", "العثمان", "تركيا", "اسطنبول", "إسطنبول"]);

  if (intent === "book") {
    sources.add("archive");
    sources.add("googleBooks");
    if (lang === "fr" || lang === "ar" || france || n.includes("maroc") || n.includes("المغرب")) sources.add("gallica");
    if (lang === "en" || usa || britain) sources.add("loc");
    reasons.push("Recherche identifiée comme livre/ouvrage : priorité aux bibliothèques numériques, pas aux archives administratives.");
  } else if (intent === "archive") {
    if (france || lang === "fr") sources.add("gallica");
    if (spain) sources.add("pares");
    if (usa) { sources.add("cia"); sources.add("nara"); sources.add("loc"); }
    if (britain) sources.add("tna");
    if (portugal) sources.add("portugal");
    if (turkey) sources.add("turkey");
    if (sources.size === 0) { sources.add("gallica"); sources.add("loc"); }
    reasons.push("Recherche identifiée comme document/archives : sélection des archives liées au pays, à l'institution ou au contexte mentionné.");
  } else {
    sources.add("archive");
    sources.add("gallica");
    sources.add("googleBooks");
    if (lang === "en" || usa || britain) sources.add("loc");
    if (spain) sources.add("pares");
    if (usa) { sources.add("cia"); sources.add("nara"); }
    if (britain) sources.add("tna");
    if (portugal) sources.add("portugal");
    if (turkey) sources.add("turkey");
    reasons.push("Recherche thématique : bibliothèques d'abord, puis uniquement les archives géographiquement ou institutionnellement pertinentes.");
  }

  return { intent, lang, sources: Array.from(sources), reason: reasons.join(" ") };
}

function buildSearchPlans(input) {
  const { titleHint, contextHint, structured } = parseStructuredQuery(input);
  if (!structured) return [{ tier: "strict", titleHint, contextHint: "" }, { tier: "combined", titleHint, contextHint: "" }];
  return [
    { tier: "strict", titleHint, contextHint },
    { tier: "combined", titleHint, contextHint },
    { tier: "title", titleHint, contextHint },
    { tier: "context", titleHint, contextHint },
  ];
}

function annotate(items, tier) { return items.map((item) => ({ ...item, queryTier: tier })); }
function asText(value, fallback = "") { if (Array.isArray(value)) return value.filter(Boolean).join(", "); return value == null ? fallback : String(value); }
function escapeCql(value = "") { return String(value).replace(/"/g, " ").trim(); }

function scoreResult(item, originalQuery) {
  const { titleHint, contextHint, structured } = parseStructuredQuery(originalQuery);
  const titleTitle = phraseScore(item.title, titleHint);
  const titleElsewhere = Math.max(phraseScore(item.author, titleHint), phraseScore(item.description, titleHint));
  const contextAuthor = contextHint ? phraseScore(item.author, contextHint) : 0;
  const contextTitle = contextHint ? phraseScore(item.title, contextHint) : 0;
  const contextDescription = contextHint ? phraseScore(item.description, contextHint) : 0;
  const contextBest = Math.max(contextAuthor, contextTitle, contextDescription);
  let score = Math.round(titleTitle * 320) + Math.round(titleElsewhere * 70);
  if (structured) {
    if (titleTitle >= 0.5 && contextBest >= 0.5) score += 700;
    else if (titleTitle >= 0.5 && contextBest > 0) score += 390;
    else if (titleTitle >= 0.5) score += 130;
    else if (contextBest >= 0.5) score += 45;
    else score -= 220;
    score += Math.round(contextAuthor * 250) + Math.round(contextTitle * 120) + Math.round(contextDescription * 75);
  }
  score += ({ strict: 180, combined: 120, title: 25, context: 0 }[item.queryTier] || 0);
  if (item.digitized) score += 12;
  if (item.directPdf) score += 8;
  return score;
}

function archiveQuery(plan) {
  const t = String(plan.titleHint).replace(/["\\]/g, " ").trim();
  const c = String(plan.contextHint).replace(/["\\]/g, " ").trim();
  if (!c) return `title:("${t}") AND mediatype:texts`;
  if (plan.tier === "strict") return `title:("${t}") AND (creator:("${c}") OR subject:("${c}") OR description:("${c}")) AND mediatype:texts`;
  if (plan.tier === "combined") return `("${t}" AND "${c}") AND mediatype:texts`;
  if (plan.tier === "title") return `title:("${t}") AND mediatype:texts`;
  return `(creator:("${c}") OR subject:("${c}") OR description:("${c}")) AND mediatype:texts`;
}

async function searchArchive(plan) {
  try {
    const params = new URLSearchParams();
    params.set("q", archiveQuery(plan));
    ["identifier","title","creator","date","year","language","description","subject"].forEach((f)=>params.append("fl[]",f));
    params.set("rows", plan.tier === "strict" ? "20" : "12"); params.set("page","1"); params.set("output","json");
    const response = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`); if (!response.ok) return [];
    const docs = (await response.json())?.response?.docs || [];
    return annotate(docs.map((doc)=>({ id:`archive-${doc.identifier}`, source:"archive", title:asText(doc.title,"Titre non disponible"), author:asText(doc.creator,"Auteur non disponible"), date:asText(doc.date||doc.year,"Date non disponible"), language:asText(doc.language,"Langue non disponible"), description:stripHtml(asText(doc.description||doc.subject,"Document Internet Archive")), pageUrl:`https://archive.org/details/${doc.identifier}`, directPdf:"", digitized:true, access:"Livre / scan / fichiers disponibles", kind:"record" })), plan.tier);
  } catch { return []; }
}

function googleQuery(plan) {
  const t=plan.titleHint.trim(), c=plan.contextHint.trim(); if(!c) return `intitle:${t}`;
  if(plan.tier==="strict") return `intitle:${t} inauthor:${c}`; if(plan.tier==="combined") return `"${t}" "${c}"`; if(plan.tier==="title") return `intitle:${t}`; return `inauthor:${c}`;
}

async function searchGoogleBooks(plan) {
  try {
    const params=new URLSearchParams(); params.set("q",googleQuery(plan)); params.set("maxResults",plan.tier==="strict"?"20":"12"); params.set("printType","books");
    const response=await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`); if(!response.ok) return [];
    const items=(await response.json())?.items||[];
    return annotate(items.map((item)=>{ const info=item.volumeInfo||{}, access=item.accessInfo||{}; const directPdf=access.pdf?.downloadLink||""; return { id:`google-${item.id}`, source:"googleBooks", title:info.title||"Titre non disponible", author:asText(info.authors,"Auteur non disponible"), date:info.publishedDate||"Date non disponible", language:info.language||"Langue non disponible", description:stripHtml(info.description||"Notice Google Books"), pageUrl:access.webReaderLink||info.previewLink||info.infoLink||"", directPdf, digitized:Boolean(access.viewability&&access.viewability!=="NO_PAGES"), access:directPdf?"PDF disponible":access.viewability&&access.viewability!=="NO_PAGES"?"Aperçu / lecture en ligne":"Notice bibliographique", kind:"record" }; }),plan.tier);
  } catch { return []; }
}

function xmlValues(record, localName) { return Array.from(record.getElementsByTagNameNS("*",localName)).map((n)=>n.textContent||"").filter(Boolean); }
function parseGallicaXml(xmlText) {
  const xml=new DOMParser().parseFromString(xmlText,"text/xml");
  return Array.from(xml.getElementsByTagNameNS("*","record")).map((record,index)=>{ const titles=xmlValues(record,"title"), creators=xmlValues(record,"creator"), dates=xmlValues(record,"date"), languages=xmlValues(record,"language"), descriptions=xmlValues(record,"description"), subjects=xmlValues(record,"subject"), types=xmlValues(record,"type"), identifiers=xmlValues(record,"identifier"); const pageUrl=identifiers.find((v)=>v.includes("gallica.bnf.fr"))||""; return { id:`gallica-${index}-${pageUrl||titles[0]||"record"}`, source:"gallica", title:titles[0]||"Titre non disponible", author:creators.join(", ")||"Auteur non disponible", date:dates[0]||"Date non disponible", language:languages.join(", ")||"Langue non disponible", description:stripHtml([descriptions.join(" "),subjects.join(" "),types.join(", ")].filter(Boolean).join(" ")||"Document Gallica"), pageUrl, directPdf:"", digitized:Boolean(pageUrl), access:pageUrl?"Document / visionneuse Gallica":"Notice Gallica", kind:"record" }; });
}
function gallicaQuery(plan) { const t=escapeCql(plan.titleHint), c=escapeCql(plan.contextHint); if(!c) return `(dc.title all "${t}") or (gallica all "${t}")`; if(plan.tier==="strict") return `(dc.title all "${t}") and ((dc.creator all "${c}") or (dc.subject all "${c}") or (dc.description all "${c}"))`; if(plan.tier==="combined") return `(gallica all "${t}") and (gallica all "${c}")`; if(plan.tier==="title") return `(dc.title all "${t}") or (gallica all "${t}")`; return `(dc.creator all "${c}") or (dc.subject all "${c}") or (gallica all "${c}")`; }
async function searchGallica(plan) { try { const params=new URLSearchParams(); params.set("operation","searchRetrieve"); params.set("version","1.2"); params.set("query",gallicaQuery(plan)); params.set("maximumRecords",plan.tier==="strict"?"20":"12"); const r=await fetch(`https://gallica.bnf.fr/SRU?${params.toString()}`); if(!r.ok)return[]; return annotate(parseGallicaXml(await r.text()),plan.tier); } catch{return[];} }

function locQuery(plan){ const t=plan.titleHint.trim(), c=plan.contextHint.trim(); if(!c)return `"${t}"`; if(plan.tier==="strict"||plan.tier==="combined")return `"${t}" "${c}"`; if(plan.tier==="title")return `"${t}"`; return `"${c}"`; }
async function searchLibraryOfCongress(plan){ try{ const p=new URLSearchParams(); p.set("q",locQuery(plan)); p.set("fo","json"); p.set("c",plan.tier==="strict"?"20":"12"); p.set("at","results,pagination"); const r=await fetch(`https://www.loc.gov/search/?${p.toString()}`); if(!r.ok)return[]; const data=await r.json(); return annotate((data?.results||[]).map((item,index)=>{ const contributors=item.contributor||item.contributors||item.creator||item.created_published; const formats=asText(item.online_format||item.original_format||item.format); return { id:`loc-${item.id||index}`, source:"loc", title:item.title||"Titre non disponible", author:asText(contributors,"Auteur / institution non disponible"), date:asText(item.date||item.dates,"Date non disponible"), language:asText(item.language,"Langue non disponible"), description:stripHtml(asText(item.description||item.subject||formats,"Collection Library of Congress")), pageUrl:item.id||item.url||"", directPdf:"", digitized:Boolean(item.id), access:formats?`En ligne : ${formats}`:"Notice / document en ligne", kind:"record" }; }),plan.tier); }catch{return[];} }

function externalPortalResults(keyword, allowedSources) {
  const q=encodeURIComponent(keyword);
  const portals=[
    {source:"pares",title:`Rechercher « ${keyword} » dans PARES (Espagne)`,author:"Ministerio de Cultura – Archivos Estatales",pageUrl:"https://pares.cultura.gob.es/pares/es/inicio.html",description:"Archives d'État espagnoles : Simancas, Archivo Histórico Nacional, Corona de Aragón et autres fonds."},
    {source:"cia",title:`Rechercher « ${keyword} » dans CIA Reading Room`,author:"Central Intelligence Agency",pageUrl:`https://www.cia.gov/readingroom/search/site/${q}`,description:"Documents déclassifiés et collections FOIA de la CIA."},
    {source:"nara",title:`Rechercher « ${keyword} » dans NARA`,author:"U.S. National Archives",pageUrl:`https://catalog.archives.gov/search?q=${q}`,description:"Archives nationales des États-Unis."},
    {source:"tna",title:`Rechercher « ${keyword} » dans UK National Archives`,author:"The National Archives – UK",pageUrl:`https://discovery.nationalarchives.gov.uk/results/r?_q=${q}`,description:"Archives diplomatiques, coloniales, militaires et administratives britanniques."},
    {source:"portugal",title:`Rechercher « ${keyword} » dans les archives portugaises`,author:"Torre do Tombo / Digitarq",pageUrl:"https://digitarq.arquivos.pt/",description:"Portail des archives portugaises."},
    {source:"turkey",title:`Rechercher « ${keyword} » dans les archives d'État turques`,author:"Devlet Arşivleri Başkanlığı",pageUrl:"https://www.devletarsivleri.gov.tr/",description:"Archives d'État de Turquie, notamment les fonds ottomans."},
  ];
  return portals.filter((p)=>allowedSources.includes(p.source)).map((p)=>({id:`${p.source}-portal-${keyword}`,...p,date:"Catalogue d'archives",language:"Multilingue",directPdf:"",digitized:false,access:"Ouvrir le portail de recherche",kind:"portal",queryTier:"context"}));
}

function dedupeResults(results){ const best=new Map(); for(const item of results){ const key=normalize(`${item.source}|${item.title}|${item.author}`); if(!key)continue; const old=best.get(key); if(!old||(item.queryTier==="strict"&&old.queryTier!=="strict"))best.set(key,item); } return Array.from(best.values()); }

function ResultItem({item}){ const sourceColor=SOURCE_COLORS[item.source]||"#334155"; return <article className="result-item"><div className="result-main"><a className="title" href={item.pageUrl} target="_blank" rel="noreferrer">{item.title}</a><div className="meta">{item.author} — {item.date} — {item.language}</div>{item.description&&<p className="description">{item.description.slice(0,300)}{item.description.length>300?"…":""}</p>}<div className="actions"><span className="source" style={{color:sourceColor}}>{SOURCES[item.source]||item.source}</span><span className="access">{item.access}</span>{item.queryTier==="strict"&&item.kind!=="portal"&&<span className="match-chip">Correspondance forte</span>}{item.directPdf&&<a className="pdf-btn" href={item.directPdf} target="_blank" rel="noreferrer"><Download size={14}/> PDF</a>}{item.pageUrl&&<a href={item.pageUrl} target="_blank" rel="noreferrer">Ouvrir <ExternalLink size={13}/></a>}</div></div><div className={`badge ${item.kind==="portal"?"portal":""}`}>{item.kind==="portal"?"ARCHIVES":item.directPdf?"PDF":item.digitized?"EN LIGNE":"NOTICE"}</div></article>; }

export default function AppSmart(){
  const [keyword,setKeyword]=useState(""); const [results,setResults]=useState([]); const [loading,setLoading]=useState(false); const [sourceFilter,setSourceFilter]=useState("all"); const [accessFilter,setAccessFilter]=useState("all"); const [searched,setSearched]=useState(false); const [routing,setRouting]=useState(null);
  const filtered=useMemo(()=>results.filter((item)=>{ if(sourceFilter!=="all"&&item.source!==sourceFilter)return false; if(accessFilter==="digitized"&&!item.digitized)return false; if(accessFilter==="pdf"&&!item.directPdf)return false; return true;}),[results,sourceFilter,accessFilter]);

  async function runSearch(event){ event.preventDefault(); const clean=keyword.trim(); if(!clean)return; setLoading(true); setSearched(true); setResults([]); setSourceFilter("all"); const route=routeSources(clean); setRouting(route); const plans=buildSearchPlans(clean);
    try{
      const liveKeys=route.sources.filter((s)=>["archive","gallica","googleBooks","loc"].includes(s));
      const liveBatches=await Promise.all(plans.map(async(plan)=>{ const jobs=[]; if(liveKeys.includes("archive"))jobs.push(searchArchive(plan)); if(liveKeys.includes("gallica"))jobs.push(searchGallica(plan)); if(liveKeys.includes("googleBooks"))jobs.push(searchGoogleBooks(plan)); if(liveKeys.includes("loc"))jobs.push(searchLibraryOfCongress(plan)); const batches=await Promise.all(jobs); return batches.flat(); }));
      const portals=externalPortalResults(clean,route.sources);
      const merged=dedupeResults([...liveBatches.flat(),...portals]).map((item)=>({...item,relevance:scoreResult(item,clean)})).filter((item)=>item.kind==="portal"||item.relevance>-100).sort((a,b)=>b.relevance-a.relevance);
      setResults(merged);
    } finally { setLoading(false); }
  }

  const activeSourceKeys=routing?.sources||["archive","gallica","googleBooks","loc"];
  return <div className="page" dir="ltr" lang="fr"><style>{`
    *{box-sizing:border-box} body{margin:0;font-family:Inter,Arial,sans-serif;background:#f7f5ef;color:#172033}.page{min-height:100vh}.topbar{background:linear-gradient(135deg,#0f766e,#115e59 48%,#7f1d1d);color:white}.top-inner{max-width:1180px;margin:0 auto;padding:30px 28px 24px}.brand{display:flex;align-items:center;gap:12px;font-size:34px;font-weight:800}.brand strong{color:#f6c744}.subtitle{margin:8px 0 22px;color:#efffd0}.search-form{display:flex;max-width:900px;border:2px solid #e6b735;background:white}.search-form input{flex:1;border:0;outline:none;padding:14px 16px;font-size:17px;min-width:0}.search-form button{width:62px;border:0;background:#e9b63b;cursor:pointer;display:grid;place-items:center}.layout{max-width:1180px;margin:0 auto;padding:26px 28px;display:grid;grid-template-columns:230px 1fr;gap:28px}aside{border-right:1px solid #ddd3c5;padding-right:22px}aside h3{margin:0 0 12px;color:#7f1d1d;font-size:15px}.filter-btn{display:block;width:100%;text-align:left;border:0;background:transparent;padding:7px 0;cursor:pointer;color:#1f2937}.filter-btn.active{font-weight:800;color:#0f766e}.filter-group{padding-bottom:18px;margin-bottom:18px;border-bottom:1px solid #ddd3c5}.results-title{margin:0;color:#366d6a;font-size:27px}.count{margin:5px 0 8px;color:#8a563d;font-size:14px}.routing{margin:0 0 18px;padding:11px 13px;background:#eef6f0;border-left:3px solid #0f766e;color:#315f55;font-size:13px;line-height:1.45}.result-item{display:flex;justify-content:space-between;gap:18px;padding:20px 0;border-top:1px solid #ded6c9}.result-main{min-width:0}.title{color:#145ea8;font-size:19px;font-weight:700;text-decoration:none}.title:hover{text-decoration:underline}.meta{margin-top:5px;color:#6b7280;font-size:13px}.description{margin:9px 0;line-height:1.48;color:#4b5563}.actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-size:13px}.actions a{color:#145ea8;text-decoration:none;display:inline-flex;gap:4px;align-items:center}.source{font-weight:800}.access{color:#365314}.match-chip{background:#fff4ce;color:#795400;padding:2px 6px;border-radius:10px;font-weight:700}.badge{flex:0 0 auto;height:28px;padding:6px 9px;border-radius:4px;background:#e6f4ea;color:#166534;font-size:11px;font-weight:800}.badge.portal{background:#e5e7eb;color:#374151}.empty{padding:40px 0;color:#6b7280;font-size:18px}.loading{display:flex;gap:9px;align-items:center;padding:35px 0;color:#0f766e}@media(max-width:800px){.layout{grid-template-columns:1fr;padding:18px}aside{border-right:0;border-bottom:1px solid #ddd3c5;padding:0 0 16px}.top-inner{padding:22px 18px}.brand{font-size:28px}.result-item{flex-direction:column}}
  `}</style><header className="topbar"><div className="top-inner"><div className="brand"><BookOpen size={34}/> Historio <strong>Sources</strong></div><div className="subtitle">Le moteur choisit automatiquement les bibliothèques et archives pertinentes selon votre recherche.</div><form className="search-form" onSubmit={runSearch}><input value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="Ex. الجغرافيا + الزهري, livre sur le Maroc colonial, correspondance diplomatique Espagne Maroc..."/><button type="submit" aria-label="Rechercher">{loading?<Loader2 size={24}/>:<Search size={25}/>}</button></form></div></header><main className="layout"><aside><div className="filter-group"><h3>Sources pertinentes</h3><button className={`filter-btn ${sourceFilter==="all"?"active":""}`} onClick={()=>setSourceFilter("all")}>Toutes les sources sélectionnées</button>{activeSourceKeys.map((key)=><button key={key} className={`filter-btn ${sourceFilter===key?"active":""}`} onClick={()=>setSourceFilter(key)}>{SOURCES[key]}</button>)}</div><div className="filter-group"><h3>Accès</h3><button className={`filter-btn ${accessFilter==="all"?"active":""}`} onClick={()=>setAccessFilter("all")}>Tous les documents</button><button className={`filter-btn ${accessFilter==="digitized"?"active":""}`} onClick={()=>setAccessFilter("digitized")}>Numérisés uniquement</button><button className={`filter-btn ${accessFilter==="pdf"?"active":""}`} onClick={()=>setAccessFilter("pdf")}>PDF uniquement</button></div></aside><section><h1 className="results-title">Sources historiques</h1>{searched&&!loading&&<><div className="count">{filtered.length} résultat(s) affiché(s) sur {results.length} référence(s)</div>{routing&&<div className="routing"><strong>Recherche adaptée :</strong> {routing.reason}<br/><strong>Sources choisies :</strong> {routing.sources.map((s)=>SOURCES[s]).join(" · ")}</div>}</>}{loading&&<div className="loading"><Loader2 size={20}/> Analyse de la requête puis recherche dans les sources pertinentes…</div>}{!loading&&!searched&&<div className="empty">Lancez une recherche : le moteur déterminera d'abord où il est pertinent de chercher.</div>}{!loading&&searched&&filtered.length===0&&<div className="empty">Aucun résultat pertinent trouvé dans les sources sélectionnées pour cette requête.</div>}{!loading&&filtered.map((item)=><ResultItem key={item.id} item={item}/>)}</section></main></div>;
}
