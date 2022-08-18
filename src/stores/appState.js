import { defineStore } from "pinia";

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    currentPage: 0,
    selectedProject: null,
    leftMenuSize: 20,
    infoPaneSize: 0,
    openedProjects: [],
    workingProject: null, // this is in the openedProjects list
    _pdfState: {},
  }),

  getters: {
    // have to calculate content size because splitpanes does not stretch the middle pane for me
    contentSize: (state) => 100 - state.leftMenuSize - state.infoPaneSize,
    // pdfState: (state) => state._pdfState[state.workingProject.projectId]
  },

  actions: {
    toggleLeftMenu() {
      this.leftMenuSize = this.leftMenuSize > 0 ? 0 : 20;
    },

    toggleInfoPane() {
      this.infoPaneSize = this.infoPaneSize > 0 ? 0 : 25;
    },

    savePDFState(pdfViewer) {
      let id = this.workingProject.projectId;
      console.log(pdfViewer.pagesCount);
      this._pdfState[id] = {
        pagesCount: pdfViewer.pagesCount,
        currentPageNumber: pdfViewer.currentPageNumber,
        currentScale: pdfViewer.currentScale,
        currentScaleValue: pdfViewer.currentScaleValue,
        spreadMode: pdfViewer.spreadMode,
      };
    },
  },
});
