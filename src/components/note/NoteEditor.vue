<template>
  <div
    v-show="showEditor"
    ref="vditorDiv"
  ></div>
</template>
<script setup lang="ts">
// types
import { inject, nextTick, onMounted, ref, watch } from "vue";
import { Edge, Note, Project } from "src/backend/database";
// vditor
import Vditor from "vditor";
import "src/css/vditor/index.css";
import darkContent from "src/css/vditor/dark.css?raw";
import lightContent from "src/css/vditor/light.css?raw";
// db related
import { useStateStore } from "src/stores/appState";
import {
  loadNote,
  saveNote,
  getAllNotes,
  getNote,
  uploadImage,
} from "src/backend/project/note";

import { updateEdge } from "src/backend/project/graph";
import { getAllProjects } from "src/backend/project/project";
// util
import { EventBus, debounce } from "quasar";
import { useI18n } from "vue-i18n";

const stateStore = useStateStore();
const { t } = useI18n({ useScope: "global" });
const bus = inject("bus") as EventBus;

const props = defineProps({
  noteId: { type: String, required: true },
  hasToolbar: { type: Boolean, required: true },
});

const currentNote = ref<Note>({} as Note);
const vditor = ref<Vditor | null>(null);
const vditorDiv = ref<HTMLElement | null>(null);
const showEditor = ref(false);
const linkBase = ref("");

const notes = ref<Note[]>([]);
const projects = ref<Project[]>([]);
const hints = ref<{ value: string; html: string }[]>([]);

watch(
  () => stateStore.settings.theme,
  (theme: string) => {
    setTheme(theme);
  }
);

onMounted(async () => {
  currentNote.value = (await getNote(props.noteId)) as Note;
  linkBase.value = window.path.dirname(currentNote.value.path);
  if (process.env.DEV) {
    linkBase.value = "file://" + linkBase.value;
  }
  if (!vditorDiv.value) return;
  vditorDiv.value.setAttribute("id", `vditor-${props.noteId}`);
  showEditor.value = true;
  initEditor();
  await nextTick();
});

/************************************************
 * Initialization of vditor
 ************************************************/
function initEditor() {
  let toolbar = [] as (
    | {
        name: string;
        tipPosition?: string;
        tip?: string;
      }
    | "|"
  )[];
  if (props.hasToolbar)
    toolbar = [
      {
        name: "outline",
        tipPosition: "s",
      },
      "|",
      { name: "headings", tipPosition: "s" },
      { name: "bold", tipPosition: "s" },
      { name: "italic", tipPosition: "s" },
      "|",
      { name: "table", tipPosition: "s" },
      "|",
      { name: "upload", tipPosition: "s", tip: t("upload-image") },
      { name: "export", tipPosition: "s" },
      "|",
      { name: "help", tipPosition: "s" },
    ];

  vditor.value = new Vditor("vditor-" + props.noteId, {
    height: "100%",
    mode: "ir",
    toolbarConfig: {
      pin: true,
    },
    toolbar: toolbar,
    lang: stateStore.settings.language as keyof II18n,
    tab: "    ", // use 4 spaces as tab
    preview: {
      math: {
        // able to use digit in inline math
        inlineDigit: true,
      },
      markdown: {
        // in DEV mode, load local files instead of server path
        linkBase: linkBase.value,
      },
      hljs: {
        // enable line number in code block
        lineNumber: true,
      },
    },
    placeholder: t("live-markdown-editor-latex-supported"),
    cache: {
      enable: false,
    },
    hint: {
      parse: false,
      delay: 200, // unit: ms
      extend: [
        {
          key: "[[",
          hint: filterHints,
        },
      ],
    },
    after: () => {
      if (showEditor.value) {
        setContent();
        setTheme(stateStore.settings.theme);
      }
    },
    focus: () => {
      // used to filter stuff
      getAllProjects().then((_projects) => (projects.value = _projects));
      getAllNotes().then((_notes) => (notes.value = _notes));
    },
    blur: () => {
      saveContent();
    },
    input: () => {
      saveContent();
      changeLinks();
      addImgResizer();
    },
    upload: {
      accept: "image/*",
      handler: (files: File[]): null => {
        for (let file of files) {
          uploadImage(props.noteId, file).then((uploaded) => {
            if (uploaded === undefined) return;
            if (!vditor.value) return;
            vditor.value.insertValue(
              `![${uploaded.imgName}](./img/${uploaded.imgName})`
            );
          });
        }
        return null;
      },
    },
  });
}

function setTheme(theme: string) {
  // this is used to set code theme
  if (!!vditor.value) {
    vditor.value.setTheme(
      theme === "dark" ? "dark" : "classic",
      theme,
      theme === "dark" ? "native" : "emacs"
    );
  }
  // must append editorStyle before contentStyle
  // otherwise the texts are dark
  let contentStyle = document.getElementById(
    "vditor-content-style"
  ) as HTMLStyleElement;
  if (contentStyle === null) {
    contentStyle = document.createElement("style") as HTMLStyleElement;
    contentStyle.id = "vditor-content-style";
    contentStyle.type = "text/css";
    document.head.append(contentStyle);
  }

  switch (theme) {
    case "dark":
      contentStyle.innerHTML = darkContent;
      break;
    case "light":
      contentStyle.innerHTML = lightContent;
      break;
  }
}

/*****************************************
 * Set and save content
 *****************************************/

