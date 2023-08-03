FIXME:

- [x] macos white screen: storage path is empty when initially booted, the app is trying to create `.research-helper` out of nowhere. To fix this, initialize plugin manager after storage path is set.
  - [x] when there is no storagePath in db
  - [x] when there is storagePath in db
  - [x] show progress bar during the retrival of appState

TODO:

- [ ] timestamps on necessary data
- [ ] new special folder, recently added
- [ ] change attachFile to attachPDF
- [ ] set attachFile to adding new file into the project folder
- [ ] put pdf annotations to markdown as a link. we can click to jump to the specific annotation

IMPROVE:

- [ ] compactification of db

LONG-TERM TODO:

- [ ] reduce memory usage #55 by changing backend to tauri
- [ ] change product name from 'Research Helper' to other
- [ ] Terminology library
- [ ] cloud sync
- [ ] ai read paper
- [ ] documentations
