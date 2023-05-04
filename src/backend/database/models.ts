import { QTreeNode } from "quasar";
import { LayoutConfig, ResolvedLayoutConfig } from "golden-layout";

/***********************************
 * Project, Note, Folder and related data types
 ***********************************/

export interface Author {
  family?: string;
  given?: string;
  literal?: string; // this exists only if family and given do not exist
  sequence?: string; // first / additional etc
  affiliation?: string[];
}

interface Reference {
  key: string; // identifier, usually DOI
  DOI?: string;
  author?: string;
  year?: number;
  "article-title"?: string;
  "series-title"?: string;
  unstructured?: string;
}

/**
 * Meta datatype
 */
export interface Meta {
  id: string; // citation id
  "citation-label": string; // citatin label
  type?: string; // article / book / conference-paper ...
  title: string; // article / book title
  author?: Author[]; // array of authors [{family: "Feng", given: "Feng"}, {literal: "John"}]
  abstract?: string; // article abstract
  year?: string;
  issued?: { "date-parts": Array<any> }; // issued date
  DOI?: string; // Digital Object Identity
  ISBN?: string; // ISBN of a book
  ISSN?: string;
  URL?: string; // URL to this article/book
  publisher?: string; // publisher
  version?: string;
  volume?: number;
  keyword?: string;
  "container-title": string; // journal name
  "container-title-short": string;
  page?: string;
  source?: string;
  language?: string;
  reference?: Reference[]; // reference objects
}

/**
 * Note datatype, both for database and for UI display
 */
export interface Note {
  _id: string; // unique id handled by database
  _rev: string; // rev handled by database
  dataType: "note"; // for database search
  projectId: string; // the project it belongs to
  path: string; // path to actual markdown file
  label: string; // markdown file name
  type: "markdown" | "excalidraw";
}

/**
 * Project datatype, goes into database
 */
export interface Project extends Meta {
  _id: string; // unique id
  _rev: string; // data version handled by database
  dataType: "project"; // for database search
  label: string;
  children?: Note[];
  path: undefined | string; // attached file path
  tags: string[]; // user defined keywords for easier search
  folderIds: string[]; // array of folderIDs containing this project
  // index signature, so we can access property like this project[key]
  [k: string]: any;
}

/**
 * Folder is for both database and UI display use
 * when saving to database, children: string[] is a list of subfolder ids
 * when displaying on UI, children: Folder[] is a list of Folder objects
 */
export interface Folder {
  _id: string; // uid managed by db
  _rev: string; // rev handled by database
  dataType: "folder"; // for database search
  label: string; // folder name
  icon: string; // folder icon in treeview
  children: (string | Folder)[]; // folderId list or Folder object list
}

/******************************************
 * For GraphView
 ******************************************/
export interface Node {
  id: string; // id of the node
  label: string; // label of the node
  type: "project" | "note" | undefined;
}

export interface Edge {
  _id: string; // handled by db
  _rev: string; // handled by db
  dataType: "edge"; // for database search
  type: "link" | "reference"; //
  source: string; // source id
  targets: string[]; // array of target ids
  sourceNode: Node; // source node
  targetNodes: Node[]; // array of target Nodes
}

/****************************************
 * PDF Reader
 ****************************************/
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
  spreadMode: SpreadMode; // 0: no spread, 1: odd spread, 2: even spread
  tool: AnnotationType;
  color: string; // hex value
  scrollLeft: number; // current scrollLeft position
  scrollTop: number; // current scrollTop position
}

export interface Rect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export enum AnnotationType {
  CURSOR = "cursor",
  COMMENT = "comment",
  HIGHLIGHT = "highlight",
  RECTANGLE = "rectangle",
  UNDERLINE = "underline",
  STRIKEOUT = "strikeout",
}

export enum SpreadMode {
  NO_SPREAD,
  ODD_SPREAD,
  EVEN_SPREAD,
}

/**
 * Goes into database and UI display
 */
export interface Annotation {
  _id: string; // handled by db
  _rev: string; // handled by db
  dataType: "pdfAnnotation"; // for database search
  projectId: string; // which project (pdf)
  pageNumber: number; // on which page
  content: string; // comments of the annotation
  color: string; // hex value
  rects: Rect[]; // a multiline highlight annotation has more than 1 rect
  type: AnnotationType;
}

/**
 * Table of contents node
 */
type RefProxy = {
  num: number;
  gen: number;
};

export interface TOCNode extends QTreeNode {
  dest?: string | any[] | null; // destination
  ref?: RefProxy;
}

/**
 * PDF search options
 */
export interface PDFSearch {
  query: string;
  highlightAll: boolean;
  caseSensitive: boolean;
  entireWord: boolean;
}

/**************************************************
 * App global settings
 **************************************************/
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

export interface Layout {
  _id: "layout";
  _rev: string;
  dataType: "layout";
  config: LayoutConfig | ResolvedLayoutConfig;
}

/*******************
 * EventBus
 *******************/
export interface BusEvent {
  source: string; // from which component
  target?: string; // to which component
  data?: any;
}
