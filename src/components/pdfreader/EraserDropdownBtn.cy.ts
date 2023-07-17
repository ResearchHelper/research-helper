import { EraserType } from "src/backend/database";
import EraserDropdownBtn from "./EraserDropdownBtn.vue";

describe("<EraserDropdownBtn />", () => {
  it("renders - strokeEraser", () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(EraserDropdownBtn, {
      props: {
        eraserType: EraserType.STROKE,
        eraserThickness: 20,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-toggle")
      .get('[aria-pressed="true"]')
      .should("have.text", "Stroke Eraser");
    cy.dataCy("input").should("be.disabled").and("have.value", 20);
  });
  it("renders - pixelEraser", () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(EraserDropdownBtn, {
      props: {
        eraserType: EraserType.PIXEL,
        eraserThickness: 20,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-toggle")
      .get('[aria-pressed="true"]')
      .should("have.text", "Pixel Eraser");
    cy.dataCy("input").should("have.value", 20);
  });
  it("update:inkThickness - slider", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(EraserDropdownBtn, {
      props: {
        eraserType: EraserType.PIXEL,
        eraserThickness: 5,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("slider")
      .trigger("mousedown", "right")
      .invoke("attr", "aria-valuemax")
      .then((max) => {
        if (!max) throw new Error("should have value");
        vue.then(({ wrapper }) => {
          // emit once when menu opens
          // emit another time after typed
          expect(wrapper.emitted("update:eraserThickness")?.slice(-1)).to.eql([
            [parseFloat(max)],
          ]);
        });
      });
  });
  it("update:eraserThickness - input normal", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(EraserDropdownBtn, {
      props: {
        eraserType: EraserType.PIXEL,
        eraserThickness: 5,
      },
    });

    let value = "20";
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input").clear().type(value);
    vue.then(({ wrapper }) => {
      // emit once when menu opens
      // emit another time after typed
      expect(wrapper.emitted("update:eraserThickness")?.slice(-1)).to.eql([
        [parseFloat(value)],
      ]);
    });
  });
  it("update:eraserThickness - input negative", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(EraserDropdownBtn, {
      props: {
        eraserType: EraserType.PIXEL,
        eraserThickness: 5,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input").clear().type("-10");
    cy.dataCy("slider")
      .invoke("attr", "aria-valuemin")
      .then((min) => {
        if (!min) throw new Error("should have value");
        vue.then(({ wrapper }) => {
          // emit once when menu opens
          // emit another time after typed
          expect(wrapper.emitted("update:eraserThickness")?.slice(-1)).to.eql([
            [parseFloat(min)],
          ]);
        });
      });
  });
});
