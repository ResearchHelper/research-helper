## v3.3.0-beta

### TODO

- [x] delete all edge datas
- [x] put the code for modifying all timestamps to `db.ts`
- [x] move the vditor css styles change to a global function, so everything using vditor can share the style
  - [x] move all setting related stuff to appState.ts
- [ ] refactor note editor using the new link / image interface in vditor
  - [ ] link
  - [ ] image

### Features:

- [x] custom citation key
- [x] PDF dark mode
- [x] pin pdf peeker
- [x] HoverPane for internal links in markdown notes
  - [x] HoverPane to show project meta info
  - [x] HoverPane to show markdown note
  - [x] HoverPane to show excalidraw info

### Improvements:

- [x] improved table search
- [x] show dropdown list when tabs overflow
- [x] further optimize the database storage
- [x] better hint list in markdown note editor
- [x] the label appear on top of the graph node is better to be a citation id
