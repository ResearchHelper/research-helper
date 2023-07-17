import PDFApplication from "src/backend/pdfreader";
import PDFToolBar from "./PDFToolBar.vue";
import { PDFState } from "src/backend/database";
import { KEY_pdfApp } from "./injectKeys";

function testPageControl(pdfState: PDFState, pageLabels: string[]) {
  const pdfApp = new PDFApplication("projectId");
  pdfApp.state = pdfState;
  pdfApp.pageLabels = pageLabels;

  cy.mount(PDFToolBar, {
    global: {
      provide: {
        [KEY_pdfApp]: pdfApp,
      },
    },
  });

  // page control
  if (pdfApp.pageLabels?.length > 0) {
    // I cannot factor out cy.dataCy("page-control") as a variable
    // otherwise the query becomes weird...
    cy.dataCy("page-control")
      .children("input")
      .should(
        "have.value",
        pdfApp.pageLabels[pdfApp.state.currentPageNumber - 1]
      );

    cy.dataCy("page-control")
      .children("span")
      .should(
        "have.text",
        ` (${pdfApp.state.currentPageNumber} of ${pdfApp.state.pagesCount}) `
      );
  } else {
    cy.dataCy("page-control")
      .children("input")
      .should("have.value", pdfApp.state.currentPageNumber);
    cy.dataCy("page-control")
      .children("span")
      .should("have.text", ` of ${pdfApp.state.pagesCount}`);
  }
}

describe("<PDFToolBar />", () => {
  it("renders - normal pageLabels", () => {
    let state = {
      dataType: "pdfState",
      projectId: "projectId",
      pagesCount: 100,
      currentPageNumber: 1,
      tool: "cursor",
      color: "#FFFF00",
    } as PDFState;

    let pageLabels = [];
    for (let i = 1; i <= 100; i++) {
      pageLabels.push(i.toString());
    }

    testPageControl(state, pageLabels);
  });
  it("renders - pageLabels with letters", () => {
    let state = {
      dataType: "pdfState",
      projectId: "projectId",
      pagesCount: 100,
      currentPageNumber: 1,
      tool: "cursor",
      color: "#FFFF00",
    } as PDFState;

    let pageLabels = ["a"];
    for (let i = 2; i <= 100; i++) {
      pageLabels.push(i.toString());
    }

    testPageControl(state, pageLabels);
  });
  it("renders - empty pageLabels", () => {
    let state = {
      dataType: "pdfState",
      projectId: "projectId",
      pagesCount: 100,
      currentPageNumber: 1,
      tool: "cursor",
      color: "#FFFF00",
    } as PDFState;

    let pageLabels = [] as string[];

    testPageControl(state, pageLabels);
  });
});
