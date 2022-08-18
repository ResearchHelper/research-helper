<template>
    <div>
        <v-tabs 
        fixed-tabs 
        v-model="currentTab" 
        >
            <v-tab>Meta Info</v-tab>
            <v-tab>Notes</v-tab>
        </v-tabs>
        <v-tabs-items
        :style=" 'height:'+height+'px; overflow: auto;'"
        v-model="currentTab"
        >
            <v-tab-item>
                <v-container v-if="currentProject" >
                    <v-col class="px-0">
                        <v-textarea
                        outlined
                        dense
                        class="textfield"
                        label="Title"
                        v-model="currentProject.title"
                        @input="modifyInfo"
                        ></v-textarea>
                        <v-textarea
                            outlined
                            dense
                            class="textfield"
                            label="Authors"
                            v-model="currentProject.author"
                            @input="modifyInfo"
                        ></v-textarea>
                        <v-textarea
                            outlined
                            dense
                            auto-grow
                            class="textfield"                        
                            label="Abstract"
                            v-model="currentProject.abstract"
                            @input="modifyInfo"
                        ></v-textarea>
                    </v-col>
                </v-container>
            </v-tab-item>

            <v-tab-item>
                Notes
            </v-tab-item>
        </v-tabs-items>
    </div>
</template>

<script>
import { useStateStore } from '@/stateStorage'

export default {
    props: ["currentProject"],

    setup() {
        const stateStore = useStateStore()
        return {stateStore}
    },

    mounted() {
        this.computeHeight()
        window.addEventListener("resize", this.computeHeight)
    },
    
    data() {
        return {
            currentTab: 0,
            height: window.innerHeight-32-48-48
        }
    },
    
    methods: {
        computeHeight() {
            this.height = window.innerHeight-32-48-48
        },

        modifyInfo() {
            fetch("http://localhost:5000/project/"+this.currentProject.projectId, {
                mode: 'cors', 
                method: "PUT", 
                headers: {"Content-Type": "application/json"}, 
                body: JSON.stringify(this.currentProject)
            })
            .then(response => {
                console.log(response)
            })
        },
    },

}
</script>

<style scoped>
</style>