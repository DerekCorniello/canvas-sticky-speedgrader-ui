(() => {
  "use strict";

  if (!/^\/courses\/\d+\/gradebook\/speed_grader\/?$/.test(location.pathname)) {
    return;
  }

  const panelSelector = '[data-testid="speedgrader-grading-panel"]';
  let scheduled = false;
  let observedComments = null;
  let resizeObserver = null;
  let activeFiles = null;

  function directChildOf(element, parent) {
    while (element && element.parentElement !== parent) {
      element = element.parentElement;
    }
    return element && element.parentElement === parent ? element : null;
  }

  function isInside(element, ancestor) {
    while (element) {
      if (element === ancestor) return true;
      element = element.parentElement;
    }
    return false;
  }

  function commonAncestor(elements, boundary) {
    let candidate = elements[0];
    while (candidate && isInside(candidate, boundary)) {
      if (elements.every((element) => isInside(element, candidate))) {
        return candidate;
      }
      candidate = candidate.parentElement;
    }
    return null;
  }

  function clearStickyBlockers(element, scrollPane) {
    for (let ancestor = element.parentElement; ancestor && ancestor !== scrollPane; ancestor = ancestor.parentElement) {
      ancestor.classList.add('sg-sticky-unclip');
    }
  }

  function updateOffsets() {
    const content = document.querySelector('.sg-sticky-content');
    const comments = content?.querySelector('.sg-sticky-comments');
    if (!content || !comments) return;

    content.style.setProperty('--sg-comments-height', `${comments.getBoundingClientRect().height}px`);
  }

  function applyLayout() {
    scheduled = false;

    const panel = document.querySelector(panelSelector);
    const assessment = panel?.querySelector('#assessment');
    const content = assessment?.firstElementChild;
    const rubricButton = content?.querySelector('[data-testid="view-rubric-button"]');
    const commentsLabel = content?.querySelector('[data-testid="comments-label"]');
    const commentInput = content?.querySelector('[data-testid="assignment-comment-input"]');
    const submitComment = content?.querySelector('[data-testid="submit-comment-button"]');
    const rubricContent = content?.querySelector('[data-testid="enhanced-rubric-assessment-container"]');
    const attachmentLinks = content ? [...content.querySelectorAll('[data-testid^="submission-attachment-link-"]')] : [];

    if (!panel || !content || !rubricButton || !commentsLabel || !commentInput || !submitComment) {
      return;
    }

    const layout = commonAncestor([rubricButton, commentsLabel, commentInput], content);
    const rubric = layout && directChildOf(rubricContent || rubricButton, layout);
    const commentHeading = layout && directChildOf(commentsLabel, layout);
    const comments = layout && directChildOf(commentInput, layout);
    let files = attachmentLinks.length ? commonAncestor(attachmentLinks, content) : null;
    while (files?.parentElement && !isInside(rubricButton, files.parentElement)) {
      files = files.parentElement;
    }

    if (!layout || !rubric || !commentHeading || !comments || rubric === comments || !isInside(submitComment, comments)) {
      return;
    }

    content.classList.add('sg-sticky-content');
    if (activeFiles && activeFiles !== files) activeFiles.classList.remove('sg-sticky-files');
    if (files) files.classList.add('sg-sticky-files');
    activeFiles = files;
    rubric.classList.add('sg-sticky-rubric');
    commentHeading.classList.add('sg-sticky-comment-heading');
    comments.classList.add('sg-sticky-comments');
    for (const element of [files, commentHeading, comments]) {
      if (!element) continue;
      clearStickyBlockers(element, panel);
    }

    if (observedComments !== comments) {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(updateOffsets);
      resizeObserver.observe(comments);
      observedComments = comments;
    }
    updateOffsets();
  }

  function scheduleLayout() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(applyLayout);
    }
  }

  const observer = new MutationObserver(scheduleLayout);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scheduleLayout();
})();
