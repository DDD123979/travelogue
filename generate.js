const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, SectionType, TableOfContents,
  PageBreak, TableLayoutType,
} = require("docx");
const fs = require("fs");

// ── GO-1 Graphite Orange palette (PRD) ──
const P = {
  bg: "1A2330", accent: "D4875A",
  titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078",
  table: { headerBg: "D4875A", headerText: "FFFFFF", innerLine: "DDD0C8", surface: "F8F0EB" },
  primary: "1A2330", body: "000000", secondary: "607080",
};

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const emptyPara = () => new Paragraph({ children: [] });

// ── Cover title layout helpers ──
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([...'\uff0c\u3002\u3001\uff1b\uff1a\uff01\uff1f', ...'\u7684\u4e0e\u548c\u53ca\u4e4b\u5728\u4e8e\u4e3a', ...'-_\u2014\u2013\u00b7/', ...' \t']);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / (pt * 20));
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) { lines = splitTitleLines(title, charsPerLine(minPt)); titlePt = minPt; }
  return { titlePt, titleLines: lines };
}

// ── Recipe R4: Top Color Block cover ──
function buildCoverR4(config) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 26);
  const titleSize = titlePt * 2;

  const titleBlockHeight = titleLines.length * (titlePt * 23 + 200);
  const englishLabelH = config.englishLabel ? (9 * 23 + 500) : 0;
  const subtitleH = config.subtitle ? (12 * 23 + 200) : 0;
  const upperContentH = englishLabelH + titleBlockHeight + subtitleH;
  const UPPER_H = Math.max(7500, upperContentH + 1500 + 800);
  const DIVIDER_H = 60;
  const spacerIntrinsic = 280;
  const topSpacing = Math.max(UPPER_H - upperContentH - spacerIntrinsic - 800, 400);

  const upperBlock = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: UPPER_H, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders,
        verticalAlign: "top",
        margins: { left: padL, right: padR },
        children: [
          new Paragraph({ spacing: { before: topSpacing } }),
          new Paragraph({
            spacing: { after: 500 },
            children: [new TextRun({ text: config.englishLabel.split("").join(" "),
              size: 18, color: P.accent, font: { ascii: "Calibri" }, characterSpacing: 60 })],
          }),
          ...titleLines.map((line, i) => new Paragraph({
            spacing: { after: i < titleLines.length - 1 ? 100 : 200, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
            children: [new TextRun({ text: line, size: titleSize, bold: true,
              color: P.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
          })),
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: config.subtitle, size: 24, color: P.subtitleColor,
              font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
          }),
        ],
      })],
    })],
  });

  const divider = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: DIVIDER_H, rule: "exact" },
      children: [new TableCell({ borders: noBorders,
        shading: { type: ShadingType.CLEAR, fill: P.accent }, children: [emptyPara()] })],
    })],
  });

  const lowerContent = [
    new Paragraph({ spacing: { before: 800 } }),
    ...config.metaLines.map(line => new Paragraph({
      indent: { left: padL }, spacing: { after: 100 },
      children: [new TextRun({ text: line, size: 28, color: P.metaColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    })),
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      indent: { left: padL },
      children: [
        new TextRun({ text: config.footerLeft, size: 22, color: "909090" }),
        new TextRun({ text: "          " }),
        new TextRun({ text: config.footerRight, size: 22, color: "909090" }),
      ],
    }),
  ];

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "FFFFFF" }, borders: noBorders,
        verticalAlign: "top",
        children: [upperBlock, divider, ...lowerContent],
      })],
    })],
  })];
}

// ── Body builders ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: P.primary, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: P.primary, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 420 },
    spacing: { line: 312, after: opts.after || 80 },
    children: [new TextRun({ text, size: 24, color: P.body })],
  });
}
function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 60 },
    children: [new TextRun({ text, size: 24, color: P.body })],
  });
}
function caption(text) {
  return new Paragraph({
    keepNext: true, spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 21, color: P.secondary })],
  });
}
function makeTable(headers, rows, widths) {
  const cell = (text, isHeader, w, i) => new TableCell({
    children: [new Paragraph({
      spacing: { line: 280 },
      children: [new TextRun({ text, bold: isHeader, size: 21,
        color: isHeader ? P.table.headerText : P.body })],
    })],
    shading: isHeader
      ? { type: ShadingType.CLEAR, fill: P.table.headerBg }
      : (i % 2 === 0 ? { type: ShadingType.CLEAR, fill: P.table.surface } : { type: ShadingType.CLEAR, fill: "FFFFFF" }),
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    width: { size: w, type: WidthType.PERCENTAGE },
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.accent },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.accent },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true,
        children: headers.map((t, j) => cell(t, true, widths[j], 0)) }),
      ...rows.map((r, i) => new TableRow({ cantSplit: true,
        children: r.map((t, j) => cell(t, false, widths[j], i)) })),
    ],
  });
}
const pageNumFooter = () => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" })],
  })],
});
const docHeader = () => new Header({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine, space: 4 } },
    children: [new TextRun({ text: "\u65c5\u6e38\u51fa\u884c App \u4ea7\u54c1\u9700\u6c42\u6587\u6863 (PRD) V1.0", size: 18, color: "888888" })],
  })],
});

// ═══════════ BODY CONTENT ═══════════
const bodyChildren = [];

