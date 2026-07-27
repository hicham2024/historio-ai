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
          title: doc.title || "العنوان غير متوفر",
          author: Array.isArray(doc.creator)
            ? doc.creator.join(", ")
            : doc.creator || "المؤلف غير متوفر",
          date: doc.date || "التاريخ غير متوفر",
          language: Array.isArray(doc.language)
            ? doc.language.join(", ")
            : doc.language || "اللغة غير متوفرة",
          description: stripHtml(
            Array.isArray(doc.description)
              ? doc.description[0]
              : doc.description || ""
          ),
          pageUrl: `https://archive.org/details/${doc.identifier}`,
          directPdf,
          access: directPdf ? "PDF مباشر" : "صفحة الكتاب",
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
          title: info.title || "العنوان غير متوفر",
          author: Array.isArray(info.authors)
            ? info.authors.join(", ")
            : "المؤلف غير متوفر",
          date: info.publishedDate || "التاريخ غير متوفر",
          language: info.language || "اللغة غير متوفرة",
          description: stripHtml(info.description || ""),
          pageUrl: access.webReaderLink || info.previewLink || info.infoLink || "",
          directPdf: access.pdf?.downloadLink || "",
          access: access.pdf?.downloadLink
            ? "PDF من Google Books"
            : "قراءة مجانية",
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

    const title = get("dc:title") || "العنوان غير متوفر";
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
      author: get("dc:creator") || "المؤلف غير متوفر",
      date: get("dc:date") || "التاريخ غير متوفر",
      language: get("dc:language") || "اللغة غير متوفرة",
      description: stripHtml(get("dc:description") || get("dc:type") || ""),
      pageUrl,
      directPdf,
      access: directPdf ? "PDF رسمي من Gallica" : "صفحة Gallica",
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
      title: `بحث في CIA Reading Room عن: ${keyword}`,
      author: "Central Intelligence Agency",
      date: "مصدر خارجي",
      language: "English",
      description:
        "يفتح البحث الرسمي في CIA Reading Room للاطلاع على الوثائق التي رُفعت عنها السرية.",
      pageUrl: ciaSearchUrl(keyword),
      directPdf: "",
      access: "بحث خارجي",
    },
  ];
}

