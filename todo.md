### Fixes:

- [ ] Project opened repeatedly

### Features:

- [x] Add time stamp to data with type `Folder, Project, Note, AnnotationData`
  - [x] put timestampAdded if there is none in getProjects
  - [x] put timestampAdded if there is none in getNotes
  - [x] put timestampAdded if there is none in getFolderTree
  - [x] put timestampAdded if there is none in getAnnotations
  - [x] put timestampAdded in addProject
  - [x] put timestampAdded in addNote
  - [x] put timestampAdded in addFolder
  - [x] put timestampAdded in addAnnotation
  - [x] update timestampModified in updateProject
  - [x] update timestampModified in updateNote
  - [x] update timestampModified in updateFolder
  - [x] update timestampModified in updateAnnotation
- [x] Add new category `Recently added` to library page
  - [x] UI
  - [x] display time sorted table when selected
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

- [ ] `Project` class
  - [ ] save
  - [ ] update
  - [ ] delete
- [ ] `ProjectStore` class
  - [ ] loadFromDB
  - [ ] add
  - [ ] update
  - [ ] delete
        ????????? do we need this
- [ ] `ProjectFactory` class, use chain responsibility here so we can freely combine the following
  - [ ] createProjectByMeta
  - [ ] createProjectByFile
  - [ ] createEmptyProject
