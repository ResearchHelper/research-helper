import { db } from "../database";

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

async function updateLayout(config) {
  let layout = await db.get("layout");
  layout.config = config;
  await db.put(layout);
}

export { getLayout, updateLayout };
