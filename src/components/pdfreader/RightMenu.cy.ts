import RightMenu from "./RightMenu.vue";
import { KEY_project } from "./injectKeys";

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
        },
      },
    });
  });
});
