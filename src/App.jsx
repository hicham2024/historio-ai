import React, { useMemo, useState } from "react";
import {
  Search,
  ExternalLink,
  BookOpen,
  Loader2,
  Download,
} from "lucide-react";

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
  archive: "#0f766e",
  gallica: "#9a3412",
  googleBooks: "#7c3aed",
  loc: "#1d4ed8",
  pares: "#b91c1c",
  cia: "#334155",
  nara: "#0f4c81",
  tna: "#111827",
  portugal: "#166534",
  turkey: "#92400e",
};

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArabic(value = "") {
  return String(value)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

function normalize(value = "") {
  return normalizeArabic(
    String(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  )
    .replace(/[+،,;:()[\]{}"'’`!?./\\|_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemToken(token = "") {
  let value = normalize(token);
  if (/^[\u0600-\u06FF]+$/.test(value)) {
    if (value.startsWith("ال") && value.length > 4) value = value.slice(2);
    for (const suffix of ["يات", "يون", "يين", "ية", "يه", "يا", "ات", "ون", "ين"]) {
      if (value.endsWith(suffix) && value.length - suffix.length >= 4) {
        value = value.slice(0, -suffix.length);
        break;
      }
    }
  }
  return value;
}

function tokens(value = "") {
  return normalize(value)
    .split(" ")
    .map(stemToken)
    .filter((token) => token.length > 1);
}

function parseStructuredQuery(input) {
  const parts = input
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    titleHint: parts[0] || input.trim(),
    contextHint: parts.length > 1 ? parts.slice(1).join(" ") : "",
    structured: parts.length > 1,
  };
}

function tokenCoverage(haystack, needle) {
  const hay = tokens(haystack);
  const wanted = tokens(needle);
  if (!hay.length || !wanted.length) return 0;

  let matched = 0;
  for (const target of wanted) {
    const found = hay.some(
      (candidate) =>
        candidate === target ||
        (candidate.length >= 4 && target.length >= 4 &&
          (candidate.startsWith(target) || target.startsWith(candidate)))
    );
    if (found) matched += 1;
  }

  return matched / wanted.length;
}

function phraseScore(haystack, needle) {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!h || !n) return 0;
  if (h === n) return 1;
  if (h.includes(n)) return 0.9;
  return tokenCoverage(h, n);
}

function annotate(items, tier, queryUsed) {
  return items.map((item) => ({ ...item, queryTier: tier, queryUsed }));
}

function scoreResult(item, originalQuery) {
  const { titleHint, contextHint, structured } = parseStructuredQuery(originalQuery);

  const titleTitle = phraseScore(item.title, titleHint);
  const titleElsewhere = Math.max(
    phraseScore(item.author, titleHint),
    phraseScore(item.description, titleHint)
  );

  const contextAuthor = contextHint ? phraseScore(item.author, contextHint) : 0;
  const contextTitle = contextHint ? phraseScore(item.title, contextHint) : 0;
  const contextDescription = contextHint ? phraseScore(item.description, contextHint) : 0;
  const contextBest = Math.max(contextAuthor, contextTitle, contextDescription);

  let score = 0;

  // Le titre ou sujet principal reste le signal dominant, comme dans un moteur académique.
  score += Math.round(titleTitle * 320);
  score += Math.round(titleElsewhere * 70);

  if (structured) {
    // A + B : les résultats qui satisfont les DEUX indices passent toujours devant.
    if (titleTitle >= 0.5 && contextBest >= 0.5) {
      score += 700;
    } else if (titleTitle >= 0.5 && contextBest > 0) {
      score += 390;
    } else if (titleTitle >= 0.5) {
      score += 130;
    } else if (contextBest >= 0.5) {
      score += 45;
    } else {
      score -= 220;
    }

    // Un auteur/créateur correspondant est plus fort qu'une simple mention dans la description.
    score += Math.round(contextAuthor * 250);
    score += Math.round(contextTitle * 120);
    score += Math.round(contextDescription * 75);
  }

  const tierBonus = { strict: 180, combined: 120, title: 25, context: 0 };
  score += tierBonus[item.queryTier] || 0;

  if (item.digitized) score += 12;
  if (item.directPdf) score += 8;
  if (["archive", "gallica", "loc"].includes(item.source)) score += 8;
  if (item.kind === "portal") score -= 60;

  return score;
}

function asText(value, fallback = "") {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function escapeArchive(value = "") {
  return String(value).replace(/["\\]/g, " ").trim();
}

function escapeCql(value = "") {
  return String(value).replace(/"/g, " ").trim();
}

function buildSearchPlans(input) {
  const { titleHint, contextHint, structured } = parseStructuredQuery(input);

  if (!structured) {
    return [
      { tier: "strict", titleHint, contextHint: "" },
      { tier: "combined", titleHint, contextHint: "" },
    ];
  }

  return [
    { tier: "strict", titleHint, contextHint },
    { tier: "combined", titleHint, contextHint },
    { tier: "title", titleHint, contextHint },
    { tier: "context", titleHint, contextHint },
  ];
}

function archiveQuery(plan) {
  const t = escapeArchive(plan.titleHint);
  const c = escapeArchive(plan.contextHint);

  if (!c) return `title:("${t}") AND mediatype:texts`;
  if (plan.tier === "strict") {
    return `title:("${t}") AND (creator:("${c}") OR subject:("${c}") OR description:("${c}")) AND mediatype:texts`;
  }
  if (plan.tier === "combined") return `("${t}" AND "${c}") AND mediatype:texts`;
  if (plan.tier === "title") return `title:("${t}") AND mediatype:texts`;
  return `(creator:("${c}") OR subject:("${c}") OR description:("${c}")) AND mediatype:texts`;
}

async function searchArchive(plan) {
  try {
    const params = new URLSearchParams();
    params.set("q", archiveQuery(plan));
    ["identifier", "title", "creator", "date", "year", "language", "description", "subject"].forEach(
      (field) => params.append("fl[]", field)
    );
    params.set("rows", plan.tier === "strict" ? "20" : "12");
    params.set("page", "1");
    params.set("output", "json");

    const response = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    const docs = data?.response?.docs || [];

    return annotate(
      docs.map((doc) => ({
        id: `archive-${doc.identifier}`,
        source: "archive",
        title: asText(doc.title, "Titre non disponible"),
        author: asText(doc.creator, "Auteur non disponible"),
        date: asText(doc.date || doc.year, "Date non disponible"),
        language: asText(doc.language, "Langue non disponible"),
        description: stripHtml(asText(doc.description || doc.subject, "Document numérisé sur Internet Archive")),
        pageUrl: `https://archive.org/details/${doc.identifier}`,
        directPdf: "",
        digitized: true,
        access: "Livre / scan / fichiers disponibles",
        kind: "record",
      })),
      plan.tier,
      archiveQuery(plan)
    );
  } catch {
    return [];
  }
}

function googleQuery(plan) {
  const t = plan.titleHint.trim();
  const c = plan.contextHint.trim();
  if (!c) return `intitle:${t}`;
  if (plan.tier === "strict") return `intitle:${t} inauthor:${c}`;
  if (plan.tier === "combined") return `"${t}" "${c}"`;
  if (plan.tier === "title") return `intitle:${t}`;
  return `inauthor:${c}`;
}

async function searchGoogleBooks(plan) {
  try {
    const params = new URLSearchParams();
    params.set("q", googleQuery(plan));
    params.set("maxResults", plan.tier === "strict" ? "20" : "12");
    params.set("printType", "books");

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    return annotate(
      (data?.items || []).map((item) => {
        const info = item.volumeInfo || {};
        const access = item.accessInfo || {};
        const directPdf = access.pdf?.downloadLink || "";
        const pageUrl = access.webReaderLink || info.previewLink || info.infoLink || "";

        return {
          id: `google-${item.id}`,
          source: "googleBooks",
          title: info.title || "Titre non disponible",
          author: asText(info.authors, "Auteur non disponible"),
          date: info.publishedDate || "Date non disponible",
          language: info.language || "Langue non disponible",
          description: stripHtml(info.description || "Notice Google Books"),
          pageUrl,
          directPdf,
          digitized: access.viewability && access.viewability !== "NO_PAGES",
          access: directPdf
            ? "PDF disponible"
            : access.viewability && access.viewability !== "NO_PAGES"
            ? "Aperçu / lecture en ligne"
            : "Notice bibliographique",
          kind: "record",
        };
      }),
      plan.tier,
      googleQuery(plan)
    );
  } catch {
    return [];
  }
}

function xmlValues(record, localName) {
  return Array.from(record.getElementsByTagNameNS("*", localName))
    .map((node) => node.textContent || "")
    .filter(Boolean);
}

function parseGallicaXml(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const records = Array.from(xml.getElementsByTagNameNS("*", "record"));

  return records.map((record, index) => {
    const titles = xmlValues(record, "title");
    const creators = xmlValues(record, "creator");
    const dates = xmlValues(record, "date");
    const languages = xmlValues(record, "language");
    const descriptions = xmlValues(record, "description");
    const subjects = xmlValues(record, "subject");
    const types = xmlValues(record, "type");
    const identifiers = xmlValues(record, "identifier");

    const pageUrl = identifiers.find((value) => value.includes("gallica.bnf.fr")) || "";

    return {
      id: `gallica-${index}-${pageUrl || titles[0] || "record"}`,
      source: "gallica",
      title: titles[0] || "Titre non disponible",
      author: creators.join(", ") || "Auteur non disponible",
      date: dates[0] || "Date non disponible",
      language: languages.join(", ") || "Langue non disponible",
      description: stripHtml(
        [descriptions.join(" "), subjects.join(" "), types.join(", ")].filter(Boolean).join(" ") || "Document Gallica"
      ),
      pageUrl,
      directPdf: "",
      digitized: Boolean(pageUrl),
      access: pageUrl ? "Document / visionneuse Gallica" : "Notice Gallica",
      kind: "record",
    };
  });
}

function gallicaQuery(plan) {
  const t = escapeCql(plan.titleHint);
  const c = escapeCql(plan.contextHint);
  if (!c) return `(dc.title all "${t}") or (gallica all "${t}")`;
  if (plan.tier === "strict") {
    return `(dc.title all "${t}") and ((dc.creator all "${c}") or (dc.subject all "${c}") or (dc.description all "${c}"))`;
  }
  if (plan.tier === "combined") return `(gallica all "${t}") and (gallica all "${c}")`;
  if (plan.tier === "title") return `(dc.title all "${t}") or (gallica all "${t}")`;
  return `(dc.creator all "${c}") or (dc.subject all "${c}") or (gallica all "${c}")`;
}

async function searchGallica(plan) {
  try {
    const params = new URLSearchParams();
    params.set("operation", "searchRetrieve");
    params.set("version", "1.2");
    params.set("query", gallicaQuery(plan));
    params.set("maximumRecords", plan.tier === "strict" ? "20" : "12");

    const response = await fetch(`https://gallica.bnf.fr/SRU?${params.toString()}`);
    if (!response.ok) return [];
    return annotate(parseGallicaXml(await response.text()), plan.tier, gallicaQuery(plan));
  } catch {
    return [];
  }
}

function locQuery(plan) {
  const t = plan.titleHint.trim();
  const c = plan.contextHint.trim();
  if (!c) return `"${t}"`;
  if (plan.tier === "strict" || plan.tier === "combined") return `"${t}" "${c}"`;
  if (plan.tier === "title") return `"${t}"`;
  return `"${c}"`;
}

async function searchLibraryOfCongress(plan) {
  try {
    const params = new URLSearchParams();
    params.set("q", locQuery(plan));
    params.set("fo", "json");
    params.set("c", plan.tier === "strict" ? "20" : "12");
    params.set("at", "results,pagination");

    const response = await fetch(`https://www.loc.gov/search/?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();

    return annotate(
      (data?.results || []).map((item, index) => {
        const contributors = item.contributor || item.contributors || item.creator || item.created_published;
        const formats = asText(item.online_format || item.original_format || item.format);

        return {
          id: `loc-${item.id || index}`,
          source: "loc",
          title: item.title || "Titre non disponible",
          author: asText(contributors, "Auteur / institution non disponible"),
          date: asText(item.date || item.dates, "Date non disponible"),
          language: asText(item.language, "Langue non disponible"),
          description: stripHtml(asText(item.description || item.subject || formats, "Collection Library of Congress")),
          pageUrl: item.id || item.url || "",
          directPdf: "",
          digitized: Boolean(item.id),
          access: formats ? `En ligne : ${formats}` : "Notice / document en ligne",
          kind: "record",
        };
      }),
      plan.tier,
      locQuery(plan)
    );
  } catch {
    return [];
  }
}

function externalPortalResults(keyword) {
  const q = encodeURIComponent(keyword);
  const portals = [
    {
      source: "pares",
      title: `Rechercher « ${keyword} » dans PARES (Espagne)`,
      author: "Ministerio de Cultura – Archivos Estatales",
      pageUrl: "https://pares.cultura.gob.es/pares/es/inicio.html",
      description: "Catalogue officiel des archives espagnoles : Archivo General de Simancas, Archivo Histórico Nacional, Archivo de la Corona de Aragón et autres fonds.",
    },
    {
      source: "cia",
      title: `Rechercher « ${keyword} » dans CIA Reading Room`,
      author: "Central Intelligence Agency",
      pageUrl: `https://www.cia.gov/readingroom/search/site/${q}`,
      description: "Documents déclassifiés et collections FOIA de la CIA.",
    },
    {
      source: "nara",
      title: `Rechercher « ${keyword} » dans NARA`,
      author: "U.S. National Archives and Records Administration",
      pageUrl: `https://catalog.archives.gov/search?q=${q}`,
      description: "Catalogue des Archives nationales des États-Unis, documents numérisés et notices.",
    },
    {
      source: "tna",
      title: `Rechercher « ${keyword} » dans UK National Archives`,
      author: "The National Archives – United Kingdom",
      pageUrl: `https://discovery.nationalarchives.gov.uk/results/r?_q=${q}`,
      description: "Discovery : archives diplomatiques, coloniales, militaires et administratives britanniques.",
    },
    {
      source: "portugal",
      title: `Rechercher « ${keyword} » dans les archives portugaises`,
      author: "Arquivo Nacional da Torre do Tombo / Digitarq",
      pageUrl: "https://digitarq.arquivos.pt/",
      description: "Portail Digitarq des archives portugaises et de la Torre do Tombo.",
    },
    {
      source: "turkey",
      title: `Rechercher « ${keyword} » dans les archives d'État turques`,
      author: "T.C. Cumhurbaşkanlığı Devlet Arşivleri Başkanlığı",
      pageUrl: "https://www.devletarsivleri.gov.tr/",
      description: "Portail officiel des Archives d'État de Turquie, notamment les fonds ottomans.",
    },
  ];

  return portals.map((portal) => ({
    id: `${portal.source}-portal-${keyword}`,
    ...portal,
    date: "Catalogue d'archives",
    language: "Multilingue",
    directPdf: "",
    digitized: false,
    access: "Ouvrir le portail de recherche",
    kind: "portal",
    queryTier: "context",
  }));
}

function dedupeResults(results) {
  const best = new Map();

  for (const item of results) {
    const key = normalize(`${item.source}|${item.title}|${item.author}`);
    if (!key) continue;

    const existing = best.get(key);
    if (!existing || (item.queryTier === "strict" && existing.queryTier !== "strict")) {
      best.set(key, item);
    }
  }

  return Array.from(best.values());
}

function ResultItem({ item }) {
  const sourceColor = SOURCE_COLORS[item.source] || "#334155";
  return (
    <article className="result-item">
      <div className="result-main">
        <a className="title" href={item.pageUrl} target="_blank" rel="noreferrer">
          {item.title}
        </a>
        <div className="meta">
          {item.author} — {item.date} — {item.language}
        </div>
        {item.description && (
          <p className="description">
            {item.description.slice(0, 300)}
            {item.description.length > 300 ? "…" : ""}
          </p>
        )}
        <div className="actions">
          <span className="source" style={{ color: sourceColor }}>{SOURCES[item.source] || item.source}</span>
          <span className="access">{item.access}</span>
          {item.queryTier === "strict" && item.kind !== "portal" && <span className="match-chip">Correspondance forte</span>}
          {item.directPdf && (
            <a className="pdf-btn" href={item.directPdf} target="_blank" rel="noreferrer">
              <Download size={14} /> PDF
            </a>
          )}
          {item.pageUrl && (
            <a href={item.pageUrl} target="_blank" rel="noreferrer">
              Ouvrir <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
      <div className={`badge ${item.kind === "portal" ? "portal" : ""}`}>
        {item.kind === "portal" ? "ARCHIVES" : item.directPdf ? "PDF" : item.digitized ? "EN LIGNE" : "NOTICE"}
      </div>
    </article>
  );
}

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const filtered = useMemo(() => {
    return results.filter((item) => {
      if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
      if (accessFilter === "digitized" && !item.digitized) return false;
      if (accessFilter === "pdf" && !item.directPdf) return false;
      return true;
    });
  }, [results, sourceFilter, accessFilter]);

  async function runSearch(event) {
    event.preventDefault();
    const clean = keyword.trim();
    if (!clean) return;

    setLoading(true);
    setSearched(true);
    setLastQuery(clean);
    setResults([]);

    const plans = buildSearchPlans(clean);

    try {
      const liveBatches = await Promise.all(
        plans.map(async (plan) => {
          const [archive, gallica, googleBooks, loc] = await Promise.all([
            searchArchive(plan),
            searchGallica(plan),
            searchGoogleBooks(plan),
            searchLibraryOfCongress(plan),
          ]);
          return [...archive, ...gallica, ...googleBooks, ...loc];
        })
      );

      const portals = externalPortalResults(clean);
      const merged = dedupeResults([...liveBatches.flat(), ...portals])
        .map((item) => ({ ...item, relevance: scoreResult(item, clean) }))
        .filter((item) => item.kind === "portal" || item.relevance > -100)
        .sort((a, b) => b.relevance - a.relevance);

      setResults(merged);
    } finally {
      setLoading(false);
    }
  }

  const sourceKeys = Object.keys(SOURCES);
  const structured = parseStructuredQuery(lastQuery).structured;

  return (
    <div className="page" dir="ltr" lang="fr">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f7f5ef; color: #172033; }
        .page { min-height: 100vh; }
        .topbar { background: linear-gradient(135deg, #0f766e, #115e59 48%, #7f1d1d); color: white; }
        .top-inner { max-width: 1180px; margin: 0 auto; padding: 30px 28px 24px; }
        .brand { display:flex; align-items:center; gap:12px; font-size:34px; font-weight:800; }
        .brand strong { color:#f6c744; }
        .subtitle { margin: 8px 0 22px; color:#efffd0; }
        .search-form { display:flex; max-width: 900px; border:2px solid #e6b735; background:white; }
        .search-form input { flex:1; border:0; outline:none; padding:14px 16px; font-size:17px; min-width:0; }
        .search-form button { width:62px; border:0; background:#e9b63b; cursor:pointer; display:grid; place-items:center; }
        .layout { max-width:1180px; margin:0 auto; padding:26px 28px; display:grid; grid-template-columns:230px 1fr; gap:28px; }
        aside { border-right:1px solid #ddd3c5; padding-right:22px; }
        aside h3 { margin:0 0 12px; color:#7f1d1d; font-size:15px; }
        .filter-btn { display:block; width:100%; text-align:left; border:0; background:transparent; padding:7px 0; cursor:pointer; color:#1f2937; }
        .filter-btn.active { font-weight:800; color:#0f766e; }
        .filter-group { padding-bottom:18px; margin-bottom:18px; border-bottom:1px solid #ddd3c5; }
        .results-title { margin:0; color:#366d6a; font-size:27px; }
        .count { margin:5px 0 8px; color:#8a563d; font-size:14px; }
        .query-mode { margin:0 0 18px; padding:9px 11px; background:#eef6f0; border-left:3px solid #0f766e; color:#315f55; font-size:13px; }
        .result-item { display:flex; justify-content:space-between; gap:18px; padding:20px 0; border-top:1px solid #ded6c9; }
        .result-main { min-width:0; }
        .title { color:#145ea8; font-size:19px; font-weight:700; text-decoration:none; }
        .title:hover { text-decoration:underline; }
        .meta { margin-top:5px; color:#6b7280; font-size:13px; }
        .description { margin:9px 0; line-height:1.48; color:#4b5563; }
        .actions { display:flex; gap:12px; flex-wrap:wrap; align-items:center; font-size:13px; }
        .actions a { color:#145ea8; text-decoration:none; display:inline-flex; gap:4px; align-items:center; }
        .source { font-weight:800; }
        .access { color:#365314; }
        .pdf-btn { font-weight:800; }
        .match-chip { background:#fff4ce; color:#795400; padding:2px 6px; border-radius:10px; font-weight:700; }
        .badge { flex:0 0 auto; height:28px; padding:6px 9px; border-radius:4px; background:#e6f4ea; color:#166534; font-size:11px; font-weight:800; }
        .badge.portal { background:#e5e7eb; color:#374151; }
        .empty { padding:40px 0; color:#6b7280; font-size:18px; }
        .loading { display:flex; gap:9px; align-items:center; padding:35px 0; color:#0f766e; }
        @media (max-width: 800px) {
          .layout { grid-template-columns:1fr; padding:18px; }
          aside { border-right:0; border-bottom:1px solid #ddd3c5; padding:0 0 16px; }
          .top-inner { padding:22px 18px; }
          .brand { font-size:28px; }
          .result-item { flex-direction:column; }
        }
      `}</style>

      <header className="topbar">
        <div className="top-inner">
          <div className="brand">
            <BookOpen size={34} /> Historio <strong>Sources</strong>
          </div>
          <div className="subtitle">
            Livres, scans, manuscrits, cartes, rapports et archives historiques — PDF ou non.
          </div>
          <form className="search-form" onSubmit={runSearch}>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Ex. الجغرافيا + الزهري, النزهة + الإدريسي, traité de Tafna..."
            />
            <button type="submit" aria-label="Rechercher">
              {loading ? <Loader2 size={24} /> : <Search size={25} />}
            </button>
          </form>
        </div>
      </header>

      <main className="layout">
        <aside>
          <div className="filter-group">
            <h3>Sources</h3>
            <button className={`filter-btn ${sourceFilter === "all" ? "active" : ""}`} onClick={() => setSourceFilter("all")}>Toutes les sources</button>
            {sourceKeys.map((key) => (
              <button key={key} className={`filter-btn ${sourceFilter === key ? "active" : ""}`} onClick={() => setSourceFilter(key)}>
                {SOURCES[key]}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <h3>Accès</h3>
            <button className={`filter-btn ${accessFilter === "all" ? "active" : ""}`} onClick={() => setAccessFilter("all")}>Tous les documents</button>
            <button className={`filter-btn ${accessFilter === "digitized" ? "active" : ""}`} onClick={() => setAccessFilter("digitized")}>Numérisés uniquement</button>
            <button className={`filter-btn ${accessFilter === "pdf" ? "active" : ""}`} onClick={() => setAccessFilter("pdf")}>PDF uniquement</button>
          </div>
        </aside>

        <section>
          <h1 className="results-title">Sources historiques</h1>
          {searched && !loading && (
            <>
              <div className="count">{filtered.length} résultat(s) affiché(s) sur {results.length} référence(s)</div>
              {structured && (
                <div className="query-mode">
                  Recherche combinée : priorité aux documents qui correspondent simultanément aux deux parties séparées par +. Les résultats partiels ne servent qu'en élargissement.
                </div>
              )}
            </>
          )}

          {loading && (
            <div className="loading"><Loader2 size={20} /> Recherche académique : combinaison stricte d'abord, puis élargissement contrôlé…</div>
          )}

          {!loading && !searched && (
            <div className="empty">Lancez une recherche pour afficher les sources disponibles.</div>
          )}

          {!loading && searched && filtered.length === 0 && (
            <div className="empty">
              Aucun résultat avec ce filtre. Essayez « Tous les documents » ou une requête plus large.
            </div>
          )}

          {!loading && filtered.map((item) => <ResultItem key={item.id} item={item} />)}
        </section>
      </main>
    </div>
  );
}
