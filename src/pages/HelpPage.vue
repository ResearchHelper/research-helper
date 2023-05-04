<template>
  <div
    id="vditor-help"
    ref="vditorHelp"
  ></div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import Vditor from "vditor";
import "src/css/vditor/index.css";
import darkContent from "src/css/vditor/dark.css?raw";
import lightContent from "src/css/vditor/light.css?raw";
import text_en_US from "src/assets/help_en_US.md?raw";
import text_zh_CN from "src/assets/help_zh_CN.md?raw";
import { useStateStore } from "src/stores/appState";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n({ useScope: "global" });
const stateStore = useStateStore();
const props = defineProps({ itemId: String, visible: Boolean });
const vditorHelp = ref<HTMLElement | null>(null);
const editor = ref<Vditor | null>(null);
const toolbar = [
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

watch(
  () => stateStore.settings.theme,
  (theme: string) => {
    setTheme(theme);
  }
);

watch(
  () => stateStore.settings.language,
  (lang: string) => {
    if (!editor.value) return;
    editor.value.setValue(lang === "zh_CN" ? text_zh_CN : text_en_US);
    changeLinks();
  }
);

onMounted(() => {
  editor.value = new Vditor("vditor-help", {
    height: "100%",
    mode: "ir",
    toolbarConfig: {
      pin: true,
    },
    toolbar: toolbar,
    lang: locale.value as keyof II18n,
    tab: "    ", // use 4 spaces as tab
    preview: {
      math: {
        // able to use digit in inline math
        inlineDigit: true,
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
    after: () => {
      if (!editor.value) return;
      editor.value.setValue(locale.value === "zh_CN" ? text_zh_CN : text_en_US);
      setTheme(stateStore.settings.theme);
      changeLinks();
    },
  });
});

function setTheme(theme: string) {
  // this is used to set code theme
  if (!!editor.value) {
    editor.value.setTheme(
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

function changeLinks() {
  if (!vditorHelp.value) return;
  let linkNodes = vditorHelp.value.querySelectorAll("[data-type='a']");
  for (let linkNode of linkNodes) {
    (linkNode as HTMLElement).onclick = (e: MouseEvent) =>
      clickLink(e, linkNode as HTMLElement);
  }
}

async function clickLink(e: MouseEvent, linkNode: HTMLElement) {
  e.stopImmediatePropagation(); // stop propagating the click event
  if (!editor.value) return;
  editor.value.blur(); // save the content before jumping

  let span = linkNode.querySelector(
    "span.vditor-ir__marker--link"
  ) as HTMLElement;
  if (!span) return;
  let link = span.innerText;
  try {
    // valid external url, open it externally
    new URL(link);
    window.browser.openURL(link);
  } catch (error) {
    stateStore.openItem(link);
  }
}
</script>
<style>
pre.vditor-reset {
  /* do not change padding after resizing */
  padding: 10px 35px !important;
}
</style>
