<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>بوابة البحوث التاريخية</title>

  <meta
    name="description"
    content="موقع البحوث والوثائق التاريخية المتعلقة بالمغرب."
  >

  <style>
    :root {
      --bg-dark: #0b0f13;
      --bg-soft: #111827;
      --card: rgba(17, 24, 39, 0.82);
      --card-border: rgba(255, 255, 255, 0.10);
      --text-main: #f8fafc;
      --text-soft: #d1d9e6;
      --text-muted: #aab5c5;
      --green: #0f766e;
      --green-light: #5eead4;
      --gold: #d4a94f;
      --gold-soft: #f4d48b;
      --blue-light: #93c5fd;
      --red-brown: #7c2d12;
      --shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
      --radius: 18px;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      direction: rtl;
      text-align: right;
      color: var(--text-main);
      font-family:
        "Cairo",
        "Tajawal",
        system-ui,
        -apple-system,
        "Segoe UI",
        Roboto,
        Ubuntu,
        Tahoma,
        sans-serif;
      background:
        linear-gradient(rgba(6, 10, 14, 0.80), rgba(6, 10, 14, 0.88)),
        url("images/morocco-heritage.jpg") center/cover no-repeat fixed;
      min-height: 100vh;
    }

    a {
      color: inherit;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(8, 12, 18, 0.72);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .topbar-inner {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 14px 0;
    }

    .brand {
      font-size: 1rem;
      font-weight: 800;
      color: var(--gold-soft);
      letter-spacing: 0.2px;
      white-space: nowrap;
    }

    .nav {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .nav a {
      text-decoration: none;
      color: var(--text-soft);
      font-size: 0.95rem;
      transition: 0.25s;
    }

    .nav a:hover {
      color: var(--green-light);
    }

    .hero {
      position: relative;
      padding: 110px 20px 70px;
      overflow: hidden;
    }

    .hero::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(15, 118, 110, 0.20), rgba(124, 45, 18, 0.24)),
        radial-gradient(circle at top right, rgba(212, 169, 79, 0.22), transparent 38%);
      pointer-events: none;
    }

    .hero-inner {
      position: relative;
      width: min(1180px, 100%);
      margin: 0 auto;
      text-align: center;
    }

    .hero-kicker {
      display: inline-block;
      margin-bottom: 18px;
      padding: 7px 14px;
      border: 1px solid rgba(244, 212, 139, 0.28);
      background: rgba(255,255,255,0.06);
      color: var(--gold-soft);
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 700;
      backdrop-filter: blur(8px);
    }

    .hero h1 {
      margin: 0 0 16px;
      font-size: clamp(2rem, 5vw, 4rem);
      line-height: 1.25;
      font-weight: 900;
      color: #ffffff;
      text-shadow: 0 3px 15px rgba(0,0,0,0.35);
    }

    .hero p {
      width: min(820px, 100%);
      margin: 0 auto;
      color: var(--text-soft);
      line-height: 2;
      font-size: 1.05rem;
    }

    .hero-line {
      width: 120px;
      height: 3px;
      margin: 26px auto 0;
      background: linear-gradient(to left, transparent, var(--gold), transparent);
      border-radius: 999px;
    }

    .main-wrap {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto 42px;
    }

    .section-box {
      background: rgba(9, 13, 20, 0.70);
      border: 1px solid rgba(255,255,255,0.08);
      backdrop-filter: blur(10px);
      border-radius: 26px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
      padding: 26px 28px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background:
        linear-gradient(to left, rgba(15, 118, 110, 0.10), rgba(0,0,0,0));
    }

    .section-head h2 {
      margin: 0;
      color: #ffffff;
      font-size: 1.45rem;
    }

    .section-head p {
      margin: 0;
      color: var(--text-muted);
      line-height: 1.9;
      font-size: 0.97rem;
    }

    .stats {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .stat-pill {
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      color: var(--gold-soft);
      font-size: 0.88rem;
      font-weight: 700;
    }

    .links-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 24px;
    }

    .item {
      position: relative;
      padding: 22px;
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
      transition: transform 0.28s ease, border-color 0.28s ease, background 0.28s ease;
    }

    .item:hover {
      transform: translateY(-4px);
      border-color: rgba(94, 234, 212, 0.42);
      background: rgba(18, 25, 37, 0.92);
    }

    .item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.2px;
      white-space: nowrap;
    }

    .badge.new {
      background: linear-gradient(135deg, #92400e, #c2410c);
      color: #fff;
      box-shadow: 0 4px 12px rgba(194, 65, 12, 0.32);
    }

    .badge.kind {
      background: rgba(94, 234, 212, 0.10);
      color: var(--green-light);
      border: 1px solid rgba(94, 234, 212, 0.22);
    }

    a.title {
      display: inline-block;
      margin-bottom: 10px;
      color: #ffffff;
      font-size: 1.18rem;
      font-weight: 800;
      line-height: 1.9;
      text-decoration: none;
      transition: 0.25s;
    }

    a.title:hover {
      color: var(--green-light);
    }

    .desc {
      margin: 0 0 10px;
      color: var(--text-soft);
      line-height: 1.95;
      font-size: 0.98rem;
    }

    .tag {
      color: var(--gold-soft);
      font-size: 0.9rem;
      line-height: 1.8;
    }

    .footer {
      width: min(1180px, calc(100% - 32px));
      margin: 28px auto 40px;
      padding: 22px 10px 0;
      text-align: center;
      color: #9aa8ba;
      font-size: 0.92rem;
      border-top: 1px solid rgba(255,255,255,0.10);
    }

    .footer strong {
      color: var(--gold-soft);
    }

    @media (min-width: 860px) {
      .links-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 700px) {
      body {
        background-attachment: scroll;
      }

      .hero {
        padding: 85px 16px 50px;
      }

      .section-head,
      .links-grid {
        padding-right: 18px;
        padding-left: 18px;
      }

      .section-head {
        padding-top: 20px;
        padding-bottom: 14px;
      }

      .item {
        padding: 18px;
      }

      .hero p {
        font-size: 0.98rem;
      }

      a.title {
        font-size: 1.06rem;
      }

      .brand {
        font-size: 0.95rem;
      }
    }

    /* ===== Historio PDF : carte dans la bannière ===== */
    .hero-inner {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 410px);
      align-items: center;
      gap: 48px;
      text-align: right;
    }

    .hero-content {
      text-align: center;
    }

    .historio-access {
      width: 100%;
      padding: 26px;
      border: 1px solid rgba(244, 212, 139, 0.30);
      border-radius: 24px;
      background:
        linear-gradient(145deg, rgba(10, 18, 24, 0.94), rgba(42, 35, 28, 0.92));
      box-shadow:
        0 24px 70px rgba(0, 0, 0, 0.34),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      text-align: right;
      position: relative;
      overflow: hidden;
    }

    .historio-access::before {
      content: "";
      position: absolute;
      width: 180px;
      height: 180px;
      top: -90px;
      left: -70px;
      border-radius: 50%;
      background: rgba(212, 169, 79, 0.12);
      filter: blur(8px);
      pointer-events: none;
    }

    .historio-access > * {
      position: relative;
      z-index: 1;
    }

    .historio-access-icon {
      width: 54px;
      height: 54px;
      margin-bottom: 16px;
      display: grid;
      place-items: center;
      border-radius: 16px;
      background: rgba(212, 169, 79, 0.13);
      border: 1px solid rgba(244, 212, 139, 0.24);
      font-size: 25px;
    }

    .historio-access-label {
      display: inline-block;
      margin-bottom: 8px;
      color: var(--gold-soft);
      font-size: 0.82rem;
      font-weight: 800;
    }

    .historio-access h2 {
      margin: 0 0 10px;
      color: #fff;
      font-size: clamp(1.05rem, 1.45vw, 1.3rem);
      line-height: 1.5;
    }

    .historio-access p {
      width: auto;
      margin: 0 0 18px;
      color: var(--text-soft);
      font-size: 0.82rem;
      line-height: 1.75;
    }

    .historio-open-button {
      width: 100%;
      min-height: 44px;
      padding: 10px 14px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 9px;
      border: 1px solid #e1b548;
      border-radius: 11px;
      background: linear-gradient(135deg, #e8b438, #c98919);
      color: #161616;
      font: inherit;
      font-weight: 900;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
    }

    .historio-open-button:hover {
      transform: translateY(-2px);
      filter: brightness(1.06);
      box-shadow: 0 12px 30px rgba(225, 181, 72, 0.24);
    }

    /* ===== Fenêtre modale Historio PDF ===== */
    .historio-modal {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: rgba(2, 7, 10, 0.88);
      backdrop-filter: blur(8px);
    }

    .historio-modal.is-open {
      display: flex;
    }

    .historio-modal-window {
      width: min(1450px, 100%);
      height: min(880px, 94vh);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(225, 193, 110, 0.38);
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 30px 100px rgba(0, 0, 0, 0.60);
    }

    .historio-modal-header {
      min-height: 65px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      background: #14191f;
      border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    }

    .historio-modal-title {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .historio-modal-title strong {
      color: #fff;
      font-size: 1rem;
    }

    .historio-modal-title span {
      color: #aeb8c0;
      font-size: 0.78rem;
    }

    .historio-modal-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .historio-external-link,
    .historio-close-button {
      min-height: 40px;
      padding: 8px 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      font: inherit;
      font-size: 0.82rem;
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
    }

    .historio-external-link {
      border: 1px solid rgba(225, 193, 110, 0.40);
      background: rgba(225, 193, 110, 0.10);
      color: #ead18d;
    }

    .historio-close-button {
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .historio-frame {
      width: 100%;
      flex: 1;
      border: 0;
      background: #fff;
    }

    @media (max-width: 950px) {
      .hero-inner {
        grid-template-columns: 1fr;
      }

      .historio-access {
        width: min(520px, 100%);
        margin: 0 auto;
      }
    }

    @media (max-width: 720px) {
      .historio-modal {
        padding: 0;
      }

      .historio-modal-window {
        width: 100%;
        height: 100%;
        max-height: none;
        border: 0;
        border-radius: 0;
      }

      .historio-modal-header {
        min-height: 74px;
        padding: 9px 11px;
      }

      .historio-modal-title span {
        display: none;
      }

      .historio-external-link,
      .historio-close-button {
        padding: 8px 10px;
        font-size: 0.75rem;
      }
    }


    /* ===== Mise en page à trois colonnes : bibliothèque, titre, soutien ===== */
    .hero-inner {
      display: grid;
      grid-template-columns: minmax(220px, 285px) minmax(520px, 1fr) minmax(220px, 285px);
      grid-template-areas: "historio content donation";
      align-items: center;
      gap: 28px;
      width: min(1500px, 100%);
    }

    .hero-content {
      grid-area: content;
      text-align: center;
    }

    .historio-access {
      grid-area: historio;
    }

    .support-access {
      grid-area: donation;
      width: 100%;
      min-height: 245px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border: 1px solid rgba(244, 212, 139, 0.34);
      border-radius: 24px;
      background:
        linear-gradient(145deg, rgba(18, 20, 22, 0.96), rgba(74, 55, 37, 0.90));
      box-shadow:
        0 24px 70px rgba(0, 0, 0, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      text-align: right;
      position: relative;
      overflow: hidden;
    }

    .support-access::before {
      content: "";
      position: absolute;
      width: 190px;
      height: 190px;
      top: -100px;
      right: -65px;
      border-radius: 50%;
      background: rgba(212, 169, 79, 0.15);
      filter: blur(10px);
      pointer-events: none;
    }

    .support-access > * {
      position: relative;
      z-index: 1;
    }

    .support-icon {
      width: 46px;
      height: 46px;
      margin-bottom: 12px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: rgba(212, 169, 79, 0.14);
      border: 1px solid rgba(244, 212, 139, 0.28);
      color: var(--gold-soft);
      font-size: 22px;
    }

    .support-label {
      display: inline-block;
      margin-bottom: 8px;
      color: var(--gold-soft);
      font-size: 0.82rem;
      font-weight: 800;
    }

    .support-access h2 {
      margin: 0 0 10px;
      color: #fff;
      font-size: clamp(1.05rem, 1.45vw, 1.3rem);
      line-height: 1.5;
    }

    .support-access p {
      width: auto;
      margin: 0 0 19px;
      color: var(--text-soft);
      font-size: 0.82rem;
      line-height: 1.75;
    }

    .support-open-button {
      width: 100%;
      min-height: 44px;
      padding: 10px 14px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 9px;
      border: 1px solid #e1b548;
      border-radius: 11px;
      background: linear-gradient(135deg, #f1c755, #c98a20);
      color: #171717;
      font: inherit;
      font-weight: 900;
      cursor: pointer;
      transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
    }

    .support-open-button:hover {
      transform: translateY(-2px);
      filter: brightness(1.06);
      box-shadow: 0 12px 30px rgba(225, 181, 72, 0.25);
    }


    /* ===== Cartes latérales plus discrètes que le titre central ===== */
    .historio-access,
    .support-access {
      max-width: 285px;
      min-height: 245px;
      justify-self: center;
    }

    .historio-access {
      padding: 20px;
    }

    .historio-access-icon {
      width: 46px;
      height: 46px;
      margin-bottom: 12px;
      border-radius: 14px;
      font-size: 21px;
    }

    .historio-access h2 {
      font-size: clamp(1.05rem, 1.45vw, 1.3rem);
      line-height: 1.45;
    }

    .historio-access p {
      font-size: 0.82rem;
      line-height: 1.75;
      margin-bottom: 15px;
    }

    .historio-open-button {
      min-height: 44px;
      padding: 10px 14px;
      border-radius: 11px;
      font-size: 0.88rem;
    }

    .hero-content {
      padding-inline: 12px;
    }

    .hero h1 {
      font-size: clamp(2.8rem, 5.6vw, 5rem);
    }

    /* ===== Fenêtre PayPal ===== */
    .support-modal {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(2, 7, 10, 0.88);
      backdrop-filter: blur(9px);
    }

    .support-modal.is-open {
      display: flex;
    }

    .support-modal-box {
      position: relative;
      width: min(440px, 100%);
      max-height: 92vh;
      overflow-y: auto;
      padding: 36px 30px 28px;
      text-align: center;
      border: 1px solid rgba(244, 212, 139, 0.38);
      border-radius: 24px;
      background: linear-gradient(145deg, #182329, #3e342d 58%, #5b2e28);
      color: #fff;
      box-shadow: 0 30px 100px rgba(0, 0, 0, 0.62);
    }

    .support-modal-close {
      position: absolute;
      top: 12px;
      left: 14px;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 50%;
      background: rgba(255,255,255,.08);
      color: #fff;
      font: inherit;
      font-size: 23px;
      cursor: pointer;
    }

    .support-modal-heart {
      width: 64px;
      height: 64px;
      margin: 0 auto 13px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: var(--gold-soft);
      background: rgba(212,169,79,.14);
      border: 1px solid rgba(244,212,139,.28);
      font-size: 31px;
    }

    .support-modal h2 {
      margin: 0 0 10px;
      color: var(--gold-soft);
      font-size: 1.65rem;
    }

    .support-modal p {
      margin: 0;
      color: #d8dee6;
      line-height: 1.8;
    }

    .support-qr-wrap {
      width: 260px;
      max-width: 100%;
      margin: 22px auto 14px;
      padding: 14px;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 14px 34px rgba(0,0,0,.30);
    }

    .support-qr {
      display: block;
      width: 100%;
      height: auto;
      border-radius: 8px;
    }

    .support-modal-note {
      color: #aeb8c0 !important;
      font-size: .82rem;
    }

    @media (max-width: 1220px) {
      .hero-inner {
        grid-template-columns: minmax(240px, .8fr) minmax(460px, 1.5fr);
        grid-template-areas:
          "content content"
          "historio donation";
      }
    }

    @media (max-width: 780px) {
      .hero-inner {
        grid-template-columns: 1fr;
        grid-template-areas:
          "content"
          "historio"
          "donation";
      }

      .support-access,
      .historio-access {
        width: min(520px, 100%);
        margin: 0 auto;
      }

      .support-modal {
        padding: 12px;
      }
    }

  </style>
</head>

<body>

  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">بوابة البحوث التاريخية</div>

      <nav class="nav">
        <a href="#articles">البحوث</a>
        <a href="#articles">الوثائق</a>
        <a href="#articles">المراجع</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="hero-inner">

      <div class="hero-content">
        <span class="hero-kicker">تاريخ المغرب • وثائق • أبحاث موثقة</span>

        <h1>بوابة البحوث التاريخية</h1>

        <p>
          موقع يجمع الأبحاث والوثائق التاريخية المتعلقة بالمغرب، مع عناية خاصة
          بقضايا الدولة، السيادة، الحدود، الشخصيات، والعلاقات الدبلوماسية
          عبر نصوص موثقة ومواد أرشيفية منتقاة.
        </p>

        <div class="hero-line"></div>
      </div>

      <aside class="historio-access" aria-label="محرك البحث عن الكتب التاريخية">
        <div class="historio-access-icon" aria-hidden="true">📚</div>

        <span class="historio-access-label">مكتبة رقمية مجانية</span>

        <h2>ابحث عن الكتب والوثائق التاريخية</h2>

        <p>
          تصفح الكتب التاريخية المجانية والوثائق بصيغة PDF
          من عدة مكتبات ومصادر رقمية.
        </p>

        <button
          type="button"
          class="historio-open-button"
          id="openHistorio"
        >
          فتح محرك البحث
          <span aria-hidden="true">⌕</span>
        </button>
      </aside>

      <aside class="support-access" aria-label="دعم بوابة البحوث التاريخية">
        <div class="support-icon" aria-hidden="true">♥</div>

        <span class="support-label">ساهم في استمرار المشروع</span>

        <h2>ادعم البوابة</h2>

        <p>
          دعمكم يساعد على تطوير بوابة البحوث التاريخية،
          وإضافة مزيد من الكتب والوثائق والمصادر المجانية.
        </p>

        <button
          type="button"
          class="support-open-button"
          id="openSupport"
        >
          دعم البوابة عبر PayPal
          <span aria-hidden="true">♥</span>
        </button>
      </aside>

    </div>
  </section>

  <main class="main-wrap" id="articles">
    <section class="section-box">
      <div class="section-head">
        <div>
          <h2>الأبحاث والوثائق المنشورة</h2>
          <p>
            قائمة مختارة من المقالات والدراسات والوثائق الأرشيفية الخاصة بتاريخ المغرب.
          </p>
        </div>

        <div class="stats">
          <span class="stat-pill">9 روابط</span>
          <span class="stat-pill">محتوى تاريخي</span>
          <span class="stat-pill">تصميم حديث</span>
        </div>
      </div>

      <div class="links-grid">

        <article class="item">
          <div class="item-top">
            <div class="badges">
              <span class="badge new">جديد</span>
              <span class="badge kind">بحث تاريخي</span>
            </div>
          </div>

          <a
            class="title"
            href="https://mourabitoun.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            المرابطون ملوك المغرب: دراسة في المجال الجغرافي والأصل القبلي والهوية السياسية للدولة المرابطية
          </a>

          <p class="desc">
            دراسة موثقة في الأصل الصنهاجي للمرابطين، ومجالهم الجغرافي، وهويتهم السياسية
            باعتبارهم ملوك المغرب في نصوص المؤرخين والجغرافيين.
          </p>

          <div class="tag">
            موضوع: تاريخ المغرب، المرابطون، صنهاجة، المجال الجغرافي، الهوية السياسية
          </div>
        </article>

        <article class="item">
          <div class="item-top">
            <div class="badges">
              <span class="badge new">جديد</span>
              <span class="badge kind">وثائق دبلوماسية</span>
            </div>
          </div>

          <a
            class="title"
            href="https://treaties-england-morocco.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            المعاهدات المغربية البريطانية في عهد الدولة العلوية (1728–1751)
          </a>

          <p class="desc">
            عرض موثق لمعاهدات المغرب وبريطانيا في القرن الثامن عشر، مع إبراز البعد
            الدبلوماسي والتجاري والسيادي في الوثائق.
          </p>

          <div class="tag">
            موضوع: دبلوماسية، تجارة، سيادة، علاقات مغربية بريطانية
          </div>
        </article>

        <article class="item">
          <div class="item-top">
            <div class="badges">
              <span class="badge new">جديد</span>
              <span class="badge kind">حدود ووثائق</span>
            </div>
          </div>

          <a
            class="title"
            href="https://lalamaghnia.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            الحدود المغربية بين مراسلات سنة 1844 ومعاهدة للا مغنية سنة 1845
          </a>

          <p class="desc">
            ملف تاريخي يوثق تطور مسألة الحدود المغربية من خلال المراسلات الرسمية
            والنصوص الاتفاقية في القرن التاسع عشر.
          </p>

          <div class="tag">
            موضوع: حدود، تاريخ سياسي، وثائق استعمارية
          </div>
        </article>

        <article class="item">
          <div class="item-top">
            <div class="badges">
              <span class="badge new">جديد</span>
              <span class="badge kind">وثيقة أرشيفية</span>
            </div>
          </div>

          <a
            class="title"
            href="https://touat1.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            وثيقة فرنسية من سنة 1896 تعترف بسيادة المغرب على توات وكورارة وتيديكلت
          </a>

          <p class="desc">
            وثيقة أرشيفية فرنسية تُستعمل في دراسة المجال المغربي التاريخي
            وإثباتات السيادة على مناطق الصحراء الشرقية.
          </p>

          <div class="tag">
            موضوع: السيادة المغربية، توات، كورارة، تيديكلت، وثائق استعمارية
          </div>
        </article>

        <article class="item">
          <div class="item-top">
            <div class="badges">
              <span class="badge kind">مقال تاريخي</span>
            </div>
          </div>

          <a
            class="title"
            href="https://1963.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            الجزائر، صنيعة الاستعمار
          </a>

          <p class="desc">
            قراءة تاريخية في تشكل الكيان الجزائري الحديث وصلته بالإرث الاستعماري
            وترسيمات الحدود في المرحلة الاستعمارية.
          </p>

          <div class="tag">
            موضوع: تاريخ سياسي، استعمار، نزاع حدودي
          </div>
        </article>

        <article class="item">
          <div class="item-top">
            <div class="badges">
              <span class="badge kind">شخصيات</span>
            </div>
          </div>

          <a
            class="title"
            href="https://cadderdz.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            عبد القادر: من "بطل قومي" إلى حليف فرنسا
          </a>

          <p class="desc">
            مادة مخصصة لإعادة قراءة شخصية عبد القادر وعلاقته المعقدة بفرنسا
            في ضوء النصوص التاريخية والتحولات السياسية.
          </p>

          <div class="tag">
            موضوع: سير وشخصيات، الجزائر، فرنسا
          </div>
        </article>

        <article class="item">
          <div class="item-top">
            <div class="badges">
              <span class="badge kind">نزاع حدودي</span>
            </div>
          </div>

          <a
            class="title"
            href="https://guerredesables.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            الوثائق تتكلم: حقيقة حرب الرمال بين المغرب والجزائر (1963)
          </a>

          <p class="desc">
            ملف وثائقي حول حرب الرمال من خلال الوثائق والشهادات والقراءات
            المرتبطة بالحدود والسيادة.
          </p>

          <div class="tag">
            موضوع: حرب الرمال، حدود، المغرب، الجزائر
          </div>
        </article>

        <article class="item">
          <div class="item-top">
            <div class="badges">
              <span class="badge kind">دولة وسيادة</span>
            </div>
          </div>

          <a
            class="title"
            href="https://banihamad.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            الزيريون والحمّاديون بين التبعية والسيادة
          </a>

          <p class="desc">
            بحث في العلاقات السياسية بين الزيريين والحماديين وموقعهما من مفاهيم
            التبعية والسيادة في المغرب الإسلامي.
          </p>

          <div class="tag">
            موضوع: تاريخ وسياسة، المغرب الإسلامي
          </div>
        </article>

        <article class="item">
          <div class="item-top">
            <div class="badges">
              <span class="badge kind">فرنسا والجزائر</span>
            </div>
          </div>

          <a
            class="title"
            href="https://degaulle.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            شارل ديغول ودوره في الجزائر (1958–1967)
          </a>

          <p class="desc">
            دراسة موجزة في دور شارل ديغول في التحولات السياسية والعسكرية المرتبطة
            بالجزائر خلال أواخر الحقبة الاستعمارية.
          </p>

          <div class="tag">
            موضوع: فرنسا، الجزائر، استعمار، تاريخ معاصر
          </div>
        </article>

      </div>
    </section>
  </main>

  <footer class="footer">
    <strong>بوابة البحوث التاريخية والوثائق الأرشيفية</strong><br>
    موقع مخصص لتجميع البحوث والوثائق التاريخية المتعلقة بالمغرب.
  </footer>



  <!-- نافذة دعم البوابة عبر PayPal -->
  <div
    class="support-modal"
    id="supportModal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="supportModalTitle"
    aria-hidden="true"
  >
    <div class="support-modal-box">
      <button
        type="button"
        class="support-modal-close"
        id="closeSupport"
        aria-label="إغلاق نافذة الدعم"
      >
        ×
      </button>

      <div class="support-modal-heart" aria-hidden="true">♥</div>
      <h2 id="supportModalTitle">ادعم بوابة البحوث التاريخية</h2>
      <p>
        امسح رمز QR بهاتفك لإرسال دعم آمن عبر PayPal.
        مساهمتكم تساعد على استمرار نشر الكتب والوثائق والأبحاث.
      </p>

      <div class="support-qr-wrap">
        <img
          src="images/paypal-qr.png"
          alt="رمز QR للدعم عبر PayPal"
          class="support-qr"
        >
      </div>

      <p class="support-modal-note">الدفع مؤمّن بواسطة PayPal</p>
    </div>
  </div>

  <!-- Fenêtre Historio PDF -->
  <div
    class="historio-modal"
    id="historioModal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="historioModalTitle"
    aria-hidden="true"
  >
    <div class="historio-modal-window">

      <div class="historio-modal-header">
        <div class="historio-modal-title">
          <strong id="historioModalTitle">
            Historio PDF – محرك البحث التاريخي
          </strong>
          <span>ابحث في الكتب التاريخية والوثائق المجانية</span>
        </div>

        <div class="historio-modal-actions">
          <a
            href="https://histobook.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            class="historio-external-link"
          >
            فتح في صفحة مستقلة ↗
          </a>

          <button
            type="button"
            class="historio-close-button"
            id="closeHistorio"
            aria-label="إغلاق النافذة"
          >
            إغلاق ✕
          </button>
        </div>
      </div>

      <iframe
        id="historioFrame"
        class="historio-frame"
        title="Historio PDF"
        data-src="https://histobook.netlify.app/"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>

    </div>
  </div>

  <script>
    const openHistorioButton = document.getElementById("openHistorio");
    const closeHistorioButton = document.getElementById("closeHistorio");
    const historioModal = document.getElementById("historioModal");
    const historioFrame = document.getElementById("historioFrame");
    const openSupportButton = document.getElementById("openSupport");
    const closeSupportButton = document.getElementById("closeSupport");
    const supportModal = document.getElementById("supportModal");

    function openSupportModal() {
      supportModal.classList.add("is-open");
      supportModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeSupportButton.focus();
    }

    function closeSupportModal() {
      supportModal.classList.remove("is-open");
      supportModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      openSupportButton.focus();
    }

    openSupportButton.addEventListener("click", openSupportModal);
    closeSupportButton.addEventListener("click", closeSupportModal);

    supportModal.addEventListener("click", function (event) {
      if (event.target === supportModal) {
        closeSupportModal();
      }
    });


    function openHistorioModal() {
      if (!historioFrame.getAttribute("src")) {
        historioFrame.setAttribute("src", historioFrame.dataset.src);
      }

      historioModal.classList.add("is-open");
      historioModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeHistorioButton.focus();
    }

    function closeHistorioModal() {
      historioModal.classList.remove("is-open");
      historioModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      openHistorioButton.focus();
    }

    openHistorioButton.addEventListener("click", openHistorioModal);
    closeHistorioButton.addEventListener("click", closeHistorioModal);

    historioModal.addEventListener("click", function (event) {
      if (event.target === historioModal) {
        closeHistorioModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;

      if (historioModal.classList.contains("is-open")) {
        closeHistorioModal();
      }

      if (supportModal.classList.contains("is-open")) {
        closeSupportModal();
      }
    });
  </script>

</body>
</html>
