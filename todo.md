FIXME:
[x] closing project from layout should change workingItemId !
[x] projectTree cannot close project
[x] cannot reopen note after closed
[x] unable to load project when layout is loaded. each tab must load their corresponding projectId rather than the workingItemId since initially many the projects have to be load at the same time. We can read the id from the componentState of the tab. Maybe we need to input the projectId through the defineAsyncComponent. Or maybe read from some state in stateStore

TODO:
[x] try golden layout
[x] learn how to programatically add vue components to the tabs
[x] add tab when open a project
[x] remove projectTree from reader
[x] combine TOC to rightmenu
[x] able to see all tabs in right menu
[x] add graphview to projectTree
[x] golden-layout tab events
[x] add a glcomponent when opening a note
[x] able to open multiple projects and notes
[x] change selected item when clicking on different tabs
[x] separate data load/save for each note
[x] able to save and load layout
[x] by recording scrollTop and scrollLeft of viewerContainer, we can save the scroll position
[x] separate data load/save of each pdf reader by changing pdfState from pinia store to ref variables
[x] 1. change all pdfState to local variables
[x] 2. separate the search and matchCounts from states and deal with them separately
[ ] 3. do not use annotStore, maintain the annotList in PDFReader.vue

IMPROVE:
leftmenu
[ ] closing project needs to wait some time

vditor
[ ] able to open it in a separate window, like zotero
[ ] figure out how vditor gets the image in dev mode, the base_url http://localhost:9300 is getting in the way. In production mode it is okay.

highlight annotation
[ ] make the join rectangle algo more robust

pdfreader
[x] writing db too frequent due to quickly changing pages

UI
[ ] set global var systembarheight, toolbarheight, and tabsheight. So we can refer them more quickly

extractor
[ ] the filepath must start from projects/...
