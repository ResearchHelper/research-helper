FIXME:
[x] pdf selection disappear before the color is selected
[x] annotations in AnnotList will not update when annot is updated
[x] ColorPicker only appears in first page
[x] display and set authors properly
[x] when adding entry by identifiers, it didn't create corresponding folder for storage
[x] search does not work well with authors since it's array now
[x] if the project is deleted, remove projectId from openProjectIds (done) and close all windows related to that

TODO:
[x] remove visible prop and ready prop from PDFReader.vue
[x] implement API for content-extractor
[x] export collection of references
[x] able to add empty entry
[x] able to attach file to an entry
[x] able to add entry by file
[x] able to add entry by identifiers
[x] refactor project.js. need to way to better manage the data.
[x] dialog to confirm deletefromdb
[ ] able to find meta if user demands

IMPROVE:
[ ] Do we really need to use eventBus??

vditor
[ ] figure out how vditor gets the image in dev mode, the base_url http://localhost:9300 is getting in the way. In production mode it is okay.

highlight annotation
[ ] make the join rectangle algo more robust

pdfreader
[x] opens comment editor directly without opening right menu
[x] tooltips for buttons
[x] drag to move comment and comment editor

UI
[ ] set global var systembarheight, toolbarheight, and tabsheight. So we can refer them more quickly

backend
[ ] documentation for each file. description of data
