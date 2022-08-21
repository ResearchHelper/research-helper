import { v4 as uuidv4 } from "uuid";
import { defineStore } from "pinia";

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    // page
    currentPage: "library",

    // layout
    leftMenuSize: 20,
    infoPaneSize: 0,

    // actionbar
    addedFiles: [],
    searchString: "",

    // tree view
    folders: [],
    selectedFolderId: "library",
    projectIds: [],
    selectedProject: null,

    // table view
    openedProjects: [],
    workingProject: null, // this is in the openedProjects list

    // pdf states
    pdfStates: {},
  }),

  actions: {
    toggleLeftMenu() {
      this.leftMenuSize = this.leftMenuSize > 0 ? 0 : 20;
    },

    toggleInfoPane() {
      this.infoPaneSize = this.infoPaneSize > 0 ? 0 : 25;
    },

    loadTree() {
      fetch("http://localhost:5000/folderTree", {
        mode: "cors",
        method: "GET",
      })
        .then((response) => {
          return response.json();
        })
        .then((folders) => {
          this.folders = folders;
          this.projectIds = folders[0].projectIds;
        });
    },

    saveTree() {
      fetch("http://localhost:5000/folderTree", {
        mode: "cors",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.folders),
      }).then((response) => {
        console.log(response);
      });
    },

    getTreeNodeByKey(nodeKey) {
      // attach the tree method to this function when tree mounted
    },

    addProject(files) {
      let node = this.getTreeNodeByKey("library");
      for (let file of files) {
        let data = {
          path: file.path,
          projectId: uuidv4(),
          projectType: "paper",
        };
        fetch("http://localhost:5000/extract", {
          mode: "cors",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
          .then((response) => {
            return response.json();
          })
          .then((meta) => {
            node.projectIds.push(meta.projectId);
            this.saveTree();
          });
      }
    },

    deleteProject(deleteFromDB) {
      if (deleteFromDB === true) {
        console.log("delete from db");
        fetch(
          "http://localhost:5000/project/" + this.selectedProject.projectId,
          {
            mode: "cors",
            method: "DELETE",
          }
        ).then((response) => {
          console.log(response);
        });
      }

      let node = this.getTreeNodeByKey(this.selectedFolderId);
      node.projectIds = node.projectIds.filter(
        (projectId) => projectId !== this.selectedProject.projectId
      );
      this.saveTree();

      // update ui
      this.projectIds = node.projectIds;
    },

    setPDFState(state) {
      let id = this.workingProject.projectId;
      if (!(id in this.pdfStates)) this.pdfStates[id] = {};

      for (let k in state) {
        this.pdfStates[id][k] = state[k];
      }
    },

    savePDFStates() {
      console.log("save:", this.pdfStates);
    },
  },
});
