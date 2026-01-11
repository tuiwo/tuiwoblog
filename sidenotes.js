// sidenotes.js
(() => {
  const content = document.querySelector('#content') || document.body;
  const refs = Array.from(document.querySelectorAll('a.footref[href^="#fn."]'));
  const items = [];

  // 1) 为每个引用点创建一个边注 DOM
  for (const ref of refs) {
    const sup = ref.closest('sup') || ref;                 // 引用数字所在的 sup
    const targetId = ref.getAttribute('href')?.slice(1);   // "fn.1"
    if (!targetId) continue;

    const target = document.getElementById(targetId);      // <a id="fn.1" ...>
    if (!target) continue;

    const footdef = target.closest('.footdef');            // 脚注定义块
    if (!footdef) continue;

    const footpara = footdef.querySelector('.footpara');   // 你的脚注正文容器（含多段 p）
    if (!footpara) continue;

    const num = ref.textContent.trim();

    const aside = document.createElement('aside');
    aside.className = 'sidenote';
    aside.dataset.fn = num;

    const n = document.createElement('span');
    n.className = 'sidenote-number';
    n.textContent = num;
    aside.appendChild(n);

    // 克隆脚注内容（保留多段落）
    const cloned = footpara.cloneNode(true);

    // 去掉“返回正文”的 backlink（可选）
    cloned.querySelectorAll('a[role="doc-backlink"]').forEach(a => a.remove());

    aside.appendChild(cloned);

    // 先插入到 content，方便后面测量高度做防重叠
    content.appendChild(aside);

    items.push({ sup, aside });
  }

  // 2) 计算每条边注的 top，让它对齐引用位置，并做“防重叠”
  function layout() {
    const cRect = content.getBoundingClientRect();
    const gap = 12; // 边注之间最小间距

    // 先按引用点在文中的顺序排序
    const positioned = items
      .map(it => {
        const r = it.sup.getBoundingClientRect();
        return { ...it, top: r.top - cRect.top };
      })
      .sort((a, b) => a.top - b.top);

    // 依次向下推，避免重叠
    let lastBottom = -Infinity;
    for (const it of positioned) {
      let t = it.top;
      if (t < lastBottom + gap) t = lastBottom + gap;
      it.aside.style.top = `${t}px`;
      lastBottom = t + it.aside.offsetHeight;
    }
  }

  // 3) 触发时机：窗口 load（确保图片/字体/MathJax 影响布局的内容基本就绪）
  window.addEventListener('load', () => requestAnimationFrame(layout));
  window.addEventListener('resize', () => requestAnimationFrame(layout));

  // 4) 进一步稳：正文尺寸变化时重排（图片、MathJax、iframe 等导致 reflow）
  // 这种“内容加载后位置会偏”的坑很多实现都提到过，因此建议加上观察器。 [oai_citation:2‡fabian writes.](https://capnfabs.net/posts/margin-notes-hugo-theme/)
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => requestAnimationFrame(layout));
    ro.observe(content);
  }
})();
