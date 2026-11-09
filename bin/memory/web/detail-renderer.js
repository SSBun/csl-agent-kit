"use strict";

(() => {
  const markdown = typeof window.markdownit === "function" ? window.markdownit({ html: false, linkify: false, typographer: false }) : null;
  const safeLink = value => /^(https?:\/\/|mailto:)/i.test(value);
  if (markdown) {
    const validateLink = markdown.validateLink;
    markdown.validateLink = value => safeLink(value) && validateLink(value);
    markdown.renderer.rules.image = (tokens, index) => `<span class="markdown-image-note">[图片：${markdown.utils.escapeHtml(tokens[index].content || "未提供说明")}；未加载]</span>`;
  }

  function decorate(root) {
    for (const node of root.querySelectorAll("a[href]")) {
      if (!safeLink(node.getAttribute("href"))) node.removeAttribute("href");
      else { node.target = "_blank"; node.rel = "noopener noreferrer"; }
    }
    for (const node of root.querySelectorAll(".json-formatter-toggler-link")) {
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `展开或折叠 JSON：${node.textContent}`);
      node.setAttribute("aria-expanded", String(node.parentElement.classList.contains("json-formatter-open")));
    }
  }

  function jsonTree(value) {
    if (typeof window.JSONFormatter !== "function") throw new Error("JSON renderer unavailable");
    // The library reads object.constructor while lazily expanding descendants.
    // Reject shadowed constructors anywhere before attaching its click handlers;
    // preserve the complete original data in the existing plain-text fallback.
    const pending = [value];
    while (pending.length) {
      const node = pending.pop();
      if (node === null || typeof node !== "object") continue;
      if (Object.hasOwn(node, "constructor")) throw new Error("JSON constructor field requires plain-text rendering");
      for (const child of Object.values(node)) pending.push(child);
    }
    return new window.JSONFormatter(value, 1, {
      theme: "dark", animateOpen: false, animateClose: false,
      hoverPreviewEnabled: false, useToJSON: false, maxArrayItems: 100,
    }).render();
  }

  function renderMarkdown(value) {
    if (!markdown) throw new Error("Markdown renderer unavailable");
    const container = document.createElement("div"); container.className = "markdown-body";
    // Raw HTML is disabled, images become escaped labels, links use an explicit
    // protocol allowlist. Only the parser's escaped HTML reaches this sink.
    container.innerHTML = markdown.render(value);
    for (const code of container.querySelectorAll("pre > code.language-json")) {
      try {
        const block = document.createElement("div"); block.className = "json-code-block";
        block.append(jsonTree(JSON.parse(code.textContent)));
        code.parentElement.replaceWith(block);
      } catch { /* Invalid or unsupported JSON remains a complete, escaped code block. */ }
    }
    return container;
  }

  function render(target, value) {
    target.replaceChildren();
    try {
      if (typeof value !== "string") target.append(jsonTree(value));
      else {
        let parsed;
        try { if (/^\s*[\[{]/.test(value)) parsed = JSON.parse(value); } catch { /* Markdown or malformed JSON. */ }
        if (parsed !== undefined) target.append(jsonTree(parsed));
        else {
          const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(value);
          const memoryHeader = match && /^schema:\s*csl-memory\/v\d+\s*$/m.test(match[1]);
          target.append(renderMarkdown(memoryHeader ? match[2] : value));
          if (memoryHeader) {
            const metadata = document.createElement("details"); metadata.className = "file-metadata";
            const summary = document.createElement("summary"); summary.textContent = "文件元数据（YAML）";
            const source = document.createElement("pre"); source.textContent = match[1];
            metadata.append(summary, source); target.append(metadata);
          }
        }
      }
      decorate(target);
    } catch {
      target.replaceChildren();
      const warning = document.createElement("p"); warning.className = "render-warning";
      warning.textContent = "无法安全渲染此内容，以下显示原始内容。";
      const source = document.createElement("pre");
      source.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
      target.append(warning, source);
    }
  }

  const dialog = document.getElementById("detail-section");
  dialog.addEventListener("click", () => decorate(dialog));
  dialog.addEventListener("keydown", event => {
    const toggler = event.target.closest(".json-formatter-toggler-link");
    if (toggler && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault(); toggler.click();
    }
  });
  window.MemoryDetailRenderer = Object.freeze({ render });
})();
