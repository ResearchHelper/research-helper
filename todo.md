FIXME:

- [x] standard annotation popups won't disappear
- [x] non-standard annot covers up canvas even when mix-blend-mode is set
- [x] let standard comment annotation uses the annotation-note.svg with background color.
- [x] ink editor not correctly rendered
- [x] moving comment, coordinates not correct
- [x] insert non-standard annotations into canvasWrapper so we can mix-and-blend highlights
- [x] set non-standard annotation zIndex to 3 (same as annotationLayer), now user can interact with them and they won't block ink
- [x] don't show any error / warning messages to users when meta info is not able to retrieve
- [x] rename file by meta, year part not working properly
- [x] when pdf is loaded, scrollTop not working ?
- [x] rectangular highlight not able to drag
- [x] activeAnnotation class keeps hanging on annotation until a click on something not an annotation
- [x] annotation position failed in chinese pdf, rects have infinity
- [x] click on pdf to close color picker and ink params setting
- [ ] some pdfs can't set pen color

TODO:

- [x] bump nodejs to 18
- [x] bump version of node in github workflows
- [x] bump pdfjs to v3.7.107
- [x] implement ink tool
- [x] move non-standard annots to annotationLayer rather than annotationEditorLayer
- [x] change properties of ink
- [x] save ink properties
- [x] load ink properties
  - [x] set ink color when PDF is loaded
- [x] better prompt to let user close the dropdown menus
- [x] separate the ink dropdown option and ink button
- [x] save ink (save canvas.toDataUrl() as annot.content, the parent bounding rect is saves as usual rect)
  - [x] after which event do we save the the ink
  - [x] how do we get the inks from html?
  - [x] figure out a way to not save duplicate inks
- [x] load ink
  - [x] implement data structure for ink
  - [x] when switching to AnnotationType.NONE, annotationEditorLayer will be hidden if there is no user created ink. Even ink is being injected from db, pdfjs thinks there is no ink.
  - [x] INK appears in AnnotationList, I think this is fine, but its content is "data:image......". We can render it directly.
- [x] delete ink
- [x] update ink (enable drag to move)
- [x] do not scroll pages when select annotation in AnnotationList
- [x] add an action to AnnotCardMenu to scroll annot into view
- [x] add few more colors to color picker (for ink)
- [x] different pdf saves the same ink
- [x] different ink params in different project
- [x] change `ref(null)` to `ref<type>()`

IMPROVE:

LONG-TERM TODO:

- [ ] enable changing properperties of an injected ink
- [ ] put pdf annotations to markdown as a link. we can click to jump to the specific annotation
- [ ] Terminology library
- [ ] reduce memory usage #55
- [ ] cloud sync
- [ ] ai read paper
- [ ] documentations
