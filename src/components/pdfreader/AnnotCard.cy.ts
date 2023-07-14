import AnnotCard from "./AnnotCard.vue";
import { AnnotationFactory } from "src/backend/pdfannotation";

describe("<AnnotCard />", () => {
  beforeEach(() => {
    cy.fixture("annots.json").as("annotDatas");
  });

  it("renders", function () {
    let annotFactory = new AnnotationFactory("projectId");
    let annot = annotFactory.build(this.annotDatas[0]);
    cy.mount(AnnotCard, {
      props: {
        annot: annot,
      },
    });

    cy.dataCy("annot-content").should("have.text", "∫f\\int f∫f");
  });

  it("open menu", function () {
    let annotFactory = new AnnotationFactory("projectId");
    let annot = annotFactory.build(this.annotDatas[0]);
    cy.mount(AnnotCard, {
      props: {
        annot: annot,
      },
    });

    cy.dataCy("btn-menu").click();
    cy.dataCy("annot-menu");
  });
});
