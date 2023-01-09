import { db } from "../database";
import debounce from "lodash/debounce";

/*****************************
 * App State
 *****************************/

async function getAppState() {
  try {
    return await db.get("app_state");
  } catch (error) {
    // cannot get app_state

    let state = {
      _id: "app_state",
      // user data path
      storagePath: "/home/huntfeng/projects/research-helper-quasar/storage",

      // layout
      leftMenuSize: 20,
      showLeftMenu: false,

      // tree view
      selectedFolderId: "",

      // projects
      workingItemId: "library", // workingItem
      openedProjectIds: new Set(), // for projectTree
    };

    await db.put(state);
    return state;
  }
}

async function _updateAppState(state) {
  let oldState = await db.get("app_state");
  state._rev = oldState._rev;
  await db.put(state);
}

const updateAppState = debounce(_updateAppState, 200);

/*****************************
 * Layout
 *****************************/

async function getLayout() {
  try {
    return await db.get("layout");
  } catch (error) {
    // cannot get layout
    let layout = {
      _id: "layout",
      config: {
        settings: {
          showPopoutIcon: false,
          showMaximiseIcon: false,
          // must have close icon otherwise the last tab can't close
          showCloseIcon: true,
        },
        dimensions: {
          borderWidth: 3,
          headerHeight: 36,
        },
        root: {
          type: "stack",
          content: [
            {
              type: "component",
              title: "Library",
              componentType: "LibraryPage",
              componentState: { id: "library" },
            },
          ],
        },
      },
    };

    await db.put(layout);
    return layout;
  }
}

async function _updateLayout(config) {
  let layout = await db.get("layout");
  layout.config = config;
  await db.put(layout);
}

const updateLayout = debounce(_updateLayout, 200);

export { getLayout, updateLayout, getAppState, updateAppState };
