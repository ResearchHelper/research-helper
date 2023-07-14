import AnnotCard from "./AnnotCard.vue";
import { AnnotationFactory } from "src/backend/pdfannotation";

describe("<AnnotCard />", () => {
  beforeEach(() => {
    cy.fixture("annots.json").as("annotDatas");
  });

  it("renders", function () {
    let annotFactory = new AnnotationFactory("projectId");
    let annot = annotFactory.build(this.annotDatas);
    cy.mount(AnnotCard, {
      props: {
        annot: this.annots[0],
      },
    });

    cy.dataCy("annot-content").should("have.text", "∫f\\int f∫f");
  });

  it("open menu", function () {
    cy.mount(AnnotCard, {
      props: {
        annot: this.annots[0],
      },
    });

    cy.dataCy("btn-menu").click();
    cy.dataCy("annot-menu");
  });
});
