import { QTreeNode } from "quasar";
/**
 * Sort children of a tree node by labels
 * @param root - the root treenode
 */
function sortTree(root: QTreeNode) {
  if (root.children === undefined) return;

  if (root.children.length > 1) {
    root.children = root.children.sort((a, b) =>
      a.label > b.label ? 1 : b.label > a.label ? -1 : 0
    );
    for (let child of root.children) sortTree(child);
  }
}

export { sortTree };
