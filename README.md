# Canvas SpeedGrader Sticky Panels

Keeps the submission file controls at the top of SpeedGrader's grading pane and the assignment comment editor at the bottom while the grading pane scrolls normally. The extension changes layout only. It does not read or send grades, comments, or submissions outside the page.

This version targets the modern SpeedGrader at `https://*.instructure.com/courses/.../gradebook/speed_grader`. It uses Canvas's `data-testid` attributes instead of generated CSS class names. If your institution uses a custom Canvas domain, add its HTTPS match pattern to `manifest.json` before loading the extension.

## Install locally

- Chrome, Edge, Brave, or Opera: open the browser's extensions page, enable Developer mode, choose **Load unpacked**, and select this folder.
- Firefox: open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `manifest.json`. Firefox removes temporary add-ons when it closes.

Reload an open SpeedGrader tab after installing. The layout activates when the modern grading pane, rubric control, and comment editor are present. At window heights below 650 px, Canvas's original scrolling layout remains in use.

## Check the layout

Open a submitted assignment with multiple file links and a long rubric. Scroll the grading pane and verify that the file links remain at the top while the comment editor and Submit Comment button remain at the bottom. Switch students and repeat. The supplied sample was a no-submission page, so the submitted-file case still needs a live check.

Run `npm run lint`, `npm run format:check`, and `npm test` for the local checks. No install step or build is needed.
