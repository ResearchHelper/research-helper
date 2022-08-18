<template>
    <!-- https://github.com/ParadeTo/vue-tree-list -->
    <div @contextmenu="contextMenu" class="tree-view-background px-1">
        <!-- confirm dialog -->
        <confirm ref="confirm"></confirm>

        <!-- context menu -->
        <v-menu
        v-model="showContextMenu"
        :position-x="x"
        :position-y="y"
        absolute
        offset-y>
            <div class="tree-menu-background py-2">
                <div class="tree-menu-item px-5" @click="onContextMenuClick">New Folder</div>
                <div class="tree-menu-item px-5" @click="onContextMenuClick">Rename Folder</div>
                <div class="tree-menu-item px-5" @click="onContextMenuClick">Delete Folder</div>
            </div>
        </v-menu>

        <!-- special folders -->
        <h2>My Documents</h2>
        <v-list-item-group 
        dense
        :ripple="false"
        color="primary"
        
        v-model="selectedSpecialFolderIndex"
        >
            <!-- disable the special folder so that user won't deselect it by clicking on it two times -->
            <v-list-item dense style="cursor:default" :disabled="isFolderDisabled[0]" @click="onSpecialNodeClick">
                <v-icon>mdi-folder-outline</v-icon>
                All Documents
            </v-list-item>
            <v-list-item dense style="cursor:default" :disabled="isFolderDisabled[1]" @click="onSpecialNodeClick">
                <v-icon>mdi-star-outline</v-icon>
                Favorites
            </v-list-item>
        </v-list-item-group>

        <v-divider></v-divider>

        <h2>My Groups</h2>
        <vue-tree-list
        @click="onClick"
        @change-name="onChangeName"
        @delete-node="onDel"
        @add-node="onAddNode"
        @drop="onDrop"
        @drop-before="onDropBefore"
        @drop-after="onDropAfter"
        :model="folders"
        default-tree-node-name="new folder"
        default-leaf-node-name="new file"
        v-bind:default-expanded="false"
        >
            <template v-slot:leafNameDisplay="slotProps">
                <span>
                {{ slotProps.model.name }}
                </span>
            </template>
        </vue-tree-list>

        <v-btn block @click="addNode(folders)">
            Add Folder
        </v-btn>
    </div>
</template>

