### Fixes:

- [ ] Project opened repeatedly

### Features:

- [x] Add time stamp to data with type `Folder, Project, Note, AnnotationData`
- [x] Add new category `Recently added` to library page
- [x] MetaInfoTab shows timestamps
- [ ] Add favorites to library page
  - [ ] folder UI
  - [ ] a star button in front of each project entry
  - [x] add `favorite` (boolean) to `Project` data
  - [ ] display favorite in `ProjectTableRow` as a star-shape checkbox
  - [ ] update project data when clicked
- [ ] Add meta data to folders
- [ ] Able to add notes to folders as well ??
- [ ] Able to pin figures

### Improvements:

- [ ] Compactification of database

TODO: refactor project related stuff

- [ ] simplify openProject, closeProject, openPage, and closePage logics and try to make some of them to some global control in stateStore.
- [ ] make a citation id generator that can generate different format
- [ ] the label appear on top of the graph node is better to be a citation id
