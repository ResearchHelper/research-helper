## v3.3.0-beta

### Fix

- [x] click link behavior in note
- [x] openProjectIds are not saved properly, the projectStore.openedProject is updated after the saving.
  - [x] when opening a note, also open its project
- [x] drag multiple documents at the same time

### TODO

- [x] delete all edge datas
- [x] put the code for modifying all timestamps to `db.ts`
- [x] move the vditor css styles change to a global function, so everything using vditor can share the style
  - [x] move all setting related stuff to appState.ts

### Features:

- [x] custom citation key
- [x] PDF dark mode
- [x] pin pdf peeker
- [x] HoverPane for internal links in markdown notes

### Improvements:

- [x] improved table search
- [x] show dropdown list when tabs overflow
- [x] further optimize the database storage
- [x] better hint list in markdown note editor
- [x] the label appear on top of the graph node is better to be a citation id