// 1 引言
bodyChildren.push(h1("1. \u5f15\u8a00"));
bodyChildren.push(h2("1.1 \u7f16\u5199\u76ee\u7684"));
bodyChildren.push(body("\u672c\u6587\u6863\u65e8\u5728\u5168\u9762\u9610\u8ff0\u300c\u6e38\u8ff9\u300d\u65c5\u6e38\u51fa\u884c App \u7684\u4ea7\u54c1\u9700\u6c42\uff0c\u660e\u786e\u4ea7\u54c1\u5b9a\u4f4d\u3001\u76ee\u6807\u7528\u6237\u3001\u529f\u80fd\u8303\u56f4\u3001\u975e\u529f\u80fd\u6027\u8981\u6c42\u53ca\u9a8c\u6536\u6807\u51c6\uff0c\u4f5c\u4e3a\u4ea7\u54c1\u3001\u8bbe\u8ba1\u3001\u5f00\u53d1\u3001\u6d4b\u8bd5\u53ca\u8fd0\u8425\u56e2\u961f\u6c9f\u901a\u534f\u4f5c\u7684\u57fa\u51c6\u4f9d\u636e\u3002"));
bodyChildren.push(h2("1.2 \u9879\u76ee\u80cc\u666f"));
bodyChildren.push(body("\u968f\u7740\u4eba\u4eec\u751f\u6d3b\u6c34\u5e73\u63d0\u5347\u4e0e\u4e2a\u6027\u5316\u51fa\u884c\u9700\u6c42\u589e\u957f\uff0c\u4f20\u7edf OTA \u5e73\u53f0\u4ee5\u673a\u7968\u9152\u5e97\u9884\u8ba2\u4e3a\u6838\u5fc3\uff0c\u666e\u904d\u7f3a\u4e4f\u4e00\u7ad9\u5f0f\u884c\u7a0b\u89c4\u5212\u3001\u76ee\u7684\u5730\u7075\u611f\u53d1\u73b0\u4e0e\u771f\u5b9e\u653b\u7565\u5185\u5bb9\u7684\u6df1\u5ea6\u6574\u5408\u3002\u672c\u4ea7\u54c1\u81f4\u529b\u4e8e\u5c06\u300c\u53d1\u73b0\u7075\u611f \u2192 \u89c4\u5212\u884c\u7a0b \u2192 \u9884\u8ba2\u4ea4\u6613 \u2192 \u884c\u4e2d\u670d\u52a1 \u2192 \u6e38\u540e\u5206\u4eab\u300d\u5168\u94fe\u8def\u95ed\u73af\uff0c\u4e3a\u7528\u6237\u63d0\u4f9b\u4e00\u7ad9\u5f0f\u65c5\u6e38\u670d\u52a1\u4f53\u9a8c\u3002"));
bodyChildren.push(h2("1.3 \u672f\u8bed\u4e0e\u7f29\u7565\u8bed"));
bodyChildren.push(caption("\u8868 1-1 \u672f\u8bed\u5b9a\u4e49\u8868"));
bodyChildren.push(makeTable(
  ["\u672f\u8bed", "\u8bf4\u660e"],
  [
    ["PRD", "\u4ea7\u54c1\u9700\u6c42\u6587\u6863\uff08Product Requirements Document\uff09"],
    ["POI", "\u5174\u8da3\u70b9\uff08Point of Interest\uff09\uff0c\u5982\u666f\u70b9\u3001\u9910\u5385\u3001\u9152\u5e97"],
    ["UGC / PGC", "\u7528\u6237\u751f\u4ea7\u5185\u5bb9 / \u4e13\u4e1a\u751f\u4ea7\u5185\u5bb9"],
    ["OTA", "\u5728\u7ebf\u65c5\u884c\u793e\uff08Online Travel Agency\uff09"],
    ["MVP", "\u6700\u5c0f\u53ef\u884c\u4ea7\u54c1\uff08Minimum Viable Product\uff09"],
  ],
  [25, 75]
));
bodyChildren.push(h2("1.4 \u76ee\u6807\u8bfb\u8005"));
bodyChildren.push(body("\u672c\u6587\u6863\u7684\u8bfb\u8005\u5305\u62ec\uff1a\u4ea7\u54c1\u7ecf\u7406\u3001UI/UX \u8bbe\u8ba1\u5e08\u3001\u5f00\u53d1\u5de5\u7a0b\u5e08\u3001\u6d4b\u8bd5\u5de5\u7a0b\u5e08\u3001\u8fd0\u8425\u4e0e\u5e02\u573a\u4eba\u5458\u3002\u5404\u89d2\u8272\u5e94\u6839\u636e\u81ea\u8eab\u804c\u8d23\u5173\u6ce8\u5bf9\u5e94\u7ae0\u8282\uff0c\u9700\u6c42\u53d8\u66f4\u9700\u8d70\u7edf\u4e00\u7684\u53d8\u66f4\u7ba1\u7406\u6d41\u7a0b\u3002"));

