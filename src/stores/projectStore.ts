import { defineStore } from "pinia";
import { Note, NoteType, Project, AppState } from "src/backend/database";
import {
  getNotes,
  getNote,
  addNote,
  deleteNote,
  updateNote,
  createNote,
} from "src/backend/project/note";
import {
  getProjects,
  getProject,
  addProject,
  deleteProject,
  updateProject,
  renamePDF,
  attachPDF,
  createProject,
} from "src/backend/project/project";
import { sortTree } from "src/backend/project/utils";

export const useProjectStore = defineStore("projectStore", {
  state: () => ({
    ready: false, // is project loaded
    selected: [] as (Project | Note)[], // projectIds selected by checkbox
    projects: [] as Project[], // array of projects
    openedProjects: [] as Project[], // array of opened projects

    updatedProject: {} as Project, // for updating window tab name
  }),

  actions: {
    /**
     * Get project by projectId
     * @param projectId
     * @returns
     */
    getProject(projectId: string) {
      return this.projects.find((project) => project._id === projectId);
    },

    async getProjectFromDB(projectId: string) {
      let project = (await getProject(projectId)) as Project;
      project.children = await getNotes(projectId);
      return project;
    },

    async loadOpenedProjects(openedProjectIds: string[] | Set<string>) {
      let pushedIds = this.openedProjects.map((p) => p._id);
      for (let projectId of openedProjectIds) {
        if (pushedIds.includes(projectId)) continue;
        let project = (await this.getProjectFromDB(projectId)) as Project;
        sortTree(project); // sort notes by alphabet
        this.openedProjects.push(project);
        pushedIds.push(projectId);
      }
    },

    async openProject(projectId: string) {
      let project = (await this.getProjectFromDB(projectId)) as Project;
      if (!this.openedProjects.map((p) => p._id).includes(project._id))
        this.openedProjects.push(project);
    },

    /**
     * Create a project data
     * @param folderId
     */
    createProject(folderId: string) {
      return createProject(folderId);
    },

    /**
     * Add a project to the list
     * @param project
     * @param saveToDB
     */
    async addProject(project: Project, saveToDB?: boolean) {
      if (saveToDB) project = (await addProject(project)) as Project;
      if (!this.getProject(project._id)) this.projects.push(project);
    },

    /**
     * Update a project
     * This maintains both lists, openedProjects and projects
     * @param projectId
     * @param props
     */
    async updateProject(projectId: string, props: Project) {
      let newProject = (await updateProject(projectId, props)) as Project;
      this._updateProjectUI(newProject);
    },

    _updateProjectUI(newProject: Project) {
      let projectInList = this.projects.find((p) => p._id === newProject._id);
      let projectInOpened = this.openedProjects.find(
        (p) => p._id === newProject._id
      );

      if (projectInList) {
        // project exists in list
        Object.assign(projectInList, newProject);
        // project exists in both lists
        if (projectInOpened) Object.assign(projectInOpened, newProject);
      } else if (projectInOpened) {
        // project exists in openedProjects only
        Object.assign(projectInOpened, newProject);
      }

      this.updatedProject = newProject;
    },

    async deleteProject(
      projectId: string,
      deleteFromDB: boolean,
      folderId?: string
    ) {
      let ind = this.projects.findIndex((p) => p._id === projectId);
      if (ind > -1) {
        // update ui
        this.projects.splice(ind, 1);
        // update db
        await deleteProject(projectId, deleteFromDB, folderId);
      }
    },

    /**
     * Load projects and their notes from database
     * @param folderId
     */
    async loadProjects(folderId: string) {
      this.projects = await getProjects(folderId);
      for (let project of this.projects)
        project.children = await getNotes(project._id);

      this.ready = true;
    },

    async renamePDF(projectId: string) {
      let project = this.getProject(projectId);
      // update db and ui
      if (project) Object.assign(project, await renamePDF(project));
    },

    async attachPDF(projectId: string, replaceStoredCopy: boolean) {
      // update db
      let newProject = await attachPDF(projectId, replaceStoredCopy);
      // update ui
      let project = this.getProject(projectId);
      if (newProject && project) Object.assign(project, newProject);
    },

    /**
     * Create a note data
     * @param projectId
     * @param type
     */
    createNote(projectId: string, type: NoteType) {
      return createNote(projectId, type);
    },

    /**
     * Add a note to database
     * and creates the actual markdown file in project folder
     */
    async addNote(note: Note) {
      // update db
      note = (await addNote(note)) as Note;
      // update ui
      let project = await this.getProjectFromDB(note.projectId);
      this._updateProjectUI(project);
    },

    async updateNote(noteId: string, props: Note) {
      // update db
      let note = (await updateNote(noteId, props)) as Note;
      // update ui
      let project = await this.getProjectFromDB(note.projectId);
      this._updateProjectUI(project);
    },

    async deleteNote(noteId: string) {
      let note = (await this.getNoteFromDB(noteId)) as Note;
      await deleteNote(noteId);
      let project = await this.getProjectFromDB(note.projectId);
      this._updateProjectUI(project);
    },

    async getNoteFromDB(noteId: string) {
      return await getNote(noteId);
    },
  },
});
