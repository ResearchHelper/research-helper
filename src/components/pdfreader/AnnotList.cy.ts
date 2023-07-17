import AnnotList from "./AnnotList.vue";
import { Annotation } from "src/backend/pdfannotation/annotations";
import { AnnotationFactory } from "src/backend/pdfannotation";
import { AnnotationData, AnnotationType } from "src/backend/database";

describe("<AnnotList />", () => {
  beforeEach(() => {
    cy.fixture("annotDatas.json").as("annotDatas");
  });
  it("renders", function () {
    let annotFactory = new AnnotationFactory("projectId");
    let annots = [];
    for (let data of this.annotDatas) {
      annots.push(annotFactory.build(data) as Annotation);
    }
    cy.mount(AnnotList, {
      props: {
        selectedId: annots[0].data._id,
        annots: annots,
      },
    });

    cy.get('[data-cy*="annot-card"]').should(
      "have.length",
      this.annotDatas.filter(
        (data: AnnotationData) => data.type !== AnnotationType.INK
      ).length
    );
  });
  it("changeActive", function () {
    let annotFactory = new AnnotationFactory("projectId");
    let annots = [] as Annotation[];
    console.log("datas", this.annotDatas);
    for (let data of this.annotDatas) {
      annots.push(annotFactory.build(data) as Annotation);
    }
    const vue = cy.mount(AnnotList, {
      props: {
        selectedId: annots[0].data._id,
        annots: annots,
      },
    });

    let card0 = cy.dataCy("annot-card-0");
    card0.should("have.class", "activeAnnotation");
    let card1 = cy.dataCy("annot-card-1");
    card1.click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("setActive")).to.eql([[annots[1].data._id]]);
    });
  });
});
