export interface Project {
  _id: string; // unique id
  _rev: string; // data version handled by database
  dataType: "project"; // for database search
  type: string; // article / book / conference-paper ...
  title: string; // article / book title
  author: Object[]; // array of authors [{family: "Feng", given: "Feng"}, {literal: "John"}]
  abstract: string; // article abstract
  year: number | string; // year of published
  DOI: string; // Digital Object Identity
  ISBN: string; // ISBN of a book
  URL: string; // URL to this article/book
  publisher: string; // publisher
  reference: Object[]; // reference objects
  path: undefined | string; // attached file path
  tags: string[]; // user defined keywords for easier search
  related: string[]; // array of related projectIDs
  folderIds: string[]; // array of folderIDs containing this project
}

export interface Note {
  _id: string; // unique id handled by database
  _rev: string; // rev handled by database
  dataType: "note"; // for database search
  projectId: string; // the project it belongs to
  path: string; // path to actual markdown file
  label: string; // markdown file name
}

export interface Folder {
  _id: string; // uid managed by db
  dataType: "folder"; // for database search
  label: string; // folder name
  icon: string; // folder icon in treeview
  children: string[]; // folderId list
}

export interface Node {
  id: string; // id of the node
  label: string; // label of the node
  type: "project" | "note" | undefined;
}

export interface Edge {
  _id: string; // handled by db
  _rev: string; // handled by db
  _deleted: string; // handled by db
  dataType: "edge"; // for database search
  type: "link" | "reference"; //
  source: string; // source id
  targets: string[]; // array of target ids
  sourceNode: Node; // source node
  targetNodes: Node[]; // array of target Nodes
}

export interface PDFState {
  _id: string; // handled by db
  _rev: string; // handled by db
  dataType: "pdfState"; // for database search
  projectId: string; // the corresponding project id
  pagesCount: number; // total pages of the pdf
  currentPageNumber: number; // current page of the pdf
  currentScale: number; // zoom scale of the pdf
  // if scale is not the first two options, then scaleValue === scale.toString()
  currentScaleValue: "page-width" | "page-height" | string;
  spreadMode: 0 | 1 | 2; // 0: no spread, 1: odd spread, 2: even spread
  tool: "cursor" | "highlight" | "comment";
  color: string; // hex value
  scrollLeft: number; // current scrollLeft position
  scrollTop: number; // current scrollTop position
}

interface Rect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface Annotation {
  _id: string; // handled by db
  _rev: string; // handled by db
  dataType: "pdfAnnotation"; // for database search
  projectId: string; // which project (pdf)
  pageNumber: number; // on which page
  content: string; // comments of the annotation
  color: string; // hex value
  rect: Rect; // deprecated soon, now is only used by comment
  rects: Rect[]; // a multiline highlight annotation has more than 1 rect
  type: "highlight" | "comment";
}

export interface Settings {
  theme: "dark" | "light"; // dark by default
  language: "en_US" | "zh_CN"; // en_US by default
  storagePath: string; // select by user
  fontSize: string; // 16px by default
}

export interface AppState {
  _id: "appState";
  _rev: string;
  dataType: "appState";
  leftMenuSize: number;
  showLeftMenu: boolean; // is leftmenu expanded
  selectedFolderId: string;
  workingItemId: string;
  openedProjectIds: string[];
  settings: Settings;
}
