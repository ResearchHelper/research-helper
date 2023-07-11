import RightMenu from "./RightMenu.vue";
import { KEY_project, KEY_outline, KEY_clickTOC } from "./injectKeys";
import { TOCNode } from "src/backend/database";

describe("<RightMenu />", () => {
  beforeEach(() => {
    cy.fixture("project.json").as("project");
    cy.fixture("outline.json").as("outline");
  });
  it("renders", function () {
    cy.mount(RightMenu, {
      global: {
        provide: {
          [KEY_project]: this.project,
          [KEY_outline]: this.outline,
          [KEY_clickTOC]: (node: TOCNode) => {
            console.log("clickTOC:", node);
          },
        },
      },
    });
  });
});
