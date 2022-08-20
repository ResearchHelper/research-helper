<template>
    <v-app-bar dense>
        <v-text-field
        dense
        outline
        style="max-width: 50px;"
        type="number"
        v-if="pdfViewer"
        v-model="currentPageNumber" 
        @keydown.enter="scrollToPage(currentPageNumber)"
        ></v-text-field>
        <!--I cannot simply do v-model="pdfViewer.currentPageNumber" 
        since the text-field converts the number to string, 
        and pdfViewer.currentPageNumber only accepts integer -->
        {{' of ' + (pdfViewer ? pdfViewer.pagesCount : null)}}

        <v-spacer></v-spacer>
        <v-btn-toggle
        dense
        mandatory
        v-model="selectedTool"
        >
            <v-btn icon>
                <v-icon>mdi-cursor-text</v-icon>
            </v-btn>
            <v-btn icon>
                <v-icon>mdi-marker</v-icon>
            </v-btn>
            <v-btn icon>
                <v-icon>mdi-note-edit</v-icon>
            </v-btn>
            <v-btn icon>
                <v-icon>mdi-format-text</v-icon>
            </v-btn>
            <v-btn icon>
                <v-icon>mdi-draw</v-icon>
            </v-btn>
        </v-btn-toggle>
        <v-spacer></v-spacer>
        <v-menu offset-y>
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    dark
                    icon
                    v-bind="attrs"
                    v-on="on"
                >
                    <v-icon>mdi-eye</v-icon>
                <v-icon>mdi-triangle-small-down</v-icon>
                </v-btn>
            </template>
            <div style="background-color: #212121;"> <!-- make the backgroun of the menu not transparent -->
                <v-list-item-group dense>
                    <v-list-item  @click="selectFitMode('page-width')">
                        <v-list-item-title>Fit To Width</v-list-item-title>
                    </v-list-item>
                    <v-list-item  @click="selectFitMode('page-height')">
                        <v-list-item-title>Fit To Height</v-list-item-title>
                    </v-list-item>
                </v-list-item-group>
                <v-divider></v-divider>
                <v-list-item-group dense>
                    <v-list-item @click="selectSpreadMode(0)">
                        <v-list-item-title>No Spread</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="selectSpreadMode(1)">
                        <v-list-item-title>Odd Spread</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="selectSpreadMode(2)">
                        <v-list-item-title>Even Spread</v-list-item-title>
                    </v-list-item>
                </v-list-item-group>
            </div>
        </v-menu>
        
        <v-btn icon @click="zoomIn">
            <v-icon>mdi-magnify-plus</v-icon>
        </v-btn>
        <v-btn icon @click="zoomOut">
            <v-icon>mdi-magnify-minus</v-icon>
        </v-btn>
        <v-btn icon @click="stateStore.toggleInfoPane">
            <v-icon>mdi-format-list-bulleted</v-icon>
        </v-btn>
    </v-app-bar>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import {useStateStore} from '@/stateStorage'

export default {
    props: ["pdfViewer"],

    setup() {
        const stateStore = useStateStore()
        return {stateStore}
    },

    data() {
        return {
            currentPageNumber: null,
            selectedTool: 0,
        }
    },

    watch: {      
        'pdfViewer.currentPageNumber'(pageNumber) {
            this.currentPageNumber = pageNumber
        },

        selectedTool(newTool) {
            if (newTool === 0) {
                this.pdfViewer.annotationEditorMode = pdfjsLib.AnnotationEditorType.NONE
            }
            else if (newTool === 1) {
                // highlighter
            }
            else if (newTool === 2) {
                // note
            }
            else if (newTool === 3) {
                this.pdfViewer.annotationEditorMode = pdfjsLib.AnnotationEditorType.FREETEXT
            }
            else if (newTool === 4) {
                this.pdfViewer.annotationEditorMode = pdfjsLib.AnnotationEditorType.INK
            }
        },
    },


    methods: {
        scrollToPage(pageNumber) {
            console.log(pageNumber)
            if (pageNumber < 1) pageNumber = 1
            else if (pageNumber > this.pdfViewer.pagesCount) pageNumber = this.pdfViewer.pagesCount
            this.pdfViewer.currentPageNumber = parseInt(pageNumber)
            console.log(this.pdfViewer.currentPageNumber)
        },

        zoomIn() {
            this.pdfViewer.currentScale += 0.1
        },

        zoomOut() {
            this.pdfViewer.currentScale -= 0.1
        },

        selectFitMode(fitMode) {
            this.pdfViewer.currentScaleValue = fitMode
        },

        selectSpreadMode(spreadMode) {
            this.pdfViewer.spreadMode = spreadMode
        },
    }
}
</script>