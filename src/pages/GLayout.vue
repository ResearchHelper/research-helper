<template>
  <div style="position: relative">
    <div
      ref="GLRoot"
      style="position: absolute; width: 100%; height: 100%"
    >
      <!-- Root dom for Golden-Layout manager -->
    </div>

    <div style="position: absolute; width: 100%; height: 100%">
      <GLComponent
        v-for="(item, key) in AllComponents"
        :key="key"
        :ref="GlcKeyPrefix + key"
        :id="GlcKeyPrefix + key"
        @click="onClick(key)"
      >
        <component
          v-if="initialized"
          :is="item.component"
          :itemId="item.id"
          :visible="MapComponents[key]?.container?.visible"
        ></component>
      </GLComponent>
    </div>
  </div>
</template>

<script setup>
import {
  onMounted,
  ref,
  markRaw,
  readonly,
  defineExpose,
  defineAsyncComponent,
  defineProps,
  defineEmits,
  nextTick,
  getCurrentInstance,
  watch,
} from "vue";
import { VirtualLayout, LayoutConfig } from "golden-layout";
import GLComponent from "./GLComponent.vue";

/*******************
 * Props and Emits
 *******************/
const props = defineProps({
  glcPath: String,
  workingItemId: String,
});
const emit = defineEmits(["update:workingItemId", "layoutchanged"]);

/*******************
 * Data
 *******************/
const GLRoot = ref(null);
let GLayout;
const GlcKeyPrefix = readonly(ref("glc_"));

const AllComponents = ref({});
let MapComponents = {};
let IdToRef = {};
var UnusedIndexes = [];
let CurIndex = 0;
let GlBoundingClientRect;

const instance = getCurrentInstance();
const initialized = ref(false);

/*******************
 * Props
 *******************/
watch(initialized, (initialized) => {
  // after initialized, focus the workingItem
  if (initialized) focusById(props.workingItemId);
});

watch(
  () => props.workingItemId,
  (id) => focusById(id)
);

/*******************
 * Method
 *******************/
/** @internal */
const addComponent = (componentType, title, id) => {
  let index = CurIndex;
  if (UnusedIndexes.length > 0) index = UnusedIndexes.pop();
  else CurIndex++;

  const component = markRaw(
    defineAsyncComponent(() =>
      import(/* @vite-ignore */ props.glcPath + componentType + ".vue")
    )
  );
  AllComponents.value[index] = { component, id };

  return index;
};

/**
 *
 * @param {String} componentType Vue document name
 * @param {String} title Tab title
 * @param {String} id projectId or noteId
 */
const addGLComponent = async (componentType, title, id) => {
  if (componentType.length == 0)
    throw new Error("addGLComponent: Component's type is empty");

  if (id in IdToRef) {
    focusById(id);
    return; // don't repeatly add components
  }

  const index = addComponent(componentType, title, id);
  await nextTick(); // wait 1 tick for vue to add the dom
  GLayout.addComponent(componentType, { refId: index, id: id }, title);
};

const loadGLLayout = async (layoutConfig) => {
  GLayout.clear();
  AllComponents.value = {};

  // When reloading a saved Layout, first convert the saved "Resolved Config" to a "Config" by calling LayoutConfig.fromResolved().
  const config = layoutConfig.resolved
    ? LayoutConfig.fromResolved(layoutConfig)
    : layoutConfig;
  let contents = [config.root.content];

  let index = 0;
  while (contents.length > 0) {
    const content = contents.shift();
    for (let itemConfig of content) {
      if (itemConfig.type == "component") {
        index = addComponent(
          itemConfig.componentType,
          itemConfig.title,
          itemConfig.componentState.id
        );
        if (typeof itemConfig.componentState == "object")
          itemConfig.componentState["refId"] = index;
        else itemConfig.componentState = { refId: index };
      } else if (itemConfig.content.length > 0) {
        contents.push(itemConfig.content);
      }
    }
  }

  await nextTick(); // wait 1 tick for vue to add the dom

  await GLayout.loadLayout(config);

  // initialization complete, emit initialized
  initialized.value = true;
};

const getLayoutConfig = () => {
  return GLayout.saveLayout();
};

const resize = () => {
  const dom = GLRoot.value;
  let width = dom ? dom.offsetWidth : 0;
  let height = dom ? dom.offsetHeight : 0;
  GLayout.setSize(width, height);
};

const onClick = (refId) => {
  MapComponents[refId].container.focus();
};