function searchNoorBook(keyword) {
  return [
    {
      id: `noor-search-${keyword}`,
      source: "noor",
      title: `بحث في Noor Book عن: ${keyword}`,
      author: "Noor Book",
      date: "مصدر خارجي",
      language: "Arabic / multi-langue",
      description:
        "يفتح البحث في Noor Book للعثور على الكتب المرتبطة بالكلمة المفتاحية. يُرجى التحقق من حقوق وشروط التحميل.",
      pageUrl: noorSearchUrl(keyword),
      directPdf: "",
      access: "بحث خارجي",
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
              <Download size={14} /> تحميل PDF
            </a>
          )}

          {item.pageUrl && (
            <a href={item.pageUrl} target="_blank" rel="noreferrer">
              صفحة المصدر <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      <div className="badge">{item.directPdf ? "PDF" : "ويب"}</div>
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
    <div className="page" dir="rtl" lang="ar">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Tahoma, Arial, sans-serif; direction: rtl; text-align: right; background: #f8f5ef; color: #14213d; }
        .page { min-height: 100vh; }
        .topbar { background: linear-gradient(135deg, #0f766e, #115e59 45%, #7f1d1d); color: white; border-bottom: 1px solid #e2d8c8; }
        .top-inner { max-width: 1120px; margin: 0 auto; padding: 28px 20px 24px; }
        .brand { display: flex; align-items: center; gap: 10px; font-size: 34px; letter-spacing: -1px; }
        .brand strong { color: #fef3c7; font-weight: 900; }
        .brand span { color: #fbbf24; font-weight: 700; }
        .subtitle { margin-top: 6px; color: #d9f99d; font-size: 14px; }
        .userbar { max-width: 820px; display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; color: #fef3c7; font-size: 14px; }
        .userbar button { border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.1); color: white; padding: 8px 12px; cursor: pointer; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }

        @media (max-width: 760px) {
          .brand { font-size: 28px; }
          .userbar, .gate form { flex-direction: column; align-items: flex-start; }
          .gate button { padding: 12px; }
          .layout { grid-template-columns: 1fr; }
          .sidebar { display: block; }
          .result-item { grid-template-columns: 1fr; }
          .badge { justify-self: start; }
        }
      `}</style>

      <header className="topbar">
        <div className="top-inner">
          <div className="brand">
            <BookOpen size={32} />
            <strong>Historio</strong>
            <span>PDF</span>
          </div>

          <div className="subtitle">
            محرك بحث للكتب التاريخية المجانية وملفات PDF والوثائق العامة.
          </div>

          <div className="userbar">
            <div>
              {email ? (
                <>متصل ✅</>
              ) : (
                <>سجّل الدخول ببريدك الإلكتروني لاستخدام البحث.</>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {email && (
                <button type="button" onClick={logout}>
                  <LogOut size={14} /> تسجيل الخروج
                </button>
              )}
            </div>
          </div>

          {!email && (
            <div className="gate">
              <div className="gate-title">
                <Lock size={18} /> يلزم تسجيل الدخول بالبريد الإلكتروني
              </div>

              <div>
                أدخل بريدك الإلكتروني للوصول إلى البحث. لن يظهر عنوانك على الصفحة.
              </div>

              <form onSubmit={connectWithEmail}>
                <input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="بريدك@example.com"
                  type="email"
                />

                <button type="submit">
                  <Mail size={16} /> تسجيل الدخول
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
              placeholder="ابحث عن كتاب تاريخي أو ملف PDF أو وثيقة أرشيفية…"
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

          <div className="search-help">
            يمكنك البحث بالكلمات المفتاحية بالعربية أو الفرنسية أو الإنجليزية.
          </div>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar" aria-label="مرشحات البحث">
          <div className="filter-block">
            <div className="filter-title">المصادر</div>

            <button type="button" className={`filter-link ${sourceFilter === "all" ? "active" : ""}`} onClick={() => setSourceFilter("all")}>
              جميع المصادر
            </button>
            <button type="button" className={`filter-link ${sourceFilter === "archive" ? "active" : ""}`} onClick={() => setSourceFilter("archive")}>
              Archive.org
            </button>
            <button type="button" className={`filter-link ${sourceFilter === "googleBooks" ? "active" : ""}`} onClick={() => setSourceFilter("googleBooks")}>
              Google Books
            </button>
            <button type="button" className={`filter-link ${sourceFilter === "gallica" ? "active" : ""}`} onClick={() => setSourceFilter("gallica")}>
              Gallica / BnF
            </button>
          </div>

          <div className="filter-block">
            <div className="filter-title">الوصول</div>
            <label className="check">
              <input type="checkbox" checked={onlyPdf} onChange={(event) => setOnlyPdf(event.target.checked)} />
              <span>PDF مباشر فقط</span>
            </label>
          </div>
        </aside>

        <section>
          {(loading || results.length > 0) && (
            <div className="content-header">
              <div className="content-title">الكتب وملفات PDF المجانية</div>

              <div className="count">
                يتم عرض {filtered.length} نتيجة من أصل {results.length} مرجعًا
              </div>
            </div>
          )}

          {loading && (
            <div className="loading">
              <Loader2 className="spin" size={20} />
              جارٍ البحث في Archive.org وGallica وGoogle Books وCIA وNoor Book…
            </div>
          )}

          {!loading && results.length > 0 && filtered.length === 0 && email && (
            <div className="empty">
              لم يتم العثور على ملف PDF. جرّب كلمة مفتاحية أخرى أو ألغِ خيار «PDF مباشر فقط».
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
