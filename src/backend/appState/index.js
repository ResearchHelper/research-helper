import { db } from "../database";
import debounce from "lodash/debounce";

/*****************************
 * App State
 *****************************/

async function getAppState() {
  try {
    return await db.get("appState");
  } catch (error) {
    // cannot get appState

    let state = {
      _id: "appState",
      dataType: "appState",
    };
    await db.put(state);
    return state;
  }
}

async function _updateAppState(state) {
  let oldState = await db.get("appState");
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
      dataType: "layout",
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
