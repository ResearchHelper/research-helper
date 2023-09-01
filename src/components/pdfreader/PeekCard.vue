<template>
  <q-card
    square
    bordered
    flat
    ref="card"
    class="peekCard"
  >
    <q-card-section
      style="background: var(--color-pdfreader-toolbar-bkgd)"
      class="q-py-none"
    >
      <div class="row justify-between q-py-xs">
        <span>{{ props.link.id }}</span>
        <div>
          <q-checkbox
            dense
            unelevated
            square
            size="md"
            :ripple="false"
            unchecked-icon="bi-pin-angle-fill"
            checked-icon="bi-pin-fill"
            v-model="pinned"
          />
          <q-btn
            dense
            unelevated
            square
            size="md"
            padding="none"
            :ripple="false"
            icon="close"
            @click="close(true)"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section style="height: calc(100% - 32px)">
      <div
        class="peekContainer"
        ref="peekContainer"
      >
        <div class="pdfViewer"></div>
      </div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref, PropType, watch, watchEffect } from "vue";

import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "node_modules/pdfjs-dist/build/pdf.worker.min.js";

import { GrabToPan } from "src/backend/pdfreader/grabToPan";
import { PeekManager } from "src/backend/pdfreader/peekManager";

const props = defineProps({
  link: { type: HTMLAnchorElement, required: true },
  peekManager: { type: Object as PropType<PeekManager>, required: true },
  darkMode: { type: Boolean, required: true },
});
const card = ref();
const peekContainer = ref();
const pinned = ref(false);

watchEffect(() => {
  setViewMode(props.darkMode);
});

onMounted(() => {
  if (!peekContainer.value || !props.peekManager.pdfDocument) return;

  // init viewer
  const eventBus = new pdfjsViewer.EventBus();
  const pdfLinkService = new pdfjsViewer.PDFLinkService({
    eventBus,
  });
  const pdfSinglePageViewer = new pdfjsViewer.PDFSinglePageViewer({
    container: peekContainer.value,
    eventBus: eventBus,
    linkService: pdfLinkService,
    textLayerMode: 0, // DISABLE: 0, ENABLE: 1
    annotationMode: pdfjsLib.AnnotationMode.DISABLE,
    l10n: pdfjsViewer.NullL10n,
  });
  pdfLinkService.setViewer(pdfSinglePageViewer);

  pdfLinkService.setDocument(props.peekManager.pdfDocument, null);
  pdfSinglePageViewer.setDocument(props.peekManager.pdfDocument);

  // set link
  pdfLinkService.setHash(props.link.href.split("#")[1]);

  // set pos
  // internal link is wrapped by an <section> tag
  // this section tag has class linkAnnotation
  // and it is in annotationLayer of pdfjs
  setPos(props.link.parentElement as HTMLElement);

  // set event listener
  // handle zoom event
  card.value.$el.addEventListener("mousewheel", (e: WheelEvent) => {
    e.preventDefault();
    if (!pdfSinglePageViewer) return;
    pdfSinglePageViewer.currentScale += e.deltaY < 0 ? 0.1 : -0.1;
  });

  // handle mouseleave
  card.value.$el.addEventListener("mouseleave", (e: MouseEvent) => {
    close();
  });

  // enable drag to move
  enableDragToMove();

  // show peeker
  show();
});

/**
 * Given the viewerContainer and linkElment, calculate the peekCard position
 * There is no need for user to call this
 * @param viewerContainer
 */
function setPos(linkAnnot: HTMLElement) {
  let annotLayer = linkAnnot.parentElement;
  if (!card.value || !annotLayer) return;

  let viewerRect = annotLayer.getBoundingClientRect();
  let linkRect = linkAnnot.getBoundingClientRect();

  // peekCard dimension (in px)
  let vw = viewerRect.width;
  let vh = viewerRect.height;

  let x1 = linkRect.x - viewerRect.x;
  let y1 = linkRect.y - viewerRect.y;

  let w = (viewerRect.width * 2) / 3;
  let h = viewerRect.height / 2;

  // anchor point
  let left = linkRect.x - viewerRect.x;
  let top = linkRect.y - viewerRect.y;

  // set anchor point to center bottom
  left -= w / 2;
  top -= h + 5;

  if (x1 < w / 2) {
    // left region
    left += w / 2 + linkRect.width;
  } else if (x1 > vw - w / 2) {
    // right region
    left -= w / 2;
  }

  if (y1 < h) {
    // up region
    top += linkRect.height + h + 10;
  }

  // position relative to viewerContainer
  card.value.$el.style.position = "relative";
  card.value.$el.style.top = top + "px";
  card.value.$el.style.left = left + "px";
  card.value.$el.style.width = w + "px";
  card.value.$el.style.height = h + "px";
  card.value.$el.style.zIndex = "1000";
}

function show() {
  if (!card.value.$el) return;
  card.value.$el.style.display = "block";

  enableGrabToPan();
}

function enableGrabToPan() {
  const handtool = new GrabToPan({ element: peekContainer.value });
  handtool.activate();
}

/**
 * User can close the PeekCard even if it's pinned
 */
function close(force?: boolean) {
  if (!!force || !pinned.value) props.peekManager.destroy(props.link.id);
}

function enableDragToMove() {
  let dom = card.value.$el;
  let annotLayerRect: DOMRect;
  let domRect: DOMRect;
  let offsetX = 0;
  let offsetY = 0;
  let shiftX = 0;
  let shiftY = 0;
  let left: number;
  let top: number;

  dom.draggable = true;
  dom.ondragstart = (e: DragEvent) => {
    annotLayerRect = dom.parentElement?.getBoundingClientRect() as DOMRect;
    domRect = dom.getBoundingClientRect();
    offsetX = annotLayerRect.left;
    offsetY = annotLayerRect.top;
    shiftX = e.clientX - domRect.left;
    shiftY = e.clientY - domRect.top;

    // no ghost image when dragging
    if (e.dataTransfer)
      e.dataTransfer.setDragImage(document.createElement("img"), 0, 0);

    // when dragging, automatically set pinned for better interaction
    pinned.value = true;
  };

  dom.ondrag = (e: DragEvent) => {
    // when drag is released, e.pageX and e.pageY will jump to 0, weird
    // need to calculate tmpLeft/tmpTop first to avoid this
    left = e.pageX - offsetX - shiftX;
    top = e.pageY - offsetY - shiftY;

    if (left < 0 || left + domRect.width > annotLayerRect.width) return;
    if (top < 0 || top + domRect.height > annotLayerRect.height) return;

    dom.style.left = `${left}px`;
    dom.style.top = `${top}px`;
  };
}

function setViewMode(darkMode: boolean) {
  if (!peekContainer.value) return;
  let viewer = peekContainer.value.querySelector(".pdfViewer") as HTMLElement;
  if (!viewer) return;
  if (darkMode)
    peekContainer.value.style.filter =
      "invert(64%) contrast(228%) brightness(80%) hue-rotate(180deg)";
  else peekContainer.value.style.filter = "unset";
}
</script>
<style lang="scss">
.peekCard {
  position: absolute !important;
  background: var(--color-pdfreader-viewer-bkgd);
  display: none;
  max-height: 40vh;
  max-width: 40vw;
  cursor: grab;
  z-index: 1000;

  &:hover {
    border: solid $primary 2px;
    z-index: 1001 !important;
  }
}
.peekContainer {
  position: absolute;
  left: 0;
  top: 0;
  overflow: auto;
  height: 100%;
  width: 100%;
}
</style>