<script language="javascript">
    import { VueTreeList, Tree, TreeNode } from 'vue-tree-list' // folder tree
    import {v4 as uuidv4} from 'uuid' // for generating unique id
    import confirm from "./ConfirmDialog.vue"
    
    export default {
        components: {
            VueTreeList,
            confirm
        },

        data() {
            return {
                folders: new Tree([]),
                specialFolder: [],

                // prevent deselect
                isFolderDisabled: [true, false],

                // selected folder
                selectedNode: null,
                selectedSpecialFolderIndex: 0, // default to All Documents

                // context menu
                showContextMenu: false,
                x: 0,
                y: 0,

                // warning dialog
                showDialog: false,
                warningMsg: "",
                confirm: false
            }
        },

        mounted() {
            this.loadTree()
            this.$root.$on("addProject", meta => this.addProject(meta))
            this.$root.$on("deleteProject", deleteFromDB => this.deleteProject(deleteFromDB))
            this.$root.$on("clickProject", selectedProject => {this.selectedProject = selectedProject})
        },


        methods: {
            loadTree() {
                fetch("http://localhost:5000/folderTree", {
                    mode: 'cors', 
                    method: "GET"
                })
                .then(response => {
                    return response.json()
                }).then(root => {
                    this.folders = new Tree(root.children)
                })

                fetch("http://localhost:5000/specialFolder", {
                    mode: 'cors', 
                    method: "GET"
                })
                .then(response => {
                    return response.json()
                }).then(specialFolder => {
                    this.specialFolder = specialFolder
                    // default to all documents
                    this.onSpecialNodeClick()
                })
            },

            saveTree() {
                function _dfs(oldNode) {
                    let newNode = {}

                    for (let k in oldNode) {
                        if (k !== 'children' && k !== 'parent') {
                        newNode[k] = oldNode[k]
                        }
                    }

                    // every node must have a children property
                    newNode.children = []

                    if (oldNode.children && oldNode.children.length > 0) {
                        for (let i=0; i<oldNode.children.length; i++) {
                            newNode.children.push(_dfs(oldNode.children[i]))
                        }
                    }
                    return newNode
                }

                fetch("http://localhost:5000/folderTree", {
                    mode: 'cors', 
                    method: "POST", 
                    headers: {"Content-Type": "application/json"}, 
                    body: JSON.stringify(_dfs(this.folders))
                })
                .then(response => {
                    console.log(response)
                })
                
                fetch("http://localhost:5000/specialFolder", {
                    mode: 'cors', 
                    method: "POST", 
                    headers: {"Content-Type": "application/json"}, 
                    body: JSON.stringify(this.specialFolder)
                })
                .then(response => {
                    console.log(response)
                })
            },

            addProject(meta) {
                if (this.selectedNode) {
                    this.selectedNode.projectIds.push(meta.projectId)
                    this.specialFolder[0].projectIds.push(meta.projectId) // also add to all documents
                }
                if (this.selectedSpecialFolderIndex !== undefined) {
                    this.specialFolder[this.selectedSpecialFolderIndex].projectIds.push(meta.projectId)
                }
                
                this.saveTree()
                // click the current folder to refresh the table
                this.$nextTick(() => {
                    if (this.selectedNode) {
                        this.$root.$emit("clickNode", this.selectedNode.projectIds)
                    }
                    if (this.selectedSpecialFolderIndex !== undefined) {
                        this.$root.$emit("clickNode", this.specialFolder[this.selectedSpecialFolderIndex].projectIds)
                    }
                })
            },

            deleteProject(deleteFromDB) {
                // remove from ui
                let projectId = this.selectedProject.projectId
                if (this.selectedNode) {
                    this.selectedNode.projectIds = this.selectedNode.projectIds.filter((value,index,arr) => {
                        return value !== projectId
                    })
                }

                if (this.selectedSpecialFolderIndex !== undefined) {
                    this.specialFolder[this.selectedSpecialFolderIndex].projectIds = this.specialFolder[this.selectedSpecialFolderIndex].projectIds.filter((value,index,arr) => {
                        return value !== projectId
                    })
                }

                // remove from database
                if (deleteFromDB) {
                    // remove this project from all special folders
                    for (let i=0; i<this.specialFolder.length; i++) {
                        this.specialFolder[i].projectIds = this.specialFolder[i].projectIds.filter((value,index,arr) => {
                            return value !== projectId
                        })
                    }
                    
                    // remove it from local storage
                    fetch("http://localhost:5000/project/"+projectId, {
                        mode: 'cors', 
                        method: "DELETE"
                    })
                    .then(response => {console.log(response)})
                }
                
                // save the tree
                this.saveTree()

                // click the current folder to refresh the table
                this.$nextTick(() => {
                    if (this.selectedNode) {
                        this.$root.$emit("clickNode", this.selectedNode.projectIds)
                    }
                    if (this.selectedSpecialFolderIndex !== undefined) {
                        this.$root.$emit("clickNode", this.specialFolder[this.selectedSpecialFolderIndex].projectIds)
                    }
                })
            },

            onDel(node) {
                // confirmation box comes out
                this.$refs.confirm.open("Delete Folder", "Are you sure you want to delete '"+node.name+"' and its subfolders? This is not reversible.", {color: "red"}).then((confirm) => {
                    if (confirm) {
                        node.remove()
                        this.saveTree()
                    }
                })
            },

            onChangeName(params) {
                // params = {id,oldName,newName,node/eventType}
                // save tree after the renaming is finished
                if (params.eventType === "blur") this.saveTree()
            },

            onAddNode(params) {
                // params = node
                let node = params

                // rename the new node after it's created
                // expand the parent folder after the new node is created inside the parent folder
                this.$nextTick(() => {
                    let parent = node.parent || this.folders
                    let parentfolder = document.getElementById(parent.id)
                    if (parentfolder) {
                        let icon = parentfolder.querySelector("i.vtl-icon-caret-right")
                        if (icon) 
                            icon.click() // if the parent folder is closed, expand it
                    }
                    
                    let folder = document.getElementById(node.id)
                    let operations = folder.querySelector("div.vtl-operation")
                    operations.children[2].click() // rename
                })

                this.saveTree()
            },

            addNode(parentNode) {
                var node = new TreeNode({
                    name: 'newFolder',
                    isLeaf: false,
                    parent: parentNode,
                    projectIds: [],
                    id: uuidv4()
                })
                if (!parentNode.children) parentNode.children = []
                    parentNode.addChildren(node)
                
                this.onAddNode(node)
            },

            onDrop(params) {
                let {node, src, target} = params
                this.saveTree()
            },

            onDropBefore(params) {
                let {node, src, target} = params
                this.saveTree()
            },

            onDropAfter(params) {
                let {node, src, target} = params
                this.saveTree()
            },

            onClick(params) {
                // I have to get the node by finding the child of its parent
                // otherwise addChildren() in addNode() gives error
                let node = params
                node.parent.children.forEach((child) => {
                    if (child.name === node.name) {
                        this.selectedNode = child
                    }
                })
                this.$root.$emit("clickNode", this.selectedNode.projectIds)
                
                // remove the background color of the special folders
                this.isFolderDisabled[this.selectedSpecialFolderIndex] = !this.isFolderDisabled[this.selectedSpecialFolderIndex] 
                // deselect the special folder to remove the background color of the special folders
                this.selectedSpecialFolderIndex = undefined

                // remove the background color of all normal folders
                let allElements = document.querySelectorAll(".vtl-node-main")
                for (let element of allElements) {
                    element.classList.remove("vtl-node-main-clicked")
                }
                // add blue background color to indicate the selected normal folder
                let selectedElement = document.querySelector(".vtl-node-main:hover")
                if (selectedElement) {
                    selectedElement.classList.add("vtl-node-main-clicked")
                }
            },

            onSpecialNodeClick() {
                let previousIndex = this.selectedSpecialFolderIndex
                this.$nextTick(() => {
                    // remove the background color of all normal folders
                    this.selectedNode = null
                    let allElements = document.querySelectorAll(".vtl-node-main")
                    for (let element of allElements) {
                        // element.style.background = "none"
                        element.classList.remove("vtl-node-main-clicked")
                    }

                    // unlock the previous special folder so user can click
                    this.isFolderDisabled[previousIndex] = !this.isFolderDisabled[previousIndex]
                    // lock the current special folder to prevent deselect
                    this.isFolderDisabled[this.selectedSpecialFolderIndex] = !this.isFolderDisabled[this.selectedSpecialFolderIndex] 
                    this.$root.$emit("clickNode",this.specialFolder[this.selectedSpecialFolderIndex].projectIds)
                })
                
            },

            contextMenu(e) {
                this.selectedNode = null
                if (e.srcElement.tagName !== "BUTTON") {
                    // make sure we are not clicking some buttons
                    // simulate a click on the node to select it  
                    e.srcElement.click()

                    this.$nextTick(() => {
                        // show context menu if we are selecting a node
                        if (this.selectedNode) {
                            this.x = e.clientX
                            this.y = e.clientY
                            this.showContextMenu = true
                        }
                    })
                } 
            },

            onContextMenuClick(e) {
                let option = e.srcElement.innerText
                let node = this.selectedNode || this.folders
                let folder = document.getElementById(node.id)
                let operations = null
                if (folder)
                    operations = folder.querySelector("div.vtl-operation")
                switch (option) {
                    case "New Folder":
                        this.addNode(this.selectedNode)                    
                        break
                    case "Rename Folder":
                        operations.children[2].click()
                        break
                    case "Delete Folder":
                        operations.children[3].click()
                        break
                }
            }
        }
    }
</script>

<style>
.tree-view-background {
    /* treeview*/
    height: 100%;
    width: 100%;
    padding-bottom: 5px;
    background: rgb(23,23,23);
    /* scroll bar for overflow*/
    overflow-y: auto;
}
.vtl-node-main {
    /* make undraggable node text not selectable */
    user-select: none;
}
.vtl-node-main:hover {
    /* change hover color of node */
    background-color: rgb(255 255 255 / 10%);
}
.vtl-node-main-clicked {
    /* add color when clicked */
    background-color: #29B6F6 !important;
}
input.vtl-input {
    /* white text in input */
    color: #FFFFFF;
}
.vtl-operation {
    /* do not show operations on the folder */
    display: none !important;
}
.tree-menu-background {
    /* contextmenu background */
    background: #121212;
}
.tree-menu-item:hover {
    /* contextmenu item when hover */
    background: rgb(255 255 255 / 10%);
    cursor: default;
}
</style>