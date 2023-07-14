import InkDropdownBtn from "./InkDropdownBtn.vue";

describe("<InkDropdownBtn />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(InkDropdownBtn, {
      props: {
        inkThickness: 5,
        inkOpacity: 0.8,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input-thickness").should("have.value", 5);
    cy.dataCy("input-opacity").should("have.value", 80);
  });
  it("update:inkThickness - slider", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(InkDropdownBtn, {
      props: {
        inkThickness: 5,
        inkOpacity: 0.8,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("slider-thickness")
      .trigger("mousedown", "right")
      .invoke("attr", "aria-valuemax")
      .then((max) => {
        if (!max) throw new Error("should have value");
        vue.then(({ wrapper }) => {
          // emit once when menu opens
          // emit another time after typed
          expect(wrapper.emitted("update:inkThickness")?.slice(-1)).to.eql([
            [parseFloat(max)],
          ]);
        });
      });
  });
  it("update:inkOpacity - slider", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(InkDropdownBtn, {
      props: {
        inkThickness: 5,
        inkOpacity: 0.8,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("slider-opacity")
      .trigger("mousedown", "right")
      .invoke("attr", "aria-valuemax")
      .then((max) => {
        if (!max) throw new Error("should have value");
        vue.then(({ wrapper }) => {
          // emit once when menu opens
          // emit another time after typed
          expect(wrapper.emitted("update:inkOpacity")?.slice(-1)).to.eql([
            [parseFloat(max) / 100],
          ]);
        });
      });
  });
  it("update:inkThickness - input normal", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(InkDropdownBtn, {
      props: {
        inkThickness: 5,
        inkOpacity: 0.8,
      },
    });

    let value = "20";
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input-thickness").clear().type(value);
    vue.then(({ wrapper }) => {
      // emit once when menu opens
      // emit another time after typed
      expect(wrapper.emitted("update:inkThickness")?.slice(-1)).to.eql([
        [parseFloat(value)],
      ]);
    });
  });
  it("update:inkThickness - input negative", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(InkDropdownBtn, {
      props: {
        inkThickness: 5,
        inkOpacity: 0.8,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input-thickness").clear().type("-10");
    cy.dataCy("slider-thickness")
      .invoke("attr", "aria-valuemin")
      .then((min) => {
        if (!min) throw new Error("should have value");
        vue.then(({ wrapper }) => {
          // emit once when menu opens
          // emit another time after typed
          expect(wrapper.emitted("update:inkThickness")?.slice(-1)).to.eql([
            [parseFloat(min)],
          ]);
        });
      });
  });
  it("update:inkThickness - input large", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(InkDropdownBtn, {
      props: {
        inkThickness: 5,
        inkOpacity: 0.8,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input-thickness").clear().type("100");
    cy.dataCy("slider-thickness")
      .invoke("attr", "aria-valuemax")
      .then((max) => {
        if (!max) throw new Error("should have value");
        vue.then(({ wrapper }) => {
          // emit once when menu opens
          // emit another time after typed
          expect(wrapper.emitted("update:inkThickness")?.slice(-1)).to.eql([
            [parseFloat(max)],
          ]);
        });
      });
  });
  it("update:inkOpacity - input normal", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(InkDropdownBtn, {
      props: {
        inkThickness: 5,
        inkOpacity: 0.8,
      },
    });

    let value = "20";
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input-opacity").clear().type(value);
    vue.then(({ wrapper }) => {
      // emit once when menu opens
      // emit another time after typed
      expect(wrapper.emitted("update:inkOpacity")?.slice(-1)).to.eql([
        [parseFloat(value) / 100],
      ]);
    });
  });
  it("update:inkOpacity - input negative", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(InkDropdownBtn, {
      props: {
        inkThickness: 5,
        inkOpacity: 0.8,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input-opacity").clear().type("-10");
    cy.dataCy("slider-opacity")
      .invoke("attr", "aria-valuemin")
      .then((min) => {
        if (!min) throw new Error("should have value");
        vue.then(({ wrapper }) => {
          // emit once when menu opens
          // emit another time after typed
          expect(wrapper.emitted("update:inkOpacity")?.slice(-1)).to.eql([
            [parseFloat(min) / 100],
          ]);
        });
      });
  });
  it("update:inkOpacity - input large", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(InkDropdownBtn, {
      props: {
        inkThickness: 5,
        inkOpacity: 0.8,
      },
    });

    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input-opacity").clear().type("1000");
    cy.dataCy("slider-opacity")
      .invoke("attr", "aria-valuemax")
      .then((max) => {
        if (!max) throw new Error("should have value");
        vue.then(({ wrapper }) => {
          // emit once when menu opens
          // emit another time after typed
          expect(wrapper.emitted("update:inkOpacity")?.slice(-1)).to.eql([
            [parseFloat(max) / 100],
          ]);
        });
      });
  });
});
