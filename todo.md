### Fixes:

- [ ] Project opened repeatedly
- [x] update window name when project/ note is updated
- [ ] things in layout need to simplified

### Features:

- [x] Add time stamp to data with type `Folder, Project, Note, AnnotationData`
- [x] Add new category `Recently added` to library page
- [x] MetaInfoTab shows timestamps
- [x] Add favorites to library page
  - [x] folder UI
  - [x] add `favorite` (boolean) to `Project` data
  - [x] display favorite in `ProjectTableRow` as a star-shape checkbox
  - [x] update project data when clicked
  - [x] query all favorite projects when clicked on folder
- [ ] Add meta data to folders
- [ ] Able to add notes to folders as well ??

### Improvements:

- [x] Compactification of database
- [x] better table interactions

TODO: refactor project related stuff

- [ ] simplify openProject, closeProject, openPage, and closePage logics and try to make some of them to some global control in stateStore.
- [ ] make a citation id generator that can generate different format
- [ ] the label appear on top of the graph node is better to be a citation id
