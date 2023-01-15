FIXME:
[x] pdf selection disappear before the color is selected
[x] annotations in AnnotList will not update when annot is updated
[x] ColorPicker only appears in first page
[x] display and set authors properly
[x] when adding entry by identifiers, it didn't create corresponding folder for storage
[x] search does not work well with authors since it's array now
[x] if the project is deleted, remove projectId from openProjectIds (done) and close all windows related to that
[x] cannot switch folders
[x] fixed empty layout issue
[x] table only showing 5 projects ????

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
[x] add note in table view
[x] delete note in table view
[x] rename note in table view
[x] how the heck can we notify all components to update when a data is changed? when note is added from tableview, how to inform project tree ? eventBus seems good. But need to clean way to manage all events.
[x] let user choose their storage path
[x] able to open project if there is no pdfs
[x] able to find meta if user demands
[x] adjust tooltip position in vditor
[x] vditor theme
[x] able to search notes in tableview as well
[x] improve table row ui
[x] able to search ISBN as well
[x] able to write something to .bib file even if when the project has no DOI stuff

IMPROVE:
library page
[ ] put all projects to library page, so all components can share projects?

vditor
[ ] user help menu on our own web?
[ ] able to scale image
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
