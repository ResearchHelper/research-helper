FIXME:

- [x] standard annotation popups won't disappear
- [x] don't show any error / warning messages to users when meta info is not able to retrieve
- [x] rename file by meta, year part not working properly
- [x] annotation position failed in chinese pdf, rects have infinity

TODO:

- [x] bump nodejs to 18
- [x] bump version of node in github workflows
- [x] bump pdfjs to v3.7.107
- [x] implement ink tool
- [x] implement eraser tool
- [x] refactoring pdfannotation
- [x] leave tools in the middle, view, full-screen to the left and find to the right
- [x] stroke eraser

  - [x] prototype by trying to bind eventhandlers to Line object
  - [x] load all line objects with their event handlers
  - [x] make stroke eraser and pixel eraser compatible

- [x] SearchBtn.cy.ts
- [x] EraserDropdownBtn.cy.ts
- [x] InkDropdownBtn.cy.ts
- [x] ViewDropdownBtn.cy.ts
- [x] PDFToolBar.cy.ts
- [x] AnnotCard.cy.ts
- [x] AnnotList.cy.ts
- [x] RightMenu.cy.ts

IMPROVE:

LONG-TERM TODO:

- [ ] put pdf annotations to markdown as a link. we can click to jump to the specific annotation
- [ ] Terminology library
- [ ] reduce memory usage #55
- [ ] cloud sync
- [ ] ai read paper
- [ ] documentations
