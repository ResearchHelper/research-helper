import { AnnotationType, PDFState } from "src/backend/database";
import PDFToolBar from "./PDFToolBar.vue";

const spreadMode = ["No Spreads", "Odd Spreads", "Even Spreads"];

function testcase(
  pdfState: {
    currentPageNumber: number;
    pagesCount: number;
    currentScale: number;
    spreadMode: number;
  },
  pageLabels: string[],
  rightMenuSize: number
) {
  cy.mount(PDFToolBar, {
    props: { pdfState, pageLabels, rightMenuSize },
  });

  // page control
  const pageControl = cy.get('[data-cy="page-control"]');
  if (pageLabels.length > 0)
    pageControl
      .find("span")
      .should(
        "have.text",
        `(${pdfState.currentPageNumber} of ${pdfState.pagesCount})`
      );
  else {
    pageControl
      .find("input")
      .should("have.value", pageLabels[pdfState.currentPageNumber]);
    pageControl.get("span").should("have.text", `of ${pdfState.pagesCount}`);
  }

  // view dropdown
  cy.get('[data-cy="btn-dropdown-view"]').click();

  // scale
  cy.get('[data-cy="scale"]').should(
    "have.text",
    Math.trunc(pdfState.currentScale * 100) + "%"
  );

  // spread
  cy.get('[data-cy="btn-toggle-spread"]')
    .children(".text-primary")
    .should("have.text", spreadMode[pdfState.spreadMode]);
}

describe("<PDFToolBar />", () => {
  it("test case 1", () => {
    const pdfState = {
      currentPageNumber: 1,
      pagesCount: 100,
      currentScale: 1,
      spreadMode: 0,
    };

    const pageLabels = [];
    for (let i = 1; i <= 100; i++) {
      pageLabels.push(i.toString());
    }

    const rightMenuSize = 10;

    testcase(pdfState, pageLabels, rightMenuSize);
  });

  it("test case 2", () => {
    const pdfState = {
      currentPageNumber: 2,
      pagesCount: 50,
      currentScale: 1.2,
      spreadMode: 1,
    };

    const pageLabels = ["a", "b", "c"];
    for (let i = 1; i <= 50 - 4; i++) {
      pageLabels.push(i.toString());
    }

    const rightMenuSize = 10;

    testcase(pdfState, pageLabels, rightMenuSize);
  });
});