async function setContent() {
  if (!vditor.value) return;
  let content = await loadNote(props.noteId);
  vditor.value.setValue(content);
  changeLinks();
  addImgResizer();
}

async function _saveContent() {
  // save the content when it's blur
  // this will be called before unmount
  if (!vditor.value) return;
  let content = vditor.value.getValue();
  await saveNote(props.noteId, content);
  await saveLinks();
}

const saveContent = debounce(_saveContent, 100) as () => void;

async function saveLinks() {
  if (!vditor.value) return;
  let sourceNode = {
    id: currentNote.value._id,
    label: currentNote.value.label,
    type: currentNote.value.dataType,
  };
  let targetNodes = [];

  let parser = new DOMParser();
  let html = parser.parseFromString(vditor.value.getHTML(), "text/html");
  let linkNodes = html.querySelectorAll("a");
  for (let node of linkNodes) {
    let href = (node as HTMLAnchorElement).getAttribute("href") as string;
    href = href.replace(linkBase.value + window.path.sep, "");
    try {
      new URL(href);
      // this is a valid url, do nothing
    } catch (error) {
      // this is an invalid url, might be an id
      if (!href.includes(".")) {
        let item = await getNote(href);
        targetNodes.push({
          id: href,
          label: node.innerText,
          type: item?.dataType,
        });
      }
    }
  }

  let data = {
    source: sourceNode.id,
    targets: targetNodes.map((node) => node.id),
    sourceNode: sourceNode,
    targetNodes: targetNodes,
  } as Edge;
  await updateEdge(props.noteId, data);
  bus.emit("updateGraph", { source: "NoteEditor", data: data });
}

/*****************************************
 * Modify the default click link behavior
 *****************************************/
function _changeLinks() {
  if (!vditorDiv.value) return;
  let linkNodes = vditorDiv.value.querySelectorAll(
    "[data-type='a']"
  ) as NodeListOf<HTMLElement>;
  for (let linkNode of linkNodes) {
    linkNode.onclick = (e) => clickLink(e, linkNode);
  }
}
const changeLinks = debounce(_changeLinks, 50) as () => void;

async function clickLink(e: MouseEvent, linkNode: HTMLElement) {
  if (!vditor.value) return;
  e.stopImmediatePropagation(); // stop propagating the click event
  vditor.value.blur(); // save the content before jumping

  let link = (
    linkNode.querySelector("span.vditor-ir__marker--link") as HTMLElement
  ).innerText;
  try {
    // valid external url, open it externally
    new URL(link);
    window.browser.openURL(link);
  } catch (error) {
    // we just want the document, both getProject or getNote are good
    stateStore.openItem(link);
  }
}

/********************************************
 * Add image resize handle on each image in the note
 ********************************************/
// TODO: save image size
function _addImgResizer() {
  if (!vditorDiv.value) return;
  let imgs = vditorDiv.value.querySelectorAll("img");
  for (let img of imgs) {
    let p = img.parentElement?.parentElement;
    if (!!!p || !!p.onmouseover) continue;
    // add this only if the image does not have it
    p.onmouseenter = () => {
      let dragHandle = document.createElement("div");
      dragHandle.style.backgroundColor = "grey";
      dragHandle.style.position = "relative";
      dragHandle.style.display = "inline-block";
      dragHandle.style.borderRadius = `${10}px`;
      dragHandle.style.top = `${-img.height / 3}px`;
      dragHandle.style.left = `${-0.05 * img.width}px`;
      dragHandle.style.width = `${5}px`;
      dragHandle.style.height = `${img.height / 3}px`;
      dragHandle.style.zIndex = "10000";
      dragHandle.style.cursor = "ew-resize";

      dragHandle.onmousedown = (e) => {
        e.preventDefault();
        let widthStart = img.width;
        let heightStart = img.height;
        let xStart = e.clientX;
        let ratio = img.height / img.width;

        document.onmousemove = (ev) => {
          let dx = ev.clientX - xStart;
          let dy = ratio * dx;

          img.width = widthStart + dx;
          img.height = heightStart + dy;

          dragHandle.style.top = `${-img.height / 3}px`;
          dragHandle.style.left = `${-0.05 * img.width}px`;
          dragHandle.style.height = `${img.height / 3}px`;
        };

        document.onmouseup = (e) => {
          document.onmousemove = null;
          document.onmouseup = null;
        };
      };
      (p as HTMLElement).append(dragHandle);

      (p as HTMLElement).onmouseleave = () => {
        dragHandle.remove();
      };
    };
  }
}
const addImgResizer = debounce(_addImgResizer, 50) as () => void;

/*******************************************
 * Hints
 *******************************************/

/**
 * Return a filtered list of projects / notes according to key
 * @param key - keywords to filter
 */
function filterHints(key: string) {
  hints.value = [];
  let items: (Project | Note)[] = projects.value.concat(notes.value as any);
  for (let item of items) {
    let label = item.dataType === "project" ? item.title : (item as Note).label;
    if (label.toLocaleLowerCase().indexOf(key) > -1) {
      hints.value.push({
        value: `[${label}](${item._id})`,
        html: `<p class="ellipsis"><strong>${item.dataType}</strong>: ${item.label}</p>`,
      });
    }
  }
  return hints.value;
}
</script>
<style>
pre.vditor-reset {
  /* do not change padding after resizing */
  padding: 10px 35px !important;
}
</style>
