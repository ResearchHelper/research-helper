/**
 * @licstart The following is the entire license notice for the
 * JavaScript code in this page
 *
 * Copyright 2022 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @licend The above is the entire license notice for the
 * JavaScript code in this page
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnnotationEditorLayerBuilder = void 0;

var _pdf = require("../pdf");

var _l10n_utils = require("./l10n_utils.js");

class AnnotationEditorLayerBuilder {
  #uiManager;

  constructor(options) {
    this.pageDiv = options.pageDiv;
    this.pdfPage = options.pdfPage;
    this.annotationStorage = options.annotationStorage || null;
    this.l10n = options.l10n || _l10n_utils.NullL10n;
    this.annotationEditorLayer = null;
    this.div = null;
    this._cancelled = false;
    this.#uiManager = options.uiManager;
  }

  async render(viewport, intent = "display") {
    if (intent !== "display") {
      return;
    }

    if (this._cancelled) {
      return;
    }

    const clonedViewport = viewport.clone({
      dontFlip: true
    });

    if (this.div) {
      this.annotationEditorLayer.update({
        viewport: clonedViewport
      });
      this.show();
      return;
    }

    this.div = document.createElement("div");
    this.div.className = "annotationEditorLayer";
    this.div.tabIndex = 0;
    this.pageDiv.append(this.div);
    this.annotationEditorLayer = new _pdf.AnnotationEditorLayer({
      uiManager: this.#uiManager,
      div: this.div,
      annotationStorage: this.annotationStorage,
      pageIndex: this.pdfPage._pageIndex,
      l10n: this.l10n,
      viewport: clonedViewport
    });
    const parameters = {
      viewport: clonedViewport,
      div: this.div,
      annotations: null,
      intent
    };
    this.annotationEditorLayer.render(parameters);
  }

  cancel() {
    this._cancelled = true;
    this.destroy();
  }

  hide() {
    if (!this.div) {
      return;
    }

    this.div.hidden = true;
  }

  show() {
    if (!this.div) {
      return;
    }

    this.div.hidden = false;
  }

  destroy() {
    if (!this.div) {
      return;
    }

    this.pageDiv = null;
    this.annotationEditorLayer.destroy();
    this.div.remove();
  }

}

exports.AnnotationEditorLayerBuilder = AnnotationEditorLayerBuilder;