// 2 产品概述
bodyChildren.push(h1("2. \u4ea7\u54c1\u6982\u8ff0"));
bodyChildren.push(h2("2.1 \u4ea7\u54c1\u5b9a\u4f4d"));
bodyChildren.push(body("\u300c\u6e38\u8ff9\u300d\u662f\u4e00\u6b3e\u9762\u5411\u5927\u4f17\u51fa\u884c\u7528\u6237\u7684\u7efc\u5408\u6027\u65c5\u6e38\u670d\u52a1 App\uff0c\u4ee5\u300c\u667a\u80fd\u884c\u7a0b\u89c4\u5212 + \u76ee\u7684\u5730\u5185\u5bb9\u793e\u533a + \u4ea4\u901a\u4f4f\u5bb9\u9884\u8ba2\u300d\u4e3a\u4e09\u5927\u652f\u67f1\uff0c\u5dee\u5f02\u5316\u5b9a\u4f4d\u4e8e\u300c\u4f1a\u89c4\u5212\u884c\u7a0b\u7684\u65c5\u884c\u52a9\u624b\u300d\u3002"));
bodyChildren.push(h2("2.2 \u76ee\u6807\u7528\u6237"));
bodyChildren.push(caption("\u8868 2-1 \u76ee\u6807\u7528\u6237\u753b\u50cf"));
bodyChildren.push(makeTable(
  ["\u7528\u6237\u7fa4\u4f53", "\u7279\u5f81", "\u6838\u5fc3\u9700\u6c42"],
  [
    ["\u5e74\u8f7b\u81ea\u7531\u884c\u7528\u6237\uff0820\u201335 \u5c81\uff09", "\u8ffd\u6c42\u6027\u4ef7\u6bd4\u4e0e\u4e2a\u6027\u5316\u8def\u7ebf\uff0c\u719f\u6089\u79fb\u52a8\u4e92\u8054\u7f51", "\u653b\u7565\u53c2\u8003\u3001\u884c\u7a0b\u89c4\u5212\u3001\u4f4e\u4ef7\u9884\u8ba2"],
    ["\u5bb6\u5ead\u4eb2\u5b50\u6e38\u5ba2\uff0828\u201345 \u5c81\uff09", "\u5173\u6ce8\u8212\u9002\u5ea6\u4e0e\u5b89\u5168\u6027\uff0c\u65f6\u95f4\u7d27\u4e0d\u60f3\u505a\u653b\u7565", "\u4e00\u7ad9\u5f0f\u81ea\u7531\u884c\u5957\u9910\u3001\u5ba2\u670d\u534f\u52a9"],
    ["\u4e2d\u8001\u5e74\u8ddf\u56e2\u6e38\u5ba2\uff0845 \u5c81\u4ee5\u4e0a\uff09", "\u64cd\u4f5c\u4e60\u60ef\u504f\u7b80\u5355\uff0c\u4fe1\u4efb\u5e73\u53f0\u9884\u8ba2", "\u5927\u5b57\u53f7\u754c\u9762\u3001\u7535\u8bdd\u5ba2\u670d\u3001\u8ddf\u56e2\u4ea7\u54c1"],
    ["\u5185\u5bb9\u521b\u4f5c\u8005", "\u65c5\u884c\u8fbe\u4eba / \u653b\u7565\u4f5c\u8005\uff0c\u613f\u610f\u5206\u4eab\u4e0e\u53d8\u73b0", "\u521b\u4f5c\u5de5\u5177\u3001\u6d41\u91cf\u6fc0\u52b1\u3001\u5546\u4e1a\u5316\u901a\u9053"],
  ],
  [28, 36, 36]
));
bodyChildren.push(h2("2.3 \u6838\u5fc3\u4ef7\u503c\u4e3b\u4e3b\u5f20"));
bodyChildren.push(bullet("AI \u667a\u80fd\u884c\u7a0b\u89c4\u5212\uff1a\u8f93\u5165\u5929\u6570\u3001\u9884\u7b97\u3001\u504f\u597d\uff0c\u4e00\u952e\u751f\u6210\u53ef\u7f16\u8f91\u7684\u9010\u65e5\u884c\u7a0b\u3002"));
bodyChildren.push(bullet("\u771f\u5b9e\u653b\u7565\u793e\u533a\uff1a\u57fa\u4e8e\u771f\u5b9e\u884c\u7a0b\u7684 UGC \u7b14\u8bb0\u4e0e\u8bc4\u5206\uff0c\u964d\u4f4e\u51b3\u7b56\u6210\u672c\u3002"));
bodyChildren.push(bullet("\u4e00\u7ad9\u5f0f\u9884\u8ba2\uff1a\u673a\u7968\u3001\u9152\u5e97\u3001\u666f\u70b9\u95e8\u7968\u3001\u5f53\u5730\u73a9\u4e50\u7edf\u4e00\u4e0b\u5355\uff0c\u884c\u7a0b\u81ea\u52a8\u5173\u8054\u8ba2\u5355\u3002"));
bodyChildren.push(bullet("\u884c\u4e2d\u670d\u52a1\uff1a\u79bb\u7ebf\u5730\u56fe\u3001\u5b9e\u65f6\u884c\u7a0b\u63d0\u9192\u3001\u7d27\u6025\u5ba2\u670d\u4e0e\u65c5\u884c\u4fdd\u969c\u5165\u53e3\u3002"));
bodyChildren.push(h2("2.4 \u7ade\u54c1\u7b80\u6790"));
bodyChildren.push(caption("\u8868 2-2 \u4e3b\u8981\u7ade\u54c1\u5bf9\u6bd4"));
bodyChildren.push(makeTable(
  ["\u7ef4\u5ea6", "\u6e38\u8ff9\uff08\u672c\u4ea7\u54c1\uff09", "\u7ade\u54c1 A\uff08\u4f20\u7edf OTA\uff09", "\u7ade\u54c1 B\uff08\u5185\u5bb9\u793e\u533a\uff09"],
  [
    ["\u884c\u7a0b\u89c4\u5212", "AI \u81ea\u52a8\u751f\u6210 + \u624b\u52a8\u7f16\u8f91", "\u65e0\u6df1\u5ea6\u89c4\u5212\u80fd\u529b", "\u4ec5\u653b\u7565\u53c2\u8003"],
    ["\u9884\u8ba2\u4ea4\u6613", "\u673a\u9152\u666f + \u672c\u5730\u73a9\u4e50", "\u5f3a\uff0c\u4e3b\u4e1a\u52a1", "\u5f15\u5bfc\u81f3\u7b2c\u4e09\u65b9\uff0c\u4f53\u9a8c\u5272\u88c2"],
    ["\u5185\u5bb9\u793e\u533a", "\u771f\u5b9e\u884c\u7a0b\u7b14\u8bb0", "\u4ee5\u5546\u54c1\u5316\u5185\u5bb9\u4e3a\u4e3b", "\u5f3a\uff0c\u4f46\u5546\u4e1a\u95ed\u73af\u5f31"],
    ["\u4f4e\u7ebf\u57ce\u5e02\u8986\u76d6", "\u91cd\u70b9\u6295\u5165\u4e09\u7ebf\u53ca\u4ee5\u4e0b\u57ce\u5e02 POI", "\u8986\u76d6\u4e00\u4e8c\u7ebf\u4e3a\u4e3b", "\u8986\u76d6\u4e00\u4e8c\u7ebf\u4e3a\u4e3b"],
  ],
  [20, 28, 26, 26]
));

