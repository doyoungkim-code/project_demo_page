/* ============================================================
   BUNMIN 데모 — 목업 슬라이드 생성기
   "자료구조 — 이진 탐색 트리" 강의 5페이지를 한/영 두 벌의
   인라인 SVG → data: URL 로 생성. 실제 앱에서 Surya OCR →
   Qwen3-VL 번역으로 만들어지는 "레이아웃 보존 번역본"을
   같은 좌표에 영어 텍스트를 배치하는 방식으로 흉내낸다.
   ============================================================ */
(function () {
  'use strict';
  window.BUNMIN = window.BUNMIN || {};

  const W = 1600, H = 1200; // 4:3
  const NAVY = '#2A2F4A', BLUE = '#6495EB', LIGHT = '#E8EDFB', GREY = '#4A4F6B';

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function svgUrl(body) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif">' +
      '<rect width="' + W + '" height="' + H + '" fill="#FFFFFF"/>' + body + '</svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function header(title, pageNum) {
    return (
      '<rect x="0" y="0" width="' + W + '" height="14" fill="' + BLUE + '"/>' +
      '<text x="80" y="130" font-size="64" font-weight="bold" fill="' + NAVY + '">' + esc(title) + '</text>' +
      '<rect x="80" y="165" width="220" height="8" rx="4" fill="' + BLUE + '"/>' +
      '<text x="' + (W - 70) + '" y="' + (H - 50) + '" font-size="34" fill="#9AA1C0" text-anchor="end">' + pageNum + '</text>' +
      '<text x="80" y="' + (H - 50) + '" font-size="30" fill="#B4BAD6">CS201 · Data Structures</text>'
    );
  }

  function bullets(items, startY) {
    let y = startY || 280;
    let out = '';
    items.forEach(function (it) {
      out += '<circle cx="100" cy="' + (y - 14) + '" r="9" fill="' + BLUE + '"/>' +
        '<text x="135" y="' + y + '" font-size="44" fill="' + GREY + '">' + esc(it) + '</text>';
      y += 92;
    });
    return out;
  }

  // ── BST 다이어그램 (3페이지) ──
  function bstDiagram(labelLeft, labelRight) {
    const nodes = [
      { x: 800, y: 460, v: '8' },
      { x: 560, y: 640, v: '3' }, { x: 1040, y: 640, v: '10' },
      { x: 440, y: 820, v: '1' }, { x: 680, y: 820, v: '6' }, { x: 1160, y: 820, v: '14' },
    ];
    const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
    let out = '';
    edges.forEach(function (e) {
      const a = nodes[e[0]], b = nodes[e[1]];
      out += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#B4BAD6" stroke-width="5"/>';
    });
    nodes.forEach(function (n, i) {
      out += '<circle cx="' + n.x + '" cy="' + n.y + '" r="56" fill="' + (i === 0 ? BLUE : LIGHT) + '" stroke="' + BLUE + '" stroke-width="5"/>' +
        '<text x="' + n.x + '" y="' + (n.y + 16) + '" font-size="46" font-weight="bold" fill="' + (i === 0 ? '#fff' : NAVY) + '" text-anchor="middle">' + n.v + '</text>';
    });
    out += '<text x="440" y="1010" font-size="36" fill="' + GREY + '" text-anchor="middle">' + esc(labelLeft) + '</text>' +
      '<text x="1120" y="1010" font-size="36" fill="' + GREY + '" text-anchor="middle">' + esc(labelRight) + '</text>';
    return out;
  }

  // ── Big-O 표 (4페이지) ──
  function bigOTable(headers, rows) {
    const x0 = 120, y0 = 300, colW = [420, 420, 420], rowH = 110;
    let out = '';
    let x = x0;
    headers.forEach(function (h, c) {
      out += '<rect x="' + x + '" y="' + y0 + '" width="' + colW[c] + '" height="' + rowH + '" fill="' + BLUE + '" stroke="#fff" stroke-width="3"/>' +
        '<text x="' + (x + colW[c] / 2) + '" y="' + (y0 + 68) + '" font-size="40" font-weight="bold" fill="#fff" text-anchor="middle">' + esc(h) + '</text>';
      x += colW[c];
    });
    rows.forEach(function (row, r) {
      let rx = x0;
      const ry = y0 + rowH * (r + 1);
      row.forEach(function (cell, c) {
        out += '<rect x="' + rx + '" y="' + ry + '" width="' + colW[c] + '" height="' + rowH + '" fill="' + (r % 2 ? '#F2F5FD' : '#fff') + '" stroke="' + LIGHT + '" stroke-width="3"/>' +
          '<text x="' + (rx + colW[c] / 2) + '" y="' + (ry + 68) + '" font-size="38" fill="' + NAVY + '" text-anchor="middle">' + esc(cell) + '</text>';
        rx += colW[c];
      });
    });
    return out;
  }

  function generate() {
    const pages = [];

    // 1. 표지
    pages.push({
      ko: svgUrl(
        '<rect x="0" y="0" width="' + W + '" height="14" fill="' + BLUE + '"/>' +
        '<rect x="80" y="430" width="300" height="10" rx="5" fill="' + BLUE + '"/>' +
        '<text x="80" y="560" font-size="96" font-weight="bold" fill="' + NAVY + '">자료구조 7주차</text>' +
        '<text x="80" y="690" font-size="72" fill="' + BLUE + '">이진 탐색 트리 (BST)</text>' +
        '<text x="80" y="820" font-size="40" fill="' + GREY + '">김교수 · 컴퓨터공학과</text>' +
        '<text x="80" y="' + (H - 50) + '" font-size="30" fill="#B4BAD6">CS201 · Data Structures</text>'
      ),
      en: svgUrl(
        '<rect x="0" y="0" width="' + W + '" height="14" fill="' + BLUE + '"/>' +
        '<rect x="80" y="430" width="300" height="10" rx="5" fill="' + BLUE + '"/>' +
        '<text x="80" y="560" font-size="96" font-weight="bold" fill="' + NAVY + '">Data Structures Week 7</text>' +
        '<text x="80" y="690" font-size="72" fill="' + BLUE + '">Binary Search Tree (BST)</text>' +
        '<text x="80" y="820" font-size="40" fill="' + GREY + '">Prof. Kim · Dept. of Computer Science</text>' +
        '<text x="80" y="' + (H - 50) + '" font-size="30" fill="#B4BAD6">CS201 · Data Structures</text>'
      ),
    });

    // 2. 정의
    pages.push({
      ko: svgUrl(header('이진 탐색 트리란?', 2) + bullets([
        '모든 노드는 최대 2개의 자식을 가진다',
        '왼쪽 서브트리의 값 < 부모 노드의 값',
        '오른쪽 서브트리의 값 > 부모 노드의 값',
        '중위 순회하면 오름차순 정렬 결과를 얻는다',
        '탐색·삽입·삭제 평균 O(log n)',
      ])),
      en: svgUrl(header('What is a Binary Search Tree?', 2) + bullets([
        'Every node has at most two children',
        'Values in the left subtree < parent node',
        'Values in the right subtree > parent node',
        'In-order traversal yields sorted order',
        'Search / insert / delete in O(log n) on average',
      ])),
    });

    // 3. 구조 다이어그램
    pages.push({
      ko: svgUrl(header('BST 구조 예시', 3) +
        '<text x="80" y="280" font-size="42" fill="' + GREY + '">루트가 8인 이진 탐색 트리</text>' +
        bstDiagram('왼쪽: 부모보다 작다', '오른쪽: 부모보다 크다')),
      en: svgUrl(header('BST Structure Example', 3) +
        '<text x="80" y="280" font-size="42" fill="' + GREY + '">A binary search tree rooted at 8</text>' +
        bstDiagram('Left: smaller than parent', 'Right: larger than parent')),
    });

    // 4. 시간 복잡도
    pages.push({
      ko: svgUrl(header('시간 복잡도', 4) +
        bigOTable(['연산', '평균', '최악'], [
          ['탐색', 'O(log n)', 'O(n)'],
          ['삽입', 'O(log n)', 'O(n)'],
          ['삭제', 'O(log n)', 'O(n)'],
        ]) +
        '<text x="120" y="880" font-size="38" fill="' + GREY + '">※ 최악의 경우는 한쪽으로 치우친 편향 트리</text>' +
        '<text x="120" y="950" font-size="38" fill="' + GREY + '">→ AVL, 레드-블랙 트리로 균형 유지</text>'),
      en: svgUrl(header('Time Complexity', 4) +
        bigOTable(['Operation', 'Average', 'Worst'], [
          ['Search', 'O(log n)', 'O(n)'],
          ['Insert', 'O(log n)', 'O(n)'],
          ['Delete', 'O(log n)', 'O(n)'],
        ]) +
        '<text x="120" y="880" font-size="38" fill="' + GREY + '">* Worst case: a skewed (degenerate) tree</text>' +
        '<text x="120" y="950" font-size="38" fill="' + GREY + '">→ Keep balance with AVL / Red-Black trees</text>'),
    });

    // 5. 정리
    pages.push({
      ko: svgUrl(header('오늘 배운 내용 정리', 5) + bullets([
        'BST의 정의와 핵심 불변식',
        '탐색 · 삽입 · 삭제 연산의 동작',
        '평균 O(log n), 최악 O(n)의 이유',
        '다음 시간: 균형 이진 탐색 트리 (AVL)',
      ]) +
        '<rect x="80" y="760" width="1440" height="150" rx="16" fill="' + LIGHT + '"/>' +
        '<text x="120" y="850" font-size="42" fill="' + NAVY + '">과제: BST 삽입/삭제 구현 (다음 주 월요일까지)</text>'),
      en: svgUrl(header("Today's Summary", 5) + bullets([
        'Definition and key invariant of BSTs',
        'How search, insert, and delete work',
        'Why average O(log n) but worst O(n)',
        'Next lecture: balanced BSTs (AVL)',
      ]) +
        '<rect x="80" y="760" width="1440" height="150" rx="16" fill="' + LIGHT + '"/>' +
        '<text x="120" y="850" font-size="42" fill="' + NAVY + '">Assignment: implement BST insert/delete (due next Monday)</text>'),
    });

    return pages.map(function (p, i) {
      return { pageNumber: i + 1, koUrl: p.ko, enUrl: p.en };
    });
  }

  window.BUNMIN.slides = { generate: generate, pages: generate() };
})();
