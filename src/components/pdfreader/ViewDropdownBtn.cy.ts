import ViewDropdownBtn from "./ViewDropdownBtn.vue";
import { SpreadMode } from "src/backend/database";

describe("<ViewDropdownBtn />", () => {
  it("renders - isFullscreen=false", () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(ViewDropdownBtn, {
      props: {
        currentScale: 1.0,
        spreadMode: SpreadMode.NO_SPREAD,
        isFullscreen: false,
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("menu-dropdown");
    cy.dataCy("scale").should("have.text", "100%");
    cy.dataCy("btn-toggle-spread")
      .children(".text-primary")
      .should("have.text", "No Spreads");
    cy.dataCy("btn-toggle-fullscreen").should("have.text", "fullscreen");
  });
  it("renders - isFullscreen=true", () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(ViewDropdownBtn, {
      props: {
        currentScale: 1.0,
        spreadMode: SpreadMode.NO_SPREAD,
        isFullscreen: true,
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("menu-dropdown");
    cy.dataCy("scale").should("have.text", "100%");
    cy.dataCy("btn-toggle-spread")
      .children(".text-primary")
      .should("have.text", "No Spreads");
    cy.dataCy("btn-toggle-fullscreen").should("have.text", "fullscreen_exit");
  });
  it("changeScale - page-width", () => {
    const vue = cy.mount(ViewDropdownBtn, {
      props: {
        currentScale: 1.0,
        spreadMode: SpreadMode.NO_SPREAD,
        isFullscreen: false,
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-page-width").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("changeScale")).to.eql([
        [{ scaleValue: "page-width" }],
      ]);
    });
  });
  it("changeScale - page-height", () => {
    const vue = cy.mount(ViewDropdownBtn, {
      props: {
        currentScale: 1.0,
        spreadMode: SpreadMode.NO_SPREAD,
        isFullscreen: false,
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-page-height").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("changeScale")).to.eql([
        [{ scaleValue: "page-height" }],
      ]);
    });
  });
  it("changeScale - zoom-in", () => {
    const vue = cy.mount(ViewDropdownBtn, {
      props: {
        currentScale: 1.0,
        spreadMode: SpreadMode.NO_SPREAD,
        isFullscreen: false,
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-zoom-in").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("changeScale")).to.eql([[{ delta: 0.1 }]]);
    });
  });
  it("changeScale - zoom-out", () => {
    const vue = cy.mount(ViewDropdownBtn, {
      props: {
        currentScale: 1.0,
        spreadMode: SpreadMode.NO_SPREAD,
        isFullscreen: false,
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-zoom-out").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("changeScale")).to.eql([[{ delta: -0.1 }]]);
    });
  });
  it("changeSpreadMode - odd", () => {
    const vue = cy.mount(ViewDropdownBtn, {
      props: {
        currentScale: 1.0,
        spreadMode: SpreadMode.NO_SPREAD,
        isFullscreen: false,
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-toggle-spread").children(":nth-child(2)").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("changeSpreadMode")).to.eql([[1]]);
    });
  });
  it("changeSpreadMode - even", () => {
    const vue = cy.mount(ViewDropdownBtn, {
      props: {
        currentScale: 1.0,
        spreadMode: SpreadMode.NO_SPREAD,
        isFullscreen: false,
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-toggle-spread").children(":nth-child(3)").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("changeSpreadMode")).to.eql([[2]]);
    });
  });
  it("toggleFullscreen", () => {
    const vue = cy.mount(ViewDropdownBtn, {
      props: {
        currentScale: 1.0,
        spreadMode: SpreadMode.NO_SPREAD,
        isFullscreen: false,
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-toggle-fullscreen").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("toggleFullscreen")).to.have.length(1);
    });
  });
});