// 3 用户角色与场景
bodyChildren.push(h1("3. \u7528\u6237\u89d2\u8272\u4e0e\u4f7f\u7528\u573a\u666f"));
bodyChildren.push(h2("3.1 \u7528\u6237\u89d2\u8272"));
bodyChildren.push(bullet("\u666e\u901a\u7528\u6237\uff1a\u6d4f\u89c8\u5185\u5bb9\u3001\u89c4\u5212\u884c\u7a0b\u3001\u4e0b\u5355\u9884\u8ba2\u3001\u53d1\u5e03\u7b14\u8bb0\u3002"));
bodyChildren.push(bullet("\u5185\u5bb9\u521b\u4f5c\u8005\uff1a\u53d1\u5e03\u4ed8\u8d39\u653b\u7565\u3001\u63a5\u53d7\u54a8\u8be2\u3001\u53c2\u4e0e\u5206\u6da8\u6fc0\u52b1\u3002"));
bodyChildren.push(bullet("\u5546\u5bb6\uff1a\u7ba1\u7406\u4ea7\u54c1\u5e93\u5b58\u4e0e\u4ef7\u683c\u3001\u5904\u7406\u8ba2\u5355\u4e0e\u9a8c\u5355\u3002"));
bodyChildren.push(bullet("\u5e73\u53f0\u7ba1\u7406\u5458\uff1a\u5185\u5bb9\u5ba1\u6838\u3001\u5546\u5bb6\u5165\u9a7b\u5ba1\u6279\u3001\u8ba2\u5355\u552e\u540e\u3001\u6570\u636e\u76d1\u63a7\u3002"));
bodyChildren.push(h2("3.2 \u5178\u578b\u4f7f\u7528\u573a\u666f"));
bodyChildren.push(body("\u573a\u666f\u4e00\uff08\u884c\u524d\uff09\uff1a\u5c0f\u674e\u8ba1\u5212\u4e94\u4e00\u53bb\u6210\u90fd\u73a9\u4e09\u5929\uff0c\u9884\u7b97 3000 \u5143\u3001\u559c\u6b22\u7f8e\u98df\u4e0e\u5c0f\u4f17\u666f\u70b9\u3002\u5979\u5728 App \u9996\u9875\u8f93\u5165\u504f\u597d\uff0c\u7cfb\u7edf\u751f\u6210\u9010\u65e5\u884c\u7a0b\uff0c\u5e76\u4e00\u952e\u52a0\u5165\u9152\u5e97\u4e0e\u666f\u70b9\u95e8\u7968\u81f3\u8ba2\u5355\u3002"));
bodyChildren.push(body("\u573a\u666f\u4e8c\uff08\u884c\u4e2d\uff09\uff1a\u738b\u5148\u751f\u5728\u5c71\u533a\u65e0\u7f51\u7edc\u73af\u5883\u4e0b\u6253\u5f00\u79bb\u7ebf\u5730\u56fe\u4e0e\u884c\u7a0b\uff0c\u67e5\u770b\u5f53\u65e5\u5b89\u6392\u4e0e\u5bfc\u822a\u8def\u7ebf\uff0c\u5ef6\u8bef\u98ce\u9669\u65f6\u4e00\u952e\u8054\u7cfb\u7d27\u6025\u5ba2\u670d\u3002"));
bodyChildren.push(body("\u573a\u666f\u4e09\uff08\u884c\u540e\uff09\uff1a\u5c0f\u5f20\u65c5\u884c\u7ed3\u675f\u540e\u5c06\u884c\u7a0b\u7b14\u8bb0\u4e00\u952e\u8f6c\u4e3a\u653b\u7565\u53d1\u5e03\uff0c\u83b7\u5f97\u5e73\u53f0\u6d41\u91cf\u6fc0\u52b1\u4e0e\u6536\u76ca\u5206\u6210\uff0c\u540e\u7eed\u7528\u6237\u53ef\u6309\u5176\u884c\u7a0b\u4e00\u952e\u540c\u6b3e\u590d\u523b\u3002"));

