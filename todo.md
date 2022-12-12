FIXME:
[x] table is not updated when metainfo is updated
[x] create library folder when user first enter the app
[x] wait until the projectTree is ready, then select what we need
[x] annotation card bgcolor follows annotation color
[x] annotation list shows math after confirm
[x] able to change annot card color
[x] double click annot card to edit
[x] edit content = prv content
[x] live rendering math content in comment

TODO:
[x] intercept link click event in vditor
[x] using the link click event to jump to corresponding file
[x] forward link in vditor
[x] hint in veditor
[x] return a list of projects to hint
[x] return a list of notes to hint
[x] add x besides project to close it
[x] no need record backwardLinks, remove that from db
[x] find a way to distinguish external and internal links
[x] update links in db
[x] open external link in browser
[x] update filter list when new note or new project is added

veditor
[x] paste image data too long
[x] upload image

content extractor
[ ] make content extractor as online service

IMPROVE:
pouchdb
[x] create all neccessary index in db.js instead of each file

vditor
[ ] able to open it in a separate window, like zotero
[ ] figure out how vditor gets the image in dev mode, the base_url http://localhost:9300 is getting in the way. In production mode it is okay.

highlight annotation
[ ] make the join rectangle algo more robust

pdfreader
[ ] writing db too frequent due to quickly changing pages

UI
[ ] set global var systembarheight, toolbarheight, and tabsheight. So we can refer them more quickly

extractor
[ ] the filepath must start from projects/...
