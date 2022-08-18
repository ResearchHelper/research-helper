<template>
    <div class="tableview-background px-0">
        <!-- <ActionBar/> -->

        <v-data-table 
        id="data-table"
        class="table"
        hide-default-footer
        :headers="headers"
        :items="projects"
        :search="search"
        :expanded.sync="expanded"
        :single-expand="singleExpand"
        item-key="id"
        show-expand
        >   
            <template v-slot:item="{ item, isExpanded }">
                <!-- since we use v-slot:item to define rows, all events about row should go here -->
                <tr 
                style="cursor:default"
                @click="onClicked(item)" 
                @dblclick="onDoubleClicked(item)" 
                @contextmenu="contextMenu($event,item)">
                    <td> 
                        <v-icon @click="handleExpansion(item, isExpanded)">
                            {{ isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                        </v-icon> 
                    </td>
                    <td class="truncate">{{ item.author }}</td>
                    <td>{{ item.year }}</td>
                    <td class="truncate">{{ item.title }}</td>
                </tr>                
            </template>
            <template v-slot:expanded-item="{headers, item}">
                <td :colspan="headers.length">
                    <ul>
                        <li v-for="file in item.files">
                            {{ file }}
                        </li>
                    </ul>
                </td>
            </template>
        </v-data-table>

        <!-- context menu -->
        <v-menu
        v-model="showContextMenu"
        :position-x="x"
        :position-y="y"
        absolute
        offset-y>
            <div class="table-menu-background py-2">
                <div class="table-menu-item px-5" 
                @click="$root.$emit('deleteProject',false)">
                    Delete From Table
                </div>
                <div class="table-menu-item px-5" @click="$root.$emit('deleteProject',true)">
                    Delete From DataBase
                </div>
            </div>
        </v-menu>
    </div>
</template>

<script>
    import {useStateStore} from '@/stateStorage'

    export default {
        setup() {
            const stateStore = useStateStore()
            return {stateStore}
        },

        data () {
            return {
                // table
                search: '',
                headers: [
                    {
                        text: "Authors",
                        align: "start",
                        filterable: true,
                        value: "author",
                        width: "20%"
                    },
                    {
                        text: "Year",
                        align: "start",
                        filterable: true,
                        value: "year",
                        width: "15%"
                    },
                    {
                        text: "Title",
                        align: "start",
                        filterable: true,
                        value: "title",
                        width: "65%"
                    }
                ],
                projects: [],

                // expand rows
                expanded: [],
                singleExpand: false,
                
                // selected things
                selectedProject: null,
                
                // context menu
                showContextMenu: false,
                x: 0,
                y: 0,
            }
        },

        mounted() {
            this.$root.$on("clickNode", projectIds => this.getProjects(projectIds))
            this.$root.$on("localSearch", searchString => this.handleSearch(searchString))
            
            // make dividers between headers
            let headers = document.querySelectorAll("th.text-start.sortable")
            let headerYear = headers[1]
            headerYear.style = "border-left: 2px solid grey; border-right: 2px solid grey;"
            
            // make the table resizable
            var table = document.getElementById("data-table")
            resizableGrid(table)
            function resizableGrid(table) {
                var row = table.getElementsByTagName('tr')[0],
                cols = row ? row.children : undefined;
                if (!cols) return;
                
                table.style.overflow = 'hidden';
                
                var tableHeight = row.offsetHeight;
                
                // create resize grips
                for (var i=1;i<cols.length-1;i++){
                    var div = createDiv(tableHeight);
                    cols[i].appendChild(div);
                    cols[i].style.position = 'relative';
                    setListeners(div);
                }

                function setListeners(div){
                    var pageX,curCol,nxtCol,curColWidth,nxtColWidth;

                    div.addEventListener('mousedown', function (e) {
                        curCol = e.target.parentElement;
                        nxtCol = curCol.nextElementSibling;
                        pageX = e.pageX; 
                        
                        var padding = paddingDiff(curCol);
                        
                        curColWidth = curCol.offsetWidth - padding;
                        if (nxtCol)
                            nxtColWidth = nxtCol.offsetWidth - padding;
                    });

                    div.addEventListener('mouseover', function (e) {
                        e.target.style.borderRight = '2px solid #0000ff';
                    })

                    div.addEventListener('mouseout', function (e) {
                        e.target.style.borderRight = '';
                    })

                    document.addEventListener('mousemove', function (e) {
                        if (curCol) {
                            var diffX = e.pageX - pageX;
                        
                            if (nxtCol)
                            nxtCol.style.width = (nxtColWidth - (diffX))+'px';

                            curCol.style.width = (curColWidth + diffX)+'px';
                        }
                    });

                    document.addEventListener('mouseup', function (e) { 
                        curCol = undefined;
                        nxtCol = undefined;
                        pageX = undefined;
                        nxtColWidth = undefined;
                        curColWidth = undefined
                    });
                }
                
                function createDiv(height){
                    var div = document.createElement('div');
                    div.style.top = 0;
                    div.style.right = 0;
                    div.style.width = '5px';
                    div.style.position = 'absolute';
                    div.style.cursor = 'col-resize';
                    div.style.userSelect = 'none';
                    div.style.height = height + 'px';
                    return div;
                }
                
                function paddingDiff(col){
                
                    if (getStyleVal(col,'box-sizing') == 'border-box'){
                        return 0;
                    }
                    
                    var padLeft = getStyleVal(col,'padding-left');
                    var padRight = getStyleVal(col,'padding-right');
                    return (parseInt(padLeft) + parseInt(padRight));

                }

                function getStyleVal(elm,css){
                    return (window.getComputedStyle(elm, null).getPropertyValue(css))
                }
            };
        },

        methods: {
            onClicked(project) {
                this.selectedProject = project
                this.$root.$emit("clickProject", project)
                this.stateStore.selectedProject = project
                
                // remove background colors for other projects
                let allElements = document.querySelectorAll("tr")
                for (let element of allElements) {
                    element.classList.remove("table-item-clicked")
                }
                // color the selected project
                let selectedElement = document.querySelector("tr:hover")
                selectedElement.classList.add("table-item-clicked")
            },

            onDoubleClicked(project) {
                console.log(project)
                this.$root.$emit("openProject", project)
                this.stateStore.openedProjects.push(project)
                this.stateStore.workingProject = project
            },

            contextMenu(e,project) {
                console.log(project)
                e.srcElement.click()

                this.$nextTick(() => {
                    // show context menu if we are selecting a node
                    if (this.selectedProject) {
                        this.x = e.clientX
                        this.y = e.clientY
                        this.showContextMenu = true
                    }
                })
            },

            handleExpansion(item, state) {
                let itemIndex = this.expanded.indexOf(item);
                state ? this.expanded.splice(itemIndex, 1) : this.expanded.push(item);
            },

            handleSearch(searchString) {
                this.search = searchString
                this.selectedProject = null

                // remove the selection color 
                let allElements = document.querySelectorAll("tr")
                for (let element of allElements) {
                    element.classList.remove("table-item-clicked")
                }
            },

            getProjects(projectIds) {
                this.projects = []
                for (let projectId of projectIds) {
                    fetch("http://localhost:5000/project/"+projectId, {
                        mode: 'cors', 
                        method: "GET"
                    })
                    .then(response => {
                        return response.json()
                    }).then(json => {
                        let info = json.info
                        info.files = json.files
                        info.id = projectId // must id as key since the expandable row requires it
                        this.projects.push(info)
                    })
                }
            },
        },

        
    }
</script>

<style>
.tableview-background {
    height: 100%;
    width: 100%;
    background: rgb(20,20,20);
    overflow-y: auto;
}
.table {
    background: none !important; /* table has transparent background*/
}
.table-item-clicked {
    background-color: #29B6F6 !important;
}
.table-menu-background {
    /* contextmenu background */
    background: #5a5a5a;
}
.table-menu-item:hover {
    /* contextmenu item when hover */
    background: rgb(255 255 255 / 10%);
    cursor: default;
}
.truncate {
    max-width: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>