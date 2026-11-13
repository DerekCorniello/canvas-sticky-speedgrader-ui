const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8');

function element(tagName = 'DIV') {
  const classes = new Set();
  const properties = new Map();
  return {
    tagName,
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) },
    style: { setProperty: (name, value) => properties.set(name, value), getPropertyValue: (name) => properties.get(name) },
    getBoundingClientRect: () => ({ height: 40 }),
    parentElement: null,
    nextElementSibling: null,
    querySelector: () => null,
  };
}

function fixture(fileTagName = 'SECTION', commentGap = false, withAttachment = true) {
  const viewport = element();
  const panel = element('ASIDE');
  const assessment = element('SPAN');
  const content = element('SPAN');
  const submission = element('SECTION');
  const metadata = element('DIV');
  const files = element(fileTagName);
  const attachment = element('BUTTON');
  const rubric = element();
  const rubricButton = element('BUTTON');
  const commentHeading = element('SPAN');
  const commentsLabel = element('SPAN');
  const gap = element('SECTION');
  const comments = element('SECTION');
  const commentInput = element('SPAN');
  const submitComment = element('BUTTON');

  panel.parentElement = viewport;
  assessment.parentElement = panel;
  assessment.firstElementChild = content;
  content.parentElement = assessment;
  submission.parentElement = content;
  submission.nextElementSibling = metadata;
  metadata.parentElement = content;
  metadata.nextElementSibling = files;
  files.parentElement = content;
  attachment.parentElement = files;
  rubric.parentElement = content;
  rubricButton.parentElement = rubric;
  commentHeading.parentElement = content;
  commentHeading.nextElementSibling = commentGap ? gap : comments;
  commentsLabel.parentElement = commentHeading;
  gap.parentElement = content;
  gap.nextElementSibling = comments;
  comments.parentElement = content;
  commentInput.parentElement = comments;
  submitComment.parentElement = comments;

  panel.querySelector = (selector) => selector === '#assessment' ? assessment : null;
  const targets = new Map([
    ['[data-testid="single-submission-info"]', submission],
    ['[data-testid="view-rubric-button"]', rubricButton],
    ['[data-testid="comments-label"]', commentsLabel],
    ['[data-testid="assignment-comment-input"]', commentInput],
    ['[data-testid="submit-comment-button"]', submitComment],
  ]);
  content.querySelector = (selector) => {
    if (selector === '.sg-sticky-comments') return comments.classList.contains('sg-sticky-comments') ? comments : null;
    return targets.get(selector) ?? null;
  };
  content.querySelectorAll = (selector) => selector === '[data-testid^="submission-attachment-link-"]' && withAttachment ? [attachment] : [];

  return { viewport, panel, assessment, content, submission, metadata, files, rubric, rubricButton, commentHeading, comments, targets };
}

function run(page, pathname) {
  vm.runInNewContext(script, {
    location: { pathname },
    document: {
      documentElement: element('HTML'),
      querySelector: (selector) => {
        if (selector === '[data-testid="speedgrader-grading-panel"]') return page.panel;
        if (selector === '.sg-sticky-content') return page.content.classList.contains('sg-sticky-content') ? page.content : null;
        return null;
      },
    },
    MutationObserver: class { observe() {} },
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: (callback) => callback(),
  });
}

test('pins the intended regions on a modern SpeedGrader page', () => {
  const page = fixture();
  run(page, '/courses/123/gradebook/speed_grader');

  assert.equal(page.content.style.getPropertyValue('--sg-comments-height'), '40px');
  assert.equal(page.content.classList.contains('sg-sticky-unclip'), true);
  assert.equal(page.assessment.classList.contains('sg-sticky-unclip'), true);
  assert.equal(page.panel.classList.contains('sg-sticky-unclip'), false);
  assert.equal(page.submission.classList.contains('sg-sticky-submission'), false);
  assert.equal(page.metadata.classList.contains('sg-sticky-files'), false);
  assert.equal(page.files.classList.contains('sg-sticky-files'), true);
  assert.equal(page.rubric.classList.contains('sg-sticky-rubric'), true);
  assert.equal(page.commentHeading.classList.contains('sg-sticky-comment-heading'), true);
  assert.equal(page.comments.classList.contains('sg-sticky-comments'), true);
});

test('pins the attachment group when it is rendered as a div', () => {
  const page = fixture('DIV');
  run(page, '/courses/123/gradebook/speed_grader');

  assert.equal(page.content.classList.contains('sg-sticky-content'), true);
  assert.equal(page.files.classList.contains('sg-sticky-files'), true);
});

test('keeps comments sticky when there are no attachment links', () => {
  const page = fixture('SECTION', false, false);
  run(page, '/courses/123/gradebook/speed_grader');

  assert.equal(page.files.classList.contains('sg-sticky-files'), false);
  assert.equal(page.comments.classList.contains('sg-sticky-comments'), true);
});

test('pins comments when Canvas inserts another section after the heading', () => {
  const page = fixture('DIV', true);
  run(page, '/courses/123/gradebook/speed_grader');

  assert.equal(page.rubric.classList.contains('sg-sticky-rubric'), true);
  assert.equal(page.comments.classList.contains('sg-sticky-comments'), true);
});

test('pins the rubric section inside a nested assessment container', () => {
  const page = fixture('DIV');
  const layout = element();
  const rubricControl = element('SPAN');
  const rubricSection = element('SECTION');
  const rubricContent = element();

  layout.parentElement = page.content;
  rubricControl.parentElement = layout;
  rubricControl.nextElementSibling = rubricSection;
  page.rubricButton.parentElement = rubricControl;
  rubricSection.parentElement = layout;
  rubricSection.nextElementSibling = page.commentHeading;
  rubricContent.parentElement = rubricSection;
  page.commentHeading.parentElement = layout;
  page.comments.parentElement = layout;
  page.targets.set('[data-testid="enhanced-rubric-assessment-container"]', rubricContent);

  run(page, '/courses/123/gradebook/speed_grader');

  assert.equal(page.content.classList.contains('sg-sticky-content'), true);
  assert.equal(layout.classList.contains('sg-sticky-unclip'), true);
  assert.equal(rubricSection.classList.contains('sg-sticky-rubric'), true);
  assert.equal(page.commentHeading.classList.contains('sg-sticky-comment-heading'), true);
  assert.equal(page.comments.classList.contains('sg-sticky-comments'), true);
});

test('leaves the page alone when the editor is missing', () => {
  const page = fixture();
  page.targets.delete('[data-testid="submit-comment-button"]');
  run(page, '/courses/123/gradebook/speed_grader');

  assert.equal(page.content.classList.contains('sg-sticky-content'), false);
});

test('leaves other Canvas pages alone', () => {
  const page = fixture();
  run(page, '/courses/123/assignments/456');

  assert.equal(page.content.classList.contains('sg-sticky-content'), false);
});
