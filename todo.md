FIXME:
[x] standard annotation popups won't disappear
[x] non-standard annot covers up canvas even when mix-blend-mode is set
[x] let standard comment annotation uses the annotation-note.svg with background color.
[x] ink editor not correctly rendered
[x] moving comment, coordinates not correct
[x] draw rects on canvas, rather than setting background color of section in annotationLayer. By doing this we can leave the z-index of annotationLayer alone.
[ ] plan out a different logic for updateAnnotation, deleteAnnotation


TODO:
[x] bump nodejs to 18
[x] bump version of node in github workflows
[x] bump pdfjs to v3.7.107
[x] implement ink tool
[x] move non-standard annots to annotationLayer rather than annotationEditorLayer
[x] change properties of ink
[x] save ink properties
[x] load ink properties
[x] better prompt to let user close the dropdown menus
[ ] save ink (save canvas.toDataUrl() as annot.content, the parent bounding rect is saves as usual rect)
[ ] load ink
[ ] put pdf annotations to markdown as a link. we can click to jump to the specific annotation
[ ] Terminology library

IMPROVE:

LONG-TERM TODO:
[ ] reduce memory usage #55
[ ] cloud sync
[ ] ai read paper
[ ] documentations
