import RightMenu from "./RightMenu.vue";
import {
  KEY_project,
  KEY_annots,
  KEY_outline,
  KEY_selectedAnnotId,
  KEY_setActiveAnnot,
  KEY_updateAnnot,
  KEY_deleteAnnot,
  KEY_clickTOC,
} from "./injectKeys";
import { TOCNode } from "src/backend/database";

describe("<RightMenu />", () => {
  beforeEach(() => {
    cy.fixture("project.json").as("project");
    cy.fixture("outline.json").as("outline");
    cy.fixture("annots.json").as("annots");
  });
  it("renders", function () {
    cy.mount(RightMenu, {
      global: {
        provide: {
          [KEY_project]: this.project,
          [KEY_outline]: this.outline,
          [KEY_annots]: this.annots,
          [KEY_selectedAnnotId]: this.annots[0]._id,
          [KEY_setActiveAnnot]: (id: string) => {
            console.log(id);
          },
          [KEY_updateAnnot]: (params: any) => {
            console.log("updateAnnot:", params);
          },
          [KEY_deleteAnnot]: (id: string) => {
            console.log("deleteAnnot:", id);
          },
          [KEY_clickTOC]: (node: TOCNode) => {
            console.log("clickTOC:", node);
          },
        },
      },
    });
  });
});
