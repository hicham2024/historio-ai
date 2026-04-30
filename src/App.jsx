import React, { useMemo, useState } from "react";
import {
  Search,
  ExternalLink,
  BookOpen,
  Loader2,
  Mail,
  Lock,
  Download,
  LogOut,
  Heart,
} from "lucide-react";

const SOURCES = {
  archive: "Archive.org",
  googleBooks: "Google Books",
  gallica: "Gallica / BnF",
  cia: "CIA Reading Room",
  noor: "Noor Book",
};

const SOURCE_COLORS = {
  archive: "#0f766e",
  googleBooks: "#7c3aed",
  gallica: "#9a3412",
  cia: "#334155",
  noor: "#2563eb",
};

const DONATION_LINK = "https://buy.stripe.com/cNi6oJfrj7Y5b367VDcV200";

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getYear(value = "") {
  const year = parseInt(String(value).slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function buildQueries(keyword) {
  const clean = keyword.trim();
  return [clean];
}

function ciaSearchUrl(keyword) {
  return `https://www.cia.gov/readingroom/search/site/${encodeURIComponent(keyword)}`;
}

function noorSearchUrl(keyword) {
  return `https://www.noor-book.com/search?q=${encodeURIComponent(keyword)}`;
}

function scoreResult(item, keyword) {
  const query = keyword.toLowerCase();
  const title = item.title.toLowerCase();
  let score = 0;

  if (title.includes(query)) score += 50;
  if (item.directPdf) score += 35;
  if (item.source === "archive") score += 15;
  if (item.source === "gallica") score += 15;

  const year = getYear(item.date);
  if (year && year <= 1950) score += 10;

  return score;
}

function archivePdfUrl(identifier, files = []) {
  const pdf = files.find(
    (file) => file.name && file.name.toLowerCase().endsWith(".pdf")
  );

  if (!identifier || !pdf) return "";
  return `https://archive.org/download/${identifier}/${encodeURIComponent(pdf.name)}`;
}

async function getArchiveMetadata(identifier) {
  try {
    const response = await fetch(`https://archive.org/metadata/${identifier}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function searchArchive(keyword) {
  try {
    const params = new URLSearchParams();
    params.set("q", `${keyword} AND mediatype:texts`);

    ["title", "creator", "date", "identifier", "language", "description"].forEach(
      (field) => params.append("fl[]", field)
    );

    params.set("rows", "8");
    params.set("page", "1");
    params.set("output", "json");

    const response = await fetch(
      `https://archive.org/advancedsearch.php?${params.toString()}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    const docs = data?.response?.docs || [];

    return await Promise.all(
      docs.map(async (doc) => {
        const metadata = await getArchiveMetadata(doc.identifier);
        const directPdf = archivePdfUrl(doc.identifier, metadata?.files || []);

        return {
          id: `archive-${doc.identifier}`,
          source: "archive",
          title: doc.title || "Titre non indiqué",
          author: Array.isArray(doc.creator)
            ? doc.creator.join(", ")
            : doc.creator || "Auteur non indiqué",
          date: doc.date || "Date non indiquée",
          language: Array.isArray(doc.language)
            ? doc.language.join(", ")
            : doc.language || "Langue non indiquée",
          description: stripHtml(
            Array.isArray(doc.description)
              ? doc.description[0]
              : doc.description || ""
          ),
          pageUrl: `https://archive.org/details/${doc.identifier}`,
          directPdf,
          access: directPdf ? "PDF direct" : "Page du livre",
        };
      })
    );
  } catch {
    return [];
  }
}

async function searchGoogleBooks(keyword) {
  try {
    const params = new URLSearchParams();
    params.set("q", keyword);
    params.set("maxResults", "12");
    params.set("printType", "books");
    params.set("filter", "free-ebooks");

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data?.items || [])
      .filter((item) => {
        const access = item.accessInfo || {};
        return access.viewability && access.viewability !== "NO_PAGES";
      })
      .map((item) => {
        const info = item.volumeInfo || {};
        const access = item.accessInfo || {};

        return {
          id: `google-${item.id}`,
          source: "googleBooks",
          title: info.title || "Titre non indiqué",
          author: Array.isArray(info.authors)
            ? info.authors.join(", ")
            : "Auteur non indiqué",
          date: info.publishedDate || "Date non indiquée",
          language: info.language || "Langue non indiquée",
          description: stripHtml(info.description || ""),
          pageUrl: access.webReaderLink || info.previewLink || info.infoLink || "",
          directPdf: access.pdf?.downloadLink || "",
          access: access.pdf?.downloadLink
            ? "PDF Google Books"
            : "Lecture gratuite",
        };
      });
  } catch {
    return [];
  }
}

function getGallicaArkFromUrl(pageUrl) {
  if (!pageUrl) return "";
  const match = pageUrl.match(/ark:\/[0-9]+\/[^/?#]+/);
  return match ? match[0] : "";
}

function getGallicaPdfUrl(pageUrl) {
  const ark = getGallicaArkFromUrl(pageUrl);
  if (!ark) return "";
  return `https://gallica.bnf.fr/${ark}.pdf`;
}

function parseGallicaXml(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const records = Array.from(xml.getElementsByTagName("record"));

  return records.map((record, index) => {
    const get = (tag) =>
      record.getElementsByTagName(tag)?.[0]?.textContent || "";

    const title = get("dc:title") || "Titre non indiqué";
    const identifierNodes = Array.from(
      record.getElementsByTagName("dc:identifier")
    );

    const pageUrl =
      identifierNodes
        .map((node) => node.textContent || "")
        .find((value) => value.includes("gallica.bnf.fr")) || "";

    const directPdf = getGallicaPdfUrl(pageUrl);

    return {
      id: `gallica-${index}-${title}`,
      source: "gallica",
      title,
      author: get("dc:creator") || "Auteur non indiqué",
      date: get("dc:date") || "Date non indiquée",
      language: get("dc:language") || "Langue non indiquée",
      description: stripHtml(get("dc:description") || get("dc:type") || ""),
      pageUrl,
      directPdf,
      access: directPdf ? "PDF Gallica officiel" : "Page Gallica",
    };
  });
}

async function searchGallica(keyword) {
  try {
    const clean = keyword.replaceAll('"', "");
    const query = `(dc.title all "${clean}") or (dc.description all "${clean}")`;

    const params = new URLSearchParams();
    params.set("operation", "searchRetrieve");
    params.set("version", "1.2");
    params.set("query", query);
    params.set("maximumRecords", "8");

    const response = await fetch(
      `https://gallica.bnf.fr/SRU?${params.toString()}`
    );

    if (!response.ok) return [];

    return parseGallicaXml(await response.text());
  } catch {
    return [];
  }
}

function searchCIA(keyword) {
  return [
    {
      id: `cia-search-${keyword}`,
      source: "cia",
      title: `Recherche CIA Reading Room : ${keyword}`,
      author: "Central Intelligence Agency",
      date: "Source externe",
      language: "English",
      description:
        "Ouvre la recherche officielle de la CIA Reading Room. Les documents déclassifiés sont consultables sur le site de la CIA.",
      pageUrl: ciaSearchUrl(keyword),
      directPdf: "",
      access: "Recherche externe",
    },
  ];
}

function searchNoorBook(keyword) {
  return [
    {
      id: `noor-search-${keyword}`,
      source: "noor",
      title: `Recherche Noor Book : ${keyword}`,
      author: "Noor Book",
      date: "Source externe",
      language: "Arabic / multi-langue",
      description:
        "Ouvre la recherche Noor Book pour trouver des livres liés au mot-clé. Vérifiez toujours les droits et conditions de téléchargement.",
      pageUrl: noorSearchUrl(keyword),
      directPdf: "",
      access: "Recherche externe",
    },
  ];
}

function dedupeResults(results) {
  const seen = new Set();

  return results.filter((item) => {
    const key = `${item.source}-${item.title}-${item.author}`.toLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ResultItem({ item }) {
  const sourceColor = SOURCE_COLORS[item.source] || "#334155";
  const year = getYear(item.date);
  const mainUrl = item.directPdf || item.pageUrl;

  return (
    <article className="result-item">
      <div>
        <a className="title" href={mainUrl} target="_blank" rel="noreferrer">
          {item.title}
        </a>

        <div className="meta">
          {item.author} — {item.date} — {item.language}
        </div>

        {item.description && (
          <p className="description">
            {item.description.slice(0, 280)}
            {item.description.length > 280 ? "…" : ""}
          </p>
        )}

        <div className="actions">
          <span className="source" style={{ color: sourceColor }}>
            {SOURCES[item.source]}
          </span>

          {year && <span>{year}</span>}

          <span className="access">{item.access}</span>

          {item.directPdf && (
            <a
              className="pdf-btn"
              href={item.directPdf}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={14} /> Télécharger PDF
            </a>
          )}

          {item.pageUrl && (
            <a href={item.pageUrl} target="_blank" rel="noreferrer">
              Page source <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      <div className="badge">{item.directPdf ? "PDF" : "WEB"}</div>
    </article>
  );
}

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [email, setEmail] = useState(
    localStorage.getItem("histobook_user_email") || ""
  );
  const [emailInput, setEmailInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
const [onlyPdf, setOnlyPdf] = useState(false);
  const filtered = useMemo(() => {
    return results.filter((item) => {
      if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
      if (onlyPdf && !item.directPdf) return false;
      return true;
    });
  }, [results, sourceFilter, onlyPdf]);

  async function connectWithEmail(event) {
    event.preventDefault();

    const value = emailInput.trim().toLowerCase();
    const isValid = /^\S+@\S+\.\S+$/.test(value);

    if (!isValid) return;

    try {
      const formData = new URLSearchParams();
      formData.append("form-name", "clients");
      formData.append("email", value);
      formData.append("source", "Histobook");

      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
    } catch {
      // L'utilisateur peut continuer même si Netlify Forms ne répond pas.
    }

    localStorage.setItem("histobook_user_email", value);
    setEmail(value);
    setEmailInput("");
  }

  function logout() {
    localStorage.removeItem("histobook_user_email");
    setEmail("");
    setResults([]);
  }

  async function runSearch(event) {
    event.preventDefault();

    if (!email) return;

    const clean = keyword.trim();
    if (!clean) return;

    setLoading(true);
    setResults([]);

    const queries = buildQueries(clean);

    const settled = await Promise.all(
      queries.flatMap((q) => [
        searchArchive(q),
        searchGoogleBooks(q),
        searchGallica(q),
        Promise.resolve(searchCIA(q)),
        Promise.resolve(searchNoorBook(q)),
      ])
    );

    const merged = dedupeResults(settled.flat()).sort(
      (a, b) => scoreResult(b, clean) - scoreResult(a, clean)
    );

    setResults(merged);
    setLoading(false);
  }

  return (
    <div className="page">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #f8f5ef; color: #14213d; }
        .page { min-height: 100vh; }
        .topbar { background: linear-gradient(135deg, #0f766e, #115e59 45%, #7f1d1d); color: white; border-bottom: 1px solid #e2d8c8; }
        .top-inner { max-width: 1120px; margin: 0 auto; padding: 28px 20px 24px; }
        .brand { display: flex; align-items: center; gap: 10px; font-size: 34px; letter-spacing: -1px; }
        .brand strong { color: #fef3c7; font-weight: 900; }
        .brand span { color: #fbbf24; font-weight: 700; }
        .subtitle { margin-top: 6px; color: #d9f99d; font-size: 14px; }
        .userbar { max-width: 820px; display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; color: #fef3c7; font-size: 14px; }
        .userbar button, .don-btn { border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.1); color: white; padding: 8px 12px; cursor: pointer; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
        .don-btn { border-color: #fbbf24; color: #fef3c7; }
        .gate { max-width: 820px; margin-top: 16px; background: #fffbeb; color: #14213d; border: 2px solid #fbbf24; padding: 16px; box-shadow: 0 10px 24px rgba(0,0,0,.15); }
        .gate-title { color: #7f1d1d; font-weight: 900; display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
        .gate form { display: flex; gap: 8px; margin-top: 12px; }
        .gate input { flex: 1; padding: 11px 12px; border: 1px solid #d6c7aa; font-size: 15px; }
        .gate button { border: 0; background: #0f766e; color: white; padding: 0 14px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .search-row { max-width: 820px; display: flex; margin-top: 20px; height: 48px; border: 2px solid #fbbf24; box-shadow: 0 10px 24px rgba(0,0,0,.18); }
        .search-row input { flex: 1; border: 0; outline: 0; padding: 0 14px; font-size: 16px; background: #fffaf0; color: #14213d; }
        .search-row button { width: 58px; border: 0; background: #f59e0b; color: #111827; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .search-row.disabled { opacity: .55; pointer-events: none; }
        .layout { max-width: 1120px; margin: 0 auto; display: block; padding: 24px 20px 60px; }
        .sidebar { display: none; }
        .filter-block { border-bottom: 1px solid #e2d8c8; padding-bottom: 18px; margin-bottom: 18px; }
        .filter-title { color: #7f1d1d; font-weight: 900; margin-bottom: 10px; }
        .filter-link { display: block; border: 0; background: none; padding: 5px 0; cursor: pointer; color: #14213d; font-size: 14px; text-align: left; }
        .filter-link.active { color: #0f766e; font-weight: 900; }
        .check { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .content-header { border-bottom: 1px solid #e2d8c8; padding-bottom: 12px; margin-bottom: 8px; }
        .content-title { font-size: 24px; color: #0f766e; font-weight: 800; }
        .count { color: #78716c; font-size: 13px; margin-top: 4px; }
        .loading, .empty { padding: 32px 0; color: #78716c; display: flex; align-items: center; gap: 8px; }
        .result-item { display: grid; grid-template-columns: 1fr 64px; gap: 20px; padding: 18px 0; border-bottom: 1px solid #eadfce; }
        .title { color: #0f3d8a; text-decoration: none; font-size: 17px; line-height: 1.35; font-weight: 800; }
        .title:hover { text-decoration: underline; }
        .meta { color: #15803d; margin-top: 5px; font-size: 13px; line-height: 1.4; }
        .description { color: #374151; margin: 7px 0 0; font-size: 14px; line-height: 1.5; }
        .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 9px; font-size: 13px; color: #4b5563; }
        .actions a { color: #7c3aed; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; font-weight: 800; }
        .pdf-btn { color: #7f1d1d !important; }
        .source, .access { font-weight: 900; }
        .badge { justify-self: end; color: #7f1d1d; font-size: 12px; font-weight: 900; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 760px) {
          .brand { font-size: 28px; }
          .userbar, .gate form { flex-direction: column; align-items: flex-start; }
          .gate button { padding: 12px; }
          .layout { grid-template-columns: 1fr; }
          .sidebar { display: none; }
          .result-item { grid-template-columns: 1fr; }
          .badge { justify-self: start; }
        }
      `}</style>

      <header className="topbar">
        <div className="top-inner">
          <div className="brand">
            <BookOpen size={32} />
            <strong>Histobook</strong>
            <span>PDF</span>
          </div>

          <div className="subtitle">
            Moteur de recherche de livres historiques gratuits, PDF et documents publics.
          </div>

          <div className="userbar">
            <div>
              {email ? (
                <>Connecté ✅</>
              ) : (
                <>Connectez-vous avec votre e-mail pour utiliser la recherche.</>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a className="don-btn" href={DONATION_LINK} target="_blank" rel="noreferrer">
                <Heart size={14} /> DONS
              </a>
              {email && (
                <button type="button" onClick={logout}>
                  <LogOut size={14} /> Déconnexion
                </button>
              )}
            </div>
          </div>

          {!email && (
            <div className="gate">
              <div className="gate-title">
                <Lock size={18} /> Accès par e-mail requis
              </div>

              <div>
                Entrez votre e-mail pour accéder à la recherche. Votre adresse ne sera pas affichée sur la page.
              </div>

              <form onSubmit={connectWithEmail}>
                <input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="votre@email.com"
                  type="email"
                />

                <button type="submit">
                  <Mail size={16} /> Se connecter
                </button>
              </form>
            </div>
          )}

          <form
            className={`search-row ${!email ? "disabled" : ""}`}
            onSubmit={runSearch}
          >
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Rechercher un livre historique, un PDF, une archive…"
              disabled={!email}
            />

            <button disabled={loading || !email} type="submit">
              {loading ? (
                <Loader2 className="spin" size={22} />
              ) : (
                <Search size={22} />
              )}
            </button>
          </form>
        </div>
      </header>

      <main className="layout">
        <section>
          {(loading || results.length > 0) && (
            <div className="content-header">
              <div className="content-title">Livres et PDF gratuits</div>

              <div className="count">
                {filtered.length} résultat(s) affiché(s) sur {results.length} référence(s)
              </div>
            </div>
          )}

          {loading && (
            <div className="loading">
              <Loader2 className="spin" size={20} />
              Recherche dans Archive.org, Gallica, Google Books, CIA et Noor Book…
            </div>
          )}

          {!loading && results.length > 0 && filtered.length === 0 && email && (
            <div className="empty">
              Aucun PDF trouvé. Essayez un mot-clé plus simple ou désactivez “PDF direct uniquement”.
            </div>
          )}

          <div className="results">
            {filtered.map((item) => (
              <ResultItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