// 4 功能需求
bodyChildren.push(h1("4. \u529f\u80fd\u9700\u6c42"));
bodyChildren.push(h2("4.1 \u529f\u80fd\u67b6\u6784\u603b\u89c8"));
bodyChildren.push(body("\u4ea7\u54c1\u529f\u80fd\u5206\u4e3a\u7528\u6237\u7aef\u4e0e\u7ba1\u7406\u7aef\u4e24\u5927\u677f\u5757\u3002\u7528\u6237\u7aef\u5305\u62ec\u8d26\u53f7\u3001\u5185\u5bb9\u53d1\u73b0\u3001\u884c\u7a0b\u89c4\u5212\u3001\u9884\u8ba2\u4ea4\u6613\u3001\u793e\u533a\u3001\u884c\u4e2d\u670d\u52a1\u4e03\u5927\u6a21\u5757\uff1b\u7ba1\u7406\u7aef\u5305\u62ec\u5185\u5bb9\u7ba1\u7406\u3001\u5546\u5bb6\u7ba1\u7406\u3001\u8ba2\u5355\u7ba1\u7406\u3001\u7528\u6237\u7ba1\u7406\u3001\u6570\u636e\u7edf\u8ba1\u4e94\u5927\u6a21\u5757\u3002"));
bodyChildren.push(h2("4.2 \u7528\u6237\u7aef\u529f\u80fd\u9700\u6c42\u6e05\u5355"));
bodyChildren.push(caption("\u8868 4-1 \u7528\u6237\u7aef\u529f\u80fd\u6e05\u5355\uff08MVP \u4f18\u5148\u7ea7\uff1aP0 \u5fc5\u987b / P1 \u91cd\u8981 / P2 \u53ef\u5ef6\u540e\uff09"));
bodyChildren.push(makeTable(
  ["\u6a21\u5757", "\u529f\u80fd\u70b9", "\u63cf\u8ff0", "\u4f18\u5148\u7ea7"],
  [
    ["\u8d26\u53f7", "\u6ce8\u518c\u767b\u5f55", "\u624b\u673a\u53f7 + \u9a8c\u8bc1\u7801\uff1b\u652f\u6301\u5fae\u4fe1 / \u82f9\u679c\u4e00\u952e\u767b\u5f55", "P0"],
    ["\u8d26\u53f7", "\u4e2a\u4eba\u4e2d\u5fc3", "\u8d44\u6599\u7f16\u8f91\u3001\u5e38\u65c5\u884c\u57ce\u5e02\u8bbe\u7f6e\u3001\u9690\u79c1\u8bbe\u7f6e", "P0"],
    ["\u53d1\u73b0", "\u9996\u9875 Feed", "\u4e2a\u6027\u5316\u63a8\u8350\u76ee\u7684\u5730\u5185\u5bb9\uff0c\u652f\u6301\u57ce\u5e02 / \u4e3b\u9898 / \u8ddd\u79bb\u7b5b\u9009", "P0"],
    ["\u53d1\u73b0", "\u76ee\u7684\u5730\u8be6\u60c5\u9875", "POI \u5217\u8868\u3001\u5b63\u8282\u63a8\u8350\u3001\u4ea4\u901a\u4e0e\u5929\u6c14\u6982\u51b5", "P0"],
    ["\u884c\u7a0b", "AI \u884c\u7a0b\u751f\u6210", "\u8f93\u5165\u5929\u6570 / \u9884\u7b97 / \u504f\u597d\uff0c\u751f\u6210\u9010\u65e5\u884c\u7a0b\u8349\u7a3f", "P0"],
    ["\u884c\u7a0b", "\u884c\u7a0b\u7f16\u8f91\u5668", "\u62d6\u62fd\u6392\u5e8f\u3001POI \u66f4\u6362\u3001\u884c\u7a0b\u5206\u4eab\u4e0e\u534f\u4f5c\u7f16\u8f91", "P0"],
    ["\u9884\u8ba2", "\u673a\u7968 / \u706b\u8f66\u7968", "\u8bd5\u7b97\u3001\u9501\u4ef7\u3001\u9000\u6539\u7b7e\u89c4\u5219\u5c55\u793a", "P0"],
    ["\u9884\u8ba2", "\u9152\u5e97 / \u6c11\u5bbf", "\u65e5\u5386\u9009\u62e9\u3001\u4ef7\u683c\u7b5b\u9009\u3001\u5730\u56fe\u627e\u623f", "P0"],
    ["\u9884\u8ba2", "\u666f\u70b9\u95e8\u7968 / \u672c\u5730\u73a9\u4e50", "\u7535\u5b50\u51ed\u8bc1\u6838\u9500\uff0c\u884c\u7a0b\u81ea\u52a8\u5173\u8054", "P1"],
    ["\u8ba2\u5355", "\u8ba2\u5355\u4e2d\u5fc3", "\u7edf\u4e00\u8ba2\u5355\u5217\u8868\u3001\u652f\u4ed8\u3001\u53d6\u6d88 / \u9000\u6b3e\u3001\u53d1\u7968\u7533\u8bf7", "P0"],
    ["\u793e\u533a", "\u7b14\u8bb0\u4e0e\u653b\u7565", "\u56fe\u6587\u89c6\u9891\u53d1\u5e03\u3001\u6807\u7b7e\u3001\u70b9\u8d5e\u8bc4\u8bba\u6536\u85cf", "P1"],
    ["\u793e\u533a", "\u884c\u7a0b\u540c\u6b3e\u590d\u523b", "\u4e00\u952e\u590d\u5236\u4ed6\u4eba\u516c\u5f00\u884c\u7a0b\u5e76\u8f6c\u5165\u81ea\u5df1\u7684\u8ba2\u5355", "P2"],
    ["\u670d\u52a1", "\u79bb\u7ebf\u5730\u56fe", "\u57ce\u5e02\u5730\u56fe\u4e0b\u8f7d\uff0c\u79bb\u7ebf\u5bfc\u822a\u4e0e POI \u67e5\u770b", "P1"],
    ["\u670d\u52a1", "\u6d88\u606f\u4e0e\u63d0\u9192", "\u884c\u7a0b\u63d0\u9192\u3001\u51fa\u884c\u53d8\u66f4\u901a\u77e5\u3001\u4fc3\u9500\u63a8\u9001", "P0"],
    ["\u670d\u52a1", "\u7d27\u6025\u5ba2\u670d", "7\u00d724 \u5c0f\u65f6\u5165\u53e3\uff0c\u884c\u7a0b\u5f02\u5e38\u4e00\u952e\u6c42\u52a9", "P1"],
  ],
  [12, 22, 52, 14]
));
bodyChildren.push(h2("4.3 \u7ba1\u7406\u7aef\u529f\u80fd\u9700\u6c42\u6e05\u5355"));
bodyChildren.push(caption("\u8868 4-2 \u7ba1\u7406\u7aef\u529f\u80fd\u6e05\u5355"));
bodyChildren.push(makeTable(
  ["\u6a21\u5757", "\u529f\u80fd\u70b9", "\u4f18\u5148\u7ea7"],
  [
    ["\u5185\u5bb9\u7ba1\u7406", "\u7b14\u8bb0 / \u653b\u7565\u5ba1\u6838\u3001\u8fdd\u89c4\u5185\u5bb9\u4e0b\u67b6\u3001\u70ed\u8bcd\u8fd0\u8425", "P0"],
    ["\u5546\u5bb6\u7ba1\u7406", "\u5165\u9a7b\u5ba1\u6279\u3001\u4ea7\u54c1\u4e0e\u5e93\u5b58\u7ba1\u7406\u3001\u4ef7\u683c\u5ba1\u6838", "P0"],
    ["\u8ba2\u5355\u7ba1\u7406", "\u8ba2\u5355\u67e5\u8be2\u3001\u9000\u6539\u5ba1\u6279\u3001\u552e\u540e\u5de5\u5355\u3001\u7ed3\u7b97\u5bf9\u8d26", "P0"],
    ["\u7528\u6237\u7ba1\u7406", "\u7528\u6237\u67e5\u8be2\u3001\u98ce\u63a7\u5904\u7f6a\u3001\u9ed1\u540d\u5355\u7ba1\u7406", "P0"],
    ["\u6570\u636e\u7edf\u8ba1", "\u6d41\u91cf\u3001\u8f6c\u5316\u7387\u3001GMV\u3001\u590d\u8d2d\u7387\u770b\u677f\uff1b\u5185\u5bb9\u70ed\u5ea6\u5206\u6790", "P1"],
  ],
  [22, 64, 14]
));
bodyChildren.push(h2("4.4 \u5173\u952e\u4e1a\u52a1\u6d41\u7a0b"));
bodyChildren.push(body("\u9884\u8ba2\u4e3b\u6d41\u7a0b\uff1a\u641c\u7d22 / \u6d4f\u89c8\u4ea7\u54c1 \u2192 \u8be6\u60c5\u9875\uff08\u9000\u6539\u7b7e\u3001\u8d39\u7528\u660e\u7ec6\uff09\u2192 \u586b\u5199 / \u9009\u62e9\u4e58\u4eba \u2192 \u521b\u5efa\u8ba2\u5355 \u2192 \u652f\u4ed8\uff08\u5fae\u4fe1 / \u652f\u4ed8\u5b9d / \u4e91\u95ea\u4ed8\uff09\u2192 \u9501\u5355\u786e\u8ba4 \u2192 \u51ed\u8bc1\u4f7f\u7528 / \u6838\u9500 \u2192 \u8bc4\u4ef7\u3002\u5173\u952e\u7ea6\u675f\uff1a\u4e0b\u5355\u540e 30 \u5206\u949f\u672a\u652f\u4ed8\u81ea\u52a8\u5173\u5355\uff1b\u9000\u6539\u7b7e\u89c4\u5219\u5fc5\u987b\u5728\u8be6\u60c5\u9875\u4e0e\u4e0b\u5355\u524d\u4e8c\u6b21\u786e\u8ba4\u3002"));
bodyChildren.push(body("\u9000\u6b3e\u4e3b\u6d41\u7a0b\uff1a\u7528\u6237\u7533\u8bf7 \u2192 \u7cfb\u7edf\u6839\u636e\u9000\u6539\u7b56\u7565\u81ea\u52a8\u5ba1\u6838 \u2192\uff08\u8d85\u989d / \u4e89\u8bae\uff09\u4eba\u5de5\u4ecb\u5165 \u2192 \u5546\u5bb6 / \u4f9b\u5e94\u5546\u786e\u8ba4 \u2192 \u539f\u8def\u5f84\u9000\u6b3e \u2192 \u7ed3\u679c\u901a\u77e5\u3002\u5168\u6d41\u7a0b\u7ea6\u5b9a\u65f6\u6548\uff1a\u81ea\u52a8\u5ba1\u6838 2 \u5c0f\u65f6\u5185\uff0c\u4eba\u5de5\u4ecb\u5165 24 \u5c0f\u65f6\u5185\u54cd\u5e94\u3002"));