const focusById = (id) => {
  if (id in IdToRef) {
    let refId = IdToRef[id];
    MapComponents[refId].container.focus();
  }
};

const removeGLComponent = (removeId) => {
  MapComponents[IdToRef[removeId]]?.container.close();
};

/*******************
 * Mount
 *******************/
onMounted(() => {
  if (GLRoot.value == null)
    throw new Error("Golden Layout can't find the root DOM!");

  window.addEventListener("resize", resize, { passive: true });

  const handleBeforeVirtualRectingEvent = (count) => {
    GlBoundingClientRect = GLRoot.value.getBoundingClientRect();
  };

  const handleContainerVirtualRectingRequiredEvent = (
    container,
    width,
    height
  ) => {
    const component = MapComponents[container.state.refId];
    if (!component || !component?.glc) {
      throw new Error(
        "handleContainerVirtualRectingRequiredEvent: Component not found"
      );
    }

    const containerBoundingClientRect =
      container.element.getBoundingClientRect();
    const left = containerBoundingClientRect.left - GlBoundingClientRect.left;
    const top = containerBoundingClientRect.top - GlBoundingClientRect.top;
    component.glc.setPosAndSize(left, top, width, height);
  };

  const handleContainerVirtualVisibilityChangeRequiredEvent = (
    container,
    visible
  ) => {
    const component = MapComponents[container.state.refId];
    if (!component || !component?.glc) {
      throw new Error(
        "handleContainerVirtualVisibilityChangeRequiredEvent: Component not found"
      );
    }
    component.glc.setVisibility(visible);
  };

  const handleContainerVirtualZIndexChangeRequiredEvent = (
    container,
    logicalZIndex,
    defaultZIndex
  ) => {
    const component = MapComponents[container.state.refId];
    if (!component || !component?.glc) {
      throw new Error(
        "handleContainerVirtualZIndexChangeRequiredEvent: Component not found"
      );
    }

    component.glc.setZIndex(defaultZIndex);
  };

  const bindComponentEventListener = (container, itemConfig) => {
    let refId = -1;
    if (itemConfig && itemConfig.componentState) {
      refId = itemConfig.componentState.refId;
    } else {
      throw new Error(
        "bindComponentEventListener: component's ref id is required"
      );
    }

    let ref = GlcKeyPrefix.value + refId;
    const component = instance?.refs[ref];
    MapComponents[container.state.refId] = {
      container: container,
      glc: component[0],
    };

    container.virtualRectingRequiredEvent = (container, width, height) =>
      handleContainerVirtualRectingRequiredEvent(container, width, height);

    container.virtualVisibilityChangeRequiredEvent = (container, visible) =>
      handleContainerVirtualVisibilityChangeRequiredEvent(container, visible);

    container.virtualZIndexChangeRequiredEvent = (
      container,
      logicalZIndex,
      defaultZIndex
    ) =>
      handleContainerVirtualZIndexChangeRequiredEvent(
        container,
        logicalZIndex,
        defaultZIndex
      );

    return {
      component,
      virtual: true,
    };
  };

  const unbindComponentEventListener = (container) => {
    let refId = container.state.refId;
    let removeId = container.state.id;
    const component = MapComponents[refId];
    if (!component || !component?.glc) {
      throw new Error("handleUnbindComponentEvent: Component not found");
    }

    delete MapComponents[refId];
    delete AllComponents.value[refId];
    delete IdToRef[removeId];
    UnusedIndexes.push(refId);
  };

  GLayout = new VirtualLayout(
    GLRoot.value,
    bindComponentEventListener,
    unbindComponentEventListener
  );

  GLayout.beforeVirtualRectingEvent = handleBeforeVirtualRectingEvent;

  GLayout.on("focus", (e) => {
    let state = e.target.container.state;
    emit("update:workingItemId", state.id);
  });

  GLayout.on("componentCreated", (e) => {
    // record id-refid pair
    let state = e.target.container.state;
    IdToRef[state.id] = state.refId;
  });

  GLayout.on("activeContentItemChanged", (e) => {
    let state = e.container.state;
    emit("update:workingItemId", state.id);
    nextTick(() => {
      // wait until layout is updated
      // this is needed for closing component
      emit("layoutchanged");
    });
  });
});

/*******************
 * Expose
 *******************/
defineExpose({
  addGLComponent,
  removeGLComponent,
  loadGLLayout,
  getLayoutConfig,
  resize,
  initialized,
});
</script>
