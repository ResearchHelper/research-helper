## v3.3.0-beta

### TODO

- [x] Delete all edge datas
- [x] Put the code for modifying all timestamps to `db.ts`

### Features:

- [ ] Able to import zotero, mendeley, and endnote file
  - [x] import collection of references
  - [ ] import the corresponding files too
    - [ ] parse the collection file to get the file path before citation.js process the meta
    - [ ] transfer data through zotero api might be a better idea since there are notes and stuff
- [x] custom citation key
  - [x] create citation key when importing project
  - [x] create citation key when meta is retrived
  - [x] display citation key in metaInfoTab
  - [x] user is able to change citation key
  - [x] function to generate citation key
  - [x] update citation key as user changing title, author, or year ...
  - [x] settings for auto generate citation key
    - [x] display some examples so user understand what's going on
    - [x] implement options for setting the rule
    - [x] add this rule to stateStore
    - [x] components using the rule must load from stateStore
    - [x] update all references when rule is updated
- [x] PDF dark mode
  - [x] buttons in viewDropdownBtn to toggle darkMode
    - [x] set dark mode
    - [x] set light mode
  - [x] save state to pdfState
  - [x] load colors from db to pdfState
  - [x] set color when pdf is loaded
  - [x] correctly set dark mode when multiple pdfs opened
  - [x] also set dark mode for pdf peeker
- [ ] pin pdf peeker
  - [x] add a frame with pin button
  - [ ] make the pin button work
  - [ ] need to generate the PeekContainer in real time, we can't move the single container anymore
  - [ ] enable drag to move the frame

### Improvements:

- [x] improved table search
- [x] tabs overflow
  - [x] dropdown list to switch tabs
  - [x] note toolbar covers up the dropdown list
- [ ] the label appear on top of the graph node is better to be a citation id