// 5 非功能需求
bodyChildren.push(h1("5. \u975e\u529f\u80fd\u6027\u9700\u6c42"));
bodyChildren.push(caption("\u8868 5-1 \u975e\u529f\u80fd\u6027\u6307\u6807"));
bodyChildren.push(makeTable(
  ["\u7c7b\u522b", "\u6307\u6807\u8981\u6c42"],
  [
    ["\u6027\u80fd", "\u9996\u9875\u6253\u5f00\u81f3\u53ef\u4ea4\u4e92 \u2264 2s\uff1b\u641c\u7d22\u7ed3\u679c \u2264 1s\uff1b\u652f\u4ed8\u4e0b\u5355\u63a5\u53e3 \u2264 800ms\uff1b\u652f\u6301\u5cf0\u503c 5 \u4e07 QPS"],
    ["\u5b89\u5168", "\u5bc6\u7801\u4e0d\u53ef\u9006\u52a0\u5bc6\u5b58\u50a8\uff1b\u652f\u4ed8\u9075\u5faa PCI-DSS\uff1b\u654f\u611f\u6570\u636e\u4f20\u8f93\u5168\u7ad9 TLS 1.3\uff1b\u7b49\u4fdd\u4e09\u7ea7\u6743\u9650\u63a7\u5236"],
    ["\u517c\u5bb9\u6027", "iOS 14+ / Android 8.0+\uff1b\u4e3b\u6d41\u673a\u578b\u8986\u76d6\u7387 \u2265 95%\uff1b\u9002\u914d\u6df1\u8272\u6a21\u5f0f\u4e0e\u5927\u5b57\u53f7\u6a21\u5f0f"],
    ["\u53ef\u7528\u6027", "\u6838\u5fc3\u670d\u52a1\u53ef\u7528\u6027 \u2265 99.9%\uff1b\u964d\u7ea7\u9884\u6848\u4fdd\u969c\u9884\u8ba2\u4e0e\u652f\u4ed8\u4e3b\u94fe\u8def"],
    ["\u5408\u89c4", "\u7b26\u5408\u4e2a\u4eba\u4fe1\u606f\u4fdd\u62a4\u6cd5\u53ca\u65c5\u6e38\u6cd5\u89c4\u76f8\u5173\u8981\u6c42\uff1b\u7528\u6237\u534f\u8bae\u3001\u9690\u79c1\u653f\u7b56\u3001\u8425\u4e1a\u6267\u7167\u4fe1\u606f\u5b8c\u6574\u5c55\u793a"],
    ["\u65e0\u969c\u788d", "\u9075\u5faa WCAG 2.1 AA\uff1b\u56fe\u7247\u63d0\u4f9b alt \u6587\u672c\uff1b\u5173\u952e\u64cd\u4f5c\u652f\u6301\u5927\u6309\u94ae\u4e0e\u8bed\u97f3\u63d0\u793a"],
  ],
  [16, 84]
));

