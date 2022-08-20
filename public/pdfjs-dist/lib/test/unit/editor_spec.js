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

var _tools = require("../../display/editor/tools.js");

var _ink = require("../../display/editor/ink.js");

describe("editor", function () {
  describe("Command Manager", function () {
    it("should check undo/redo", function () {
      const manager = new _tools.CommandManager(4);
      let x = 0;

      const makeDoUndo = n => ({
        cmd: () => x += n,
        undo: () => x -= n
      });

      manager.add({ ...makeDoUndo(1),
        mustExec: true
      });
      expect(x).toEqual(1);
      manager.add({ ...makeDoUndo(2),
        mustExec: true
      });
      expect(x).toEqual(3);
      manager.add({ ...makeDoUndo(3),
        mustExec: true
      });
      expect(x).toEqual(6);
      manager.undo();
      expect(x).toEqual(3);
      manager.undo();
      expect(x).toEqual(1);
      manager.undo();
      expect(x).toEqual(0);
      manager.undo();
      expect(x).toEqual(0);
      manager.redo();
      expect(x).toEqual(1);
      manager.redo();
      expect(x).toEqual(3);
      manager.redo();
      expect(x).toEqual(6);
      manager.redo();
      expect(x).toEqual(6);
      manager.undo();
      expect(x).toEqual(3);
      manager.redo();
      expect(x).toEqual(6);
    });
  });
  it("should hit the limit of the manager", function () {
    const manager = new _tools.CommandManager(3);
    let x = 0;

    const makeDoUndo = n => ({
      cmd: () => x += n,
      undo: () => x -= n
    });

    manager.add({ ...makeDoUndo(1),
      mustExec: true
    });
    manager.add({ ...makeDoUndo(2),
      mustExec: true
    });
    manager.add({ ...makeDoUndo(3),
      mustExec: true
    });
    manager.add({ ...makeDoUndo(4),
      mustExec: true
    });
    expect(x).toEqual(10);
    manager.undo();
    manager.undo();
    expect(x).toEqual(3);
    manager.undo();
    expect(x).toEqual(1);
    manager.undo();
    expect(x).toEqual(1);
    manager.redo();
    manager.redo();
    expect(x).toEqual(6);
    manager.add({ ...makeDoUndo(5),
      mustExec: true
    });
    expect(x).toEqual(11);
  });
  describe("fitCurve", function () {
    it("should return a function", function () {
      expect(typeof _ink.fitCurve).toEqual("function");
    });
    it("should compute an Array of bezier curves", function () {
      const bezier = (0, _ink.fitCurve)([[1, 2], [4, 5]], 30, null);
      expect(bezier).toEqual([[[1, 2], [2, 3], [3, 4], [4, 5]]]);
    });
  });
});