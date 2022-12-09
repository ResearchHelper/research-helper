import { defineStore } from "pinia";
import { db } from "src/backend/database";

export const usePDFStateStore = defineStore("pdfStateStore", {
  state: () => ({
    // runtime needed and saving needed
    _id: "",
    _rev: "",
    projectId: "",
    pagesCount: 0,
    currentPageNumber: 1,
    currentScale: 1,
    currentScaleValue: "1",
    spreadMode: 0,
    tool: "cursor",
    color: "#FFFF00",

    // runtime needed but not saving
    search: {
      query: "",
      highlightAll: true,
      caseSensitive: false,
      entireWord: false,
    },
    matchesCount: { current: -1, total: 0 },

    outline: null,
    selectedOutlineNode: null,
  }),

  actions: {
    initState(projectId) {
      this._id = "";
      this._rev = "";
      this.projectId = projectId;
      this.pagesCount = 0;
      this.currentPageNumber = 1;
      this.currentScale = 1;
      this.currentScaleValue = "1";
      this.spreadMode = 0;
      this.tool = "cursor";
      this.color = "#ffff00";
      (this.search = {
        query: "",
        highlightAll: true,
        caseSensitive: false,
        entireWord: false,
      }),
        (this.matchesCount = { current: -1, total: 0 });
    },

    async getPDFState(projectId) {
      // first init the states
      this.initState(projectId);

      // get from backend
      try {
        let result = await db.find({
          selector: { datatype: "pdf_state", projectId: this.projectId },
        });

        let state = result.docs[0];
        if (!!state) {
          this._id = state._id;
          this._rev = state._rev;
          this.projectId = state.projectId;

          this.pagesCount = state.pagesCount;
          this.currentPageNumber = state.currentPageNumber;
          this.currentScale = state.currentScale;
          this.currentScaleValue = state.currentScaleValue;
          this.spreadMode = state.spreadMode;
          this.tool = state.tool;
          this.color = state.color;
        }

        return {
          currentPageNumber: this.currentPageNumber,
          currentScaleValue: this.currentScaleValue,
          spreadMode: this.spreadMode,
          tool: this.tool,
          color: this.color,
        };
      } catch (err) {
        console.log(err);
      }
    },

    async savePDFState() {
      //save to backend
      let state = {
        datatype: "pdf_state",
        projectId: this.projectId,
        pagesCount: this.pagesCount,
        currentPageNumber: this.currentPageNumber,
        currentScale: this.currentScale,
        currentScaleValue: this.currentScaleValue,
        spreadMode: this.spreadMode,
        tool: this.tool,
        color: this.color,
        search: this.search,
      };

      if (!!this._id) {
        state._id = this._id;
        state._rev = this._rev;
        let result = await db.put(state);
        this._rev = result.rev; // set new rev number
      } else {
        let result = await db.post(state);
        this._id = result.id;
        this._rev = result.rev;
      }
    },
  },
});