// 6 数据与接口
bodyChildren.push(h1("6. \u6570\u636e\u4e0e\u63a5\u53e3\u9700\u6c42"));
bodyChildren.push(h2("6.1 \u6838\u5fc3\u6570\u636e\u5b9e\u4f53"));
bodyChildren.push(bullet("\u7528\u6237\uff08\u8d26\u53f7\u3001\u504f\u597d\u3001\u5b9e\u540d\u4fe1\u606f\uff09\u3001POI\uff08\u5730\u7406\u3001\u5206\u7c7b\u3001\u8bc4\u5206\u3001\u8425\u4e1a\u65f6\u95f4\uff09\u3001\u884c\u7a0b\uff08\u5929\u6570\u3001\u9010\u65e5\u8282\u70b9\u3001\u6210\u5458\u6743\u9650\uff09\u3002"));
bodyChildren.push(bullet("\u4ea7\u54c1 SKU\uff08\u673a\u7968\u822a\u6bb5\u3001\u623f\u578b\u3001\u95e8\u7968\u573a\u6b21\uff09\u3001\u8ba2\u5355\uff08\u72b6\u6001\u673a\u3001\u652f\u4ed8\u5355\u3001\u9000\u6539\u8bb0\u5f55\uff09\u3001\u5185\u5bb9\uff08\u7b14\u8bb0\u3001\u6807\u7b7e\u3001\u70b9\u8d5e\u6536\u85cf\uff09\u3002"));
bodyChildren.push(h2("6.2 \u5916\u90e8\u63a5\u53e3"));
bodyChildren.push(caption("\u8868 6-1 \u5916\u90e8\u63a5\u53e3\u4e00\u89c8"));
bodyChildren.push(makeTable(
  ["\u63a5\u53e3", "\u7528\u9014", "\u7ea6\u675f"],
  [
    ["\u673a\u7968 / \u9152\u5e97\u4f9b\u5e94\u5546 API", "\u4ea7\u54c1\u3001\u4ef7\u683c\u3001\u9884\u8ba2\u3001\u9000\u6539", "\u9501\u5355\u65f6\u6548 \u2264 60s\uff0c\u5931\u8d25\u91cd\u8bd5 3 \u6b21"],
    ["\u652f\u4ed8\u5b9d / \u5fae\u4fe1\u652f\u4ed8", "\u6536\u6b3e\u4e0e\u5206\u8d26\u3001\u9000\u6b3e", "\u5f02\u6b65\u56de\u8c03\u5fc5\u987b\u9a8c\u7b7e\u4e0e\u5e42\u7b49\u5904\u7406"],
    ["\u77ed\u4fe1 / \u63a8\u9001\u670d\u52a1", "\u9a8c\u8bc1\u7801\u3001\u884c\u7a0b\u63d0\u9192", "\u9a8c\u8bc1\u7801\u6709\u6548 5 \u5206\u949f\uff0c\u6bcf\u53f7\u6bcf\u65e5 \u2264 10 \u6761"],
    ["\u5730\u56fe / \u5bfc\u822a SDK", "\u5730\u56fe\u5c55\u793a\u3001\u8def\u7ebf\u89c4\u5212\u3001\u79bb\u7ebf\u5305", "\u79bb\u7ebf\u5730\u56fe\u5305\u6bcf\u57ce\u5e02 \u2264 50MB"],
    ["\u5929\u6c14\u4e0e\u822a\u73ed\u52a8\u6001", "\u884c\u7a0b\u63d0\u9192\u4e0e\u51fa\u884c\u5f02\u5e38\u9884\u8b66", "\u66f4\u65b0\u9891\u7387 \u2265 1 \u6b21 / \u5c0f\u65f6"],
  ],
  [26, 34, 40]
));

// 7 版本规划
bodyChildren.push(h1("7. \u7248\u672c\u89c4\u5212\u4e0e\u91cc\u7a0b\u7891"));
bodyChildren.push(caption("\u8868 7-1 \u7248\u672c\u91cc\u7a0b\u7891"));
bodyChildren.push(makeTable(
  ["\u7248\u672c", "\u8303\u56f4", "\u5468\u671f"],
  [
    ["V1.0 (MVP)", "\u8d26\u53f7\u3001\u53d1\u73b0 Feed\u3001\u884c\u7a0b\u751f\u6210\u4e0e\u7f16\u8f91\u3001\u673a\u9152\u9884\u8ba2\u3001\u8ba2\u5355\u4e0e\u652f\u4ed8\u3001\u7ba1\u7406\u7aef\u57fa\u7840\u529f\u80fd", "T+3 \u4e2a\u6708"],
    ["V1.5", "\u666f\u70b9\u95e8\u7968\u4e0e\u672c\u5730\u73a9\u4e50\u3001\u793e\u533a\u7b14\u8bb0\u3001\u79bb\u7ebf\u5730\u56fe\u3001\u6d88\u606f\u4f53\u7cfb", "T+5 \u4e2a\u6708"],
    ["V2.0", "\u521b\u4f5c\u8005\u4e2d\u5fc3\u4e0e\u6fc0\u52b1\u5206\u6da8\u3001\u884c\u7a0b\u540c\u6b3e\u590d\u523b\u3001\u4f1a\u5458\u4f53\u7cfb\u3001\u6570\u636e\u770b\u677f", "T+9 \u4e2a\u6708"],
  ],
  [18, 62, 20]
));

