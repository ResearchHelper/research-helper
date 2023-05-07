import ExportDialog from "./ExportDialog.vue";

describe("<ExportDialog />", () => {
  it("cancel", () => {
    const vue = cy.mount(ExportDialog, { props: { show: true } });
    cy.dataCy("btn-cancel").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
    });
  });

  it("confirm format!=bibliorgraphy", () => {
    const vue = cy.mount(ExportDialog, { props: { show: true } });
    const formats = [
      { label: "BibTeX", value: "bibtex" },
      { label: "BibLaTeX", value: "biblatex" },
      { label: "CLS-JSON", value: "json" },
      { label: "RIS", value: "ris" },
    ];
    let randomFormat = formats[Math.floor(Math.random() * formats.length)];
    const formatSelector = cy.dataCy("format-select");
    formatSelector.select(randomFormat.label);

    cy.dataCy("btn-confirm").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
      console.log(wrapper.emitted("confirm"));
      expect(wrapper.emitted("confirm")).to.eql([[randomFormat.value, null]]);
    });
  });

  it("confirm format==bibliorgraphy", () => {
    const vue = cy.mount(ExportDialog, { props: { show: true } });
    const templates = [
      { label: "APA", value: "apa" },
      { label: "Vancouver", value: "vancouver" },
      { label: "Havard1", value: "havard1" },
    ];
    let randomTemplate =
      templates[Math.floor(Math.random() * templates.length)];
    cy.dataCy("format-select").select("Bibliography");
    const templateSelector = cy.dataCy("template-select");
    templateSelector.select(randomTemplate.label);

    cy.dataCy("btn-confirm").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
      expect(wrapper.emitted("confirm")).to.eql([
        ["bibliography", { template: randomTemplate.value }],
      ]);
    });
  });
});
