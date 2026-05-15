const state = {
  chapters: [],
  selectedChapter: null,
  selectedAnswers: {},
  lastResult: null
};

const els = {
  chapterList: document.getElementById('chapterList'),
  chapterTitle: document.getElementById('chapterTitle'),
  chapterSummary: document.getElementById('chapterSummary'),
  loadStatus: document.getElementById('loadStatus'),
  lectureContent: document.getElementById('lectureContent'),
  quizForm: document.getElementById('quizForm'),
  analysisContent: document.getElementById('analysisContent'),
  gradeBtn: document.getElementById('gradeBtn'),
  resetBtn: document.getElementById('resetBtn'),
  tabs: document.querySelectorAll('.tab'),
  panels: document.querySelectorAll('.tab-panel')
};

async function init() {
  bindTabs();
  bindActions();
  await loadChapterModules();
}

async function loadChapterModules() {
  try {
    els.loadStatus.textContent = '로딩 중';

    const indexResponse = await fetch('data/chapters/index.json', { cache: 'no-store' });
    if (!indexResponse.ok) {
      throw new Error('data/chapters/index.json을 읽을 수 없습니다.');
    }

    const indexData = await indexResponse.json();
    validateIndex(indexData);

    const modules = await Promise.all(
      indexData.modules.map(async (moduleInfo) => {
        const response = await fetch(`data/chapters/${moduleInfo.file}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`${moduleInfo.file} 파일을 읽을 수 없습니다.`);
        }
        const chapter = await response.json();
        validateChapter(chapter, moduleInfo.file);
        return chapter;
      })
    );

    state.chapters = modules.sort((a, b) => a.order - b.order);
    renderChapterList();

    if (state.chapters.length > 0) {
      selectChapter(state.chapters[0].id);
    }

    els.loadStatus.textContent = `${state.chapters.length}개 챕터`;
  } catch (error) {
    els.loadStatus.textContent = '로드 실패';
    els.chapterTitle.textContent = 'JSON 모듈 로드 실패';
    els.chapterSummary.textContent = error.message;
    els.lectureContent.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

function validateIndex(indexData) {
  if (!indexData || !Array.isArray(indexData.modules)) {
    throw new Error('index.json에는 modules 배열이 필요합니다.');
  }
}

function validateChapter(chapter, fileName) {
  const required = ['id', 'title', 'order', 'summary', 'lecture', 'questions'];
  for (const key of required) {
    if (!(key in chapter)) {
      throw new Error(`${fileName} 파일에 ${key} 항목이 없습니다.`);
    }
  }

  if (!chapter.lecture || !Array.isArray(chapter.lecture.sections)) {
    throw new Error(`${fileName} 파일의 lecture.sections는 배열이어야 합니다.`);
  }

  if (!Array.isArray(chapter.questions)) {
    throw new Error(`${fileName} 파일의 questions는 배열이어야 합니다.`);
  }
}

function renderChapterList() {
  els.chapterList.innerHTML = state.chapters.map((chapter) => `
    <button class="chapter-button" type="button" data-chapter-id="${escapeHtml(chapter.id)}">
      ${chapter.order}. ${escapeHtml(chapter.title)}
    </button>
  `).join('');

  els.chapterList.querySelectorAll('.chapter-button').forEach((button) => {
    button.addEventListener('click', () => selectChapter(button.dataset.chapterId));
  });
}

function selectChapter(chapterId) {
  const chapter = state.chapters.find((item) => item.id === chapterId);
  if (!chapter) return;

  state.selectedChapter = chapter;
  state.selectedAnswers = {};
  state.lastResult = null;

  els.chapterTitle.textContent = chapter.title;
  els.chapterSummary.textContent = chapter.summary;

  document.querySelectorAll('.chapter-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.chapterId === chapterId);
  });

  renderLecture(chapter);
  renderQuiz(chapter);
  renderEmptyAnalysis();
  setActiveTab('lecture');
}

function renderLecture(chapter) {
  const lecture = chapter.lecture || {};
  const sections = Array.isArray(lecture.sections) ? lecture.sections : [];

  const sectionsHtml = sections.map((section) => {
    const paragraphs = Array.isArray(section.paragraphs) ? section.paragraphs : [];
    const examples = collectSectionExamples(section);

    const paragraphHtml = paragraphs
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join('');

    const exampleHtml = examples
      .map((example) => renderCodeExample(example))
      .join('');

    return `
      <section class="lecture-section">
        <h4>${escapeHtml(section.heading || '강의 내용')}</h4>
        ${paragraphHtml}
        ${exampleHtml}
      </section>
    `;
  }).join('');

  const legacyExamples = Array.isArray(lecture.examples) ? lecture.examples : [];
  const legacyExamplesHtml = legacyExamples.length > 0
    ? `
      <section class="lecture-section">
        <h4>추가 예제</h4>
        ${legacyExamples.map((example) => renderCodeExample(example)).join('')}
      </section>
    `
    : '';

  els.lectureContent.innerHTML = `
    <h3>${escapeHtml(chapter.title)}</h3>
    ${sectionsHtml}
    ${legacyExamplesHtml}
  `;
}

function collectSectionExamples(section) {
  const examples = [];

  if (Array.isArray(section.examples)) {
    examples.push(...section.examples);
  }

  if (Array.isArray(section.codeExamples)) {
    examples.push(...section.codeExamples);
  }

  return examples.filter((example) => example && example.code);
}

function renderCodeExample(example) {
  if (!example || !example.code) {
    return '';
  }

  const title = example.title ? `<div class="code-title">${escapeHtml(example.title)}</div>` : '';

  return `
    <div class="code-example">
      ${title}
      <pre><code>${escapeHtml(example.code)}</code></pre>
    </div>
  `;
}

function renderQuiz(chapter) {
  els.quizForm.innerHTML = chapter.questions.map((question, index) => `
    <section class="question-card">
      <h3>문제 ${index + 1}. ${escapeHtml(question.question)}</h3>
      ${Object.entries(question.choices).map(([key, value]) => `
        <label class="choice">
          <input type="radio" name="${escapeHtml(question.id)}" value="${escapeHtml(key)}" />
          ${escapeHtml(key)}. ${escapeHtml(value)}
        </label>
      `).join('')}
    </section>
  `).join('');

  els.quizForm.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.selectedAnswers[input.name] = input.value;
    });
  });
}

function gradeCurrentChapter() {
  const chapter = state.selectedChapter;
  if (!chapter) return;

  let correctCount = 0;
  const details = chapter.questions.map((question) => {
    const userAnswer = state.selectedAnswers[question.id] || null;
    const isCorrect = userAnswer === question.answer;
    if (isCorrect) correctCount += 1;

    return {
      question,
      userAnswer,
      isCorrect
    };
  });

  state.lastResult = {
    total: chapter.questions.length,
    correctCount,
    score: Math.round((correctCount / chapter.questions.length) * 100),
    details
  };

  renderAnalysis();
  setActiveTab('analysis');
}

function renderEmptyAnalysis() {
  els.analysisContent.className = 'content-card empty-state';
  els.analysisContent.innerHTML = '문제를 풀고 채점하면 결과와 정답 해설이 표시됩니다.';
}

function renderAnalysis() {
  const result = state.lastResult;
  if (!result) {
    renderEmptyAnalysis();
    return;
  }

  const chapter = state.selectedChapter;
  const guideHtml = renderAnalysisGuide(chapter);

  els.analysisContent.className = 'content-card';
  els.analysisContent.innerHTML = `
    <div class="result-summary">
      <h3>채점 결과</h3>
      <p>총 ${result.total}문항 중 <strong>${result.correctCount}문항</strong> 정답입니다.</p>
      <p>점수: <strong>${result.score}점</strong></p>
    </div>
    ${guideHtml}
    ${result.details.map((item, index) => {
      const userAnswerText = item.userAnswer ? `${item.userAnswer}. ${item.question.choices[item.userAnswer]}` : '미응답';
      const correctAnswerText = `${item.question.answer}. ${item.question.choices[item.question.answer]}`;
      return `
        <div class="analysis-item ${item.isCorrect ? 'correct' : 'wrong'}">
          <h4>문제 ${index + 1}. ${escapeHtml(item.question.question)}</h4>
          <p>내 답안: ${escapeHtml(userAnswerText)}</p>
          <p>정답: ${escapeHtml(correctAnswerText)}</p>
          <p>해설: ${escapeHtml(item.question.explanation || '')}</p>
          ${item.question.analysis ? `<p>분석: ${escapeHtml(item.question.analysis)}</p>` : ''}
        </div>
      `;
    }).join('')}
  `;
}

function renderAnalysisGuide(chapter) {
  if (!chapter || !chapter.analysisGuide) {
    return '';
  }

  const guide = chapter.analysisGuide;

  if (typeof guide === 'string') {
    return `
      <div class="analysis-guide">
        <h3>학습 분석 기준</h3>
        <p>${escapeHtml(guide)}</p>
      </div>
    `;
  }

  if (Array.isArray(guide)) {
    return `
      <div class="analysis-guide">
        <h3>학습 분석 기준</h3>
        ${guide.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
      </div>
    `;
  }

  if (typeof guide === 'object') {
    const parts = [];
    for (const [key, value] of Object.entries(guide)) {
      if (Array.isArray(value)) {
        parts.push(`
          <h4>${escapeHtml(key)}</h4>
          ${value.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
        `);
      } else {
        parts.push(`
          <h4>${escapeHtml(key)}</h4>
          <p>${escapeHtml(value)}</p>
        `);
      }
    }

    return `
      <div class="analysis-guide">
        <h3>학습 분석 기준</h3>
        ${parts.join('')}
      </div>
    `;
  }

  return '';
}

function resetAnswers() {
  state.selectedAnswers = {};
  state.lastResult = null;

  if (typeof els.quizForm.reset === 'function') {
    els.quizForm.reset();
  } else {
    els.quizForm.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.checked = false;
    });
  }

  renderEmptyAnalysis();
}

function bindTabs() {
  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
  });
}

function setActiveTab(tabName) {
  els.tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabName));
  els.panels.forEach((panel) => panel.classList.remove('active'));
  document.getElementById(`${tabName}Panel`).classList.add('active');
}

function bindActions() {
  els.gradeBtn.addEventListener('click', gradeCurrentChapter);
  els.resetBtn.addEventListener('click', resetAnswers);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

init();