// 8 风险
bodyChildren.push(h1("8. \u98ce\u9669\u4e0e\u5bf9\u7b56"));
bodyChildren.push(caption("\u8868 8-1 \u98ce\u9669\u6e05\u5355"));
bodyChildren.push(makeTable(
  ["\u98ce\u9669", "\u7b49\u7ea7", "\u5e94\u5bf9\u63aa\u65bd"],
  [
    ["\u4f9b\u5e94\u5546\u63a5\u53e3\u4e0d\u7a33\u5b9a\u5f71\u54cd\u9884\u8ba2", "\u9ad8", "\u53cc\u4f9b\u5e94\u5546\u5197\u4f59\uff1b\u964d\u7ea7\u9884\u6848\u4e0e\u544a\u8b66\u76d1\u63a7"],
    ["\u652f\u4ed8\u4e0e\u8d44\u91d1\u5b89\u5168\u98ce\u9669", "\u9ad8", "\u5408\u89c4\u5ba1\u8ba1\uff1b\u5bf9\u8d26\u4e0e\u98ce\u63a7\u89c4\u5219\u5f3a\u5236\u6267\u884c"],
    ["UGC \u5185\u5bb9\u8fdd\u89c4\u4e0e\u5408\u89c4\u98ce\u9669", "\u4e2d", "\u673a\u5ba1 + \u4eba\u5de5\u590d\u6838\uff1b\u4e3e\u62a5\u4e0e\u5feb\u901f\u4e0b\u67b6\u673a\u5236"],
    ["\u5b63\u8282\u6027\u6d41\u91cf\u5cf0\u503c\u7cfb\u7edf\u538b\u529b", "\u4e2d", "\u538b\u6d4b\u4e0e\u5f39\u6027\u6269\u5bb9\uff1b\u975e\u6838\u5fc3\u529f\u80fd\u53ef\u964d\u7ea7"],
    ["\u5934\u90e8\u7ade\u54c1\u8865\u8d34\u5927\u6218\u83b7\u5ba2\u6210\u672c\u9ad8", "\u4e2d", "\u5dee\u5f02\u5316\u5185\u5bb9\u4e0e\u793e\u533a\u8fd0\u8425\u83b7\u5ba2\uff0c\u63a7\u5236\u4e70\u91cf\u6bd4\u4f8b"],
  ],
  [34, 12, 54]
));

// 9 验收标准
bodyChildren.push(h1("9. \u9a8c\u6536\u6807\u51c6"));
bodyChildren.push(bullet("\u529f\u80fd\u9a8c\u6536\uff1a\u8868 4-1\u30014-2 \u4e2d P0 \u529f\u80fd\u5168\u90e8\u901a\u8fc7\u9a8c\u6536\u7528\u4f8b\uff0c\u7f3a\u9677\u5bc6\u5ea6\u4e3a 0\uff1bP1 \u529f\u80fd\u7f3a\u9677\u4e0d\u963b\u585e\u53d1\u7248\u3002"));
bodyChildren.push(bullet("\u6027\u80fd\u9a8c\u6536\uff1a\u6838\u5fc3\u9875\u9762\u5728 P95 \u5206\u4f4d\u8fbe\u6807\uff08\u89c1\u8868 5-1\uff09\uff0c\u538b\u6d4b\u62a5\u544a\u5f52\u6863\u3002"));
bodyChildren.push(bullet("\u5b89\u5168\u9a8c\u6536\uff1a\u7b2c\u4e09\u65b9\u6e17\u900f\u6d4b\u8bd5\u65e0\u9ad8\u5371\u6f0f\u6d1e\uff0c\u652f\u4ed8\u94fe\u8def\u901a\u8fc7\u8d44\u91d1\u5b89\u5168\u5ba1\u8ba1\u3002"));
bodyChildren.push(bullet("\u4f53\u9a8c\u9a8c\u6536\uff1a\u53ef\u7528\u6027\u6d4b\u8bd5\uff08SUS \u2265 75 \u5206\uff09\uff0c\u6838\u5fc3\u6d41\u7a0b\u4efb\u52a1\u5b8c\u6210\u7387 \u2265 90%\u3002"));
bodyChildren.push(body("\u672c\u6587\u6863\u81ea\u8bc4\u5ba1\u901a\u8fc7\u540e\u8fdb\u5165\u8bc4\u5ba1\u4f1a\u7b7e\u53d1\uff0c\u540e\u7eed\u53d8\u66f4\u987b\u63d0\u4ea4\u53d8\u66f4\u7533\u8bf7\u5e76\u540c\u6b65\u7248\u672c\u53f7\u3002", { after: 200 }));

// ═══════════ DOCUMENT ═══════════
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: "000000" },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: P.primary },
        paragraph: { spacing: { before: 360, after: 160, line: 312 }, outlineLevel: 0 },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: P.primary },
        paragraph: { spacing: { before: 240, after: 120, line: 312 }, outlineLevel: 1 },
      },
    },
  },
  sections: [
    { // Section 1: Cover
      properties: {
        page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR4({
        title: "\u65c5\u6e38\u51fa\u884c App \u4ea7\u54c1\u9700\u6c42\u6587\u6863",
        englishLabel: "PRODUCT REQUIREMENTS DOCUMENT",
        subtitle: "\u300c\u6e38\u8ff9\u300d\u4e00\u7ad9\u5f0f\u667a\u80fd\u65c5\u884c\u52a9\u624b \u00b7 V1.0",
        metaLines: [
          "\u6587\u6863\u7f16\u53f7\uff1aPRD-YJ-2026-001",
          "\u4ea7\u54c1\u7ecf\u7406\uff1a\u4ea7\u54c1\u90e8",
          "\u7f16\u5199\u65e5\u671f\uff1a2026 \u5e74 9 \u6708 14 \u65e5",
          "\u5bc6\u7ea7\uff1a\u5185\u90e8",
        ],
        footerLeft: "\u4ea7\u54c1\u90e8",
        footerRight: "2026",
      }),
    },
    { // Section 2: TOC (Roman)
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
      },
      footers: { default: pageNumFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: "\u76ee  \u5f55", bold: true, size: 32,
            font: { eastAsia: "SimHei", ascii: "Calibri" } })],
        }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: "\u6ce8\uff1a\u672c\u76ee\u5f55\u7531\u57df\u4ee3\u7801\u751f\u6210\u3002\u5982\u7f16\u8f91\u540e\u9875\u7801\u53d1\u751f\u53d8\u5316\uff0c\u8bf7\u53f3\u952e\u70b9\u51fb\u76ee\u5f55\u5e76\u9009\u62e9\u201c\u66f4\u65b0\u57df\u201d\u4ee5\u5237\u65b0\u9875\u7801\u3002",
            italics: true, size: 18, color: "888888" })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    { // Section 3: Body (Arabic)
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: docHeader() },
      footers: { default: pageNumFooter() },
      children: bodyChildren,
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("\u65c5\u6e38\u8f6f\u4ef6\u9700\u6c42\u6587\u6863.docx", buf);
  console.log("OK");
});
