FIXME:
[x] standard annotation popups won't disappear
[x] non-standard annot covers up canvas even when mix-blend-mode is set
[x] let standard comment annotation uses the annotation-note.svg with background color.
[x] ink editor not correctly rendered
[x] moving comment, coordinates not correct
[x] insert non-standard annotations into canvasWrapper so we can mix-and-blend highlights
[ ] when in ink editor mode, set z-index of all non-standard annotations to 0. After ink mode, set z-index back to 100 or some high number.
  - [x] when annotationeditorlayer renders, the z-index of doms will change
  - [ ] when changing tools only (annotationeditorlayer event not firing), change the z-index of doms. on `annotationeditormodechanged` event, redraw annotations, but how do I know which page I should redraw?


[ ] graph view not able to get links in markdown editor
[ ] don't show any error / warning messages to users when meta info is not able to retrieve

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
