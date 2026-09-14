/*
 * Ayudas de consulta para las actividades HTML de latín.
 *
 * Agrega un botón flotante (📖) que abre, en un panel encima de la actividad,
 * el Diccionario de clase o las Fichas de morfología. La actividad nunca se
 * abandona: al cerrar el panel queda exactamente donde estaba.
 *
 * Uso: en la actividad, antes de </body>:
 *   <script src="../recursos/ayudas.js"></script>
 *
 * Detalles:
 * - Cada recurso se carga la primera vez que se abre y queda vivo, así una
 *   búsqueda en el diccionario sigue ahí la próxima vez que se abre el panel.
 * - El botón "atrás" del celular cierra el panel en vez de salir de la actividad.
 * - Dentro del panel se ocultan los enlaces "Volver al índice" de los recursos,
 *   y los enlaces internos de las fichas (#decl1, etc.) desplazan sin tocar el
 *   historial.
 */
(function () {
  "use strict";
  if (window.__ayudasLatin) return;
  window.__ayudasLatin = true;

  var RECURSOS = [
    { id: "dicc", label: "Diccionario", src: "../diccionario-de-clase/" },
    { id: "fichas", label: "Fichas de morfología", src: "../fichas-morfologia/" }
  ];

  var css = [
    ".ayu-fab{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:9000;",
    "width:46px;height:46px;border-radius:50%;border:1px solid var(--rule,#c9c4b3);",
    "background:var(--surface-raised,#fff);color:var(--ink,#1e211d);font-size:22px;line-height:1;",
    "box-shadow:0 2px 10px rgba(0,0,0,.18);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.92;}",
    ".ayu-fab:hover,.ayu-fab:focus-visible{opacity:1;outline:2px solid var(--accent,#1e4dc7);outline-offset:2px;}",
    ".ayu-sheet{position:fixed;inset:0;z-index:9001;display:flex;flex-direction:column;background:var(--bg,#e8e7dd);}",
    ".ayu-bar{display:flex;align-items:center;gap:6px;padding:8px 8px 8px 10px;padding-top:calc(8px + env(safe-area-inset-top));",
    "background:var(--surface,#f6f5ef);border-bottom:1px solid var(--rule,#c9c4b3);font-family:var(--sans,system-ui,sans-serif);}",
    ".ayu-tab{flex:0 1 auto;min-width:0;border:1px solid var(--rule,#c9c4b3);background:transparent;color:var(--ink,#1e211d);",
    "border-radius:999px;padding:.45rem .85rem;font-size:.9rem;font-weight:600;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    ".ayu-tab[aria-selected=true]{background:var(--accent,#1e4dc7);border-color:var(--accent,#1e4dc7);color:#fff;}",
    ".ayu-close{margin-left:auto;flex:0 0 auto;display:flex;align-items:center;gap:.3rem;border:0;background:var(--ink,#1e211d);",
    "color:var(--bg,#e8e7dd);border-radius:999px;padding:.45rem .8rem;font-size:.9rem;font-weight:600;cursor:pointer;white-space:nowrap;}",
    ".ayu-frames{position:relative;flex:1 1 auto;}",
    ".ayu-frames iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:var(--bg,#e8e7dd);}",
    ".ayu-fab[hidden],.ayu-sheet[hidden],.ayu-frames iframe[hidden]{display:none;}",
    "html.ayu-open,html.ayu-open body{overflow:hidden;}",
    "@media (max-width:420px){.ayu-close .ayu-close-txt{display:none;}.ayu-tab{padding:.45rem .7rem;font-size:.85rem;}}"
  ].join("");

  function init() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "ayu-fab";
    fab.setAttribute("aria-label", "Abrir diccionario y fichas de morfología");
    fab.title = "Diccionario y fichas";
    fab.textContent = "📖";

    var sheet = document.createElement("div");
    sheet.className = "ayu-sheet";
    sheet.hidden = true;
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "Consulta");

    var bar = document.createElement("div");
    bar.className = "ayu-bar";
    bar.setAttribute("role", "tablist");
    var frames = document.createElement("div");
    frames.className = "ayu-frames";

    var tabs = {}, iframes = {}, actual = null;

    RECURSOS.forEach(function (r) {
      var t = document.createElement("button");
      t.type = "button";
      t.className = "ayu-tab";
      t.setAttribute("role", "tab");
      t.textContent = r.label;
      t.addEventListener("click", function () { mostrar(r.id); });
      bar.appendChild(t);
      tabs[r.id] = t;
    });

    var cerrar = document.createElement("button");
    cerrar.type = "button";
    cerrar.className = "ayu-close";
    cerrar.setAttribute("aria-label", "Volver a la actividad");
    cerrar.innerHTML = '<span aria-hidden="true">✕</span><span class="ayu-close-txt">Volver a la actividad</span>';
    cerrar.addEventListener("click", function () { cerrarPanel(true); });
    bar.appendChild(cerrar);

    sheet.appendChild(bar);
    sheet.appendChild(frames);
    document.body.appendChild(fab);
    document.body.appendChild(sheet);

    function adaptarIframe(ifr) {
      try {
        var doc = ifr.contentDocument;
        if (!doc) return;
        var s = doc.createElement("style");
        s.textContent = ".back-to-index{display:none !important;}";
        doc.head.appendChild(s);
        // Enlaces internos (#...): desplazar sin agregar entradas al historial.
        doc.addEventListener("click", function (e) {
          var a = e.target.closest && e.target.closest("a[href]");
          if (!a) return;
          var href = a.getAttribute("href");
          if (href.charAt(0) === "#") {
            var dest = href.length > 1 && doc.getElementById(decodeURIComponent(href.slice(1)));
            e.preventDefault();
            if (dest) dest.scrollIntoView({ block: "start" });
          } else {
            // Cualquier otro enlace se abre fuera, para no perder la actividad.
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noopener");
          }
        });
      } catch (err) { /* otro origen: no se adapta */ }
    }

    function mostrar(id) {
      RECURSOS.forEach(function (r) {
        var sel = r.id === id;
        tabs[r.id].setAttribute("aria-selected", sel ? "true" : "false");
        if (sel && !iframes[r.id]) {
          var ifr = document.createElement("iframe");
          ifr.title = r.label;
          ifr.addEventListener("load", function () { adaptarIframe(ifr); });
          ifr.src = r.src;
          frames.appendChild(ifr);
          iframes[r.id] = ifr;
        }
        if (iframes[r.id]) iframes[r.id].hidden = !sel;
      });
      actual = id;
      try { localStorage.setItem("ayudas-latin-ultimo", id); } catch (e) {}
    }

    var abierto = false;
    function abrirPanel() {
      if (abierto) return;
      abierto = true;
      var ultimo = actual;
      if (!ultimo) { try { ultimo = localStorage.getItem("ayudas-latin-ultimo"); } catch (e) {} }
      if (!tabs[ultimo]) ultimo = RECURSOS[0].id;
      mostrar(ultimo);
      sheet.hidden = false;
      fab.hidden = true;
      document.documentElement.classList.add("ayu-open");
      try { history.pushState({ ayudasLatin: true }, ""); } catch (e) {}
      cerrar.focus();
    }
    function cerrarPanel(desdeBoton) {
      if (!abierto) return;
      abierto = false;
      sheet.hidden = true;
      fab.hidden = false;
      document.documentElement.classList.remove("ayu-open");
      if (desdeBoton && history.state && history.state.ayudasLatin) {
        try { history.back(); } catch (e) {}
      }
      fab.focus();
    }

    fab.addEventListener("click", abrirPanel);
    window.addEventListener("popstate", function () { cerrarPanel(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && abierto) cerrarPanel(true);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
