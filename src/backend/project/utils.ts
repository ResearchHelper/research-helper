import { Folder, Project } from "../database";
type TreeNode = Folder | Project;
/**
 * Sort children of a tree node by labels
 * @param root - the root treenode
 */
function sortTree(root: TreeNode) {
  if (root.children === undefined) return;

  if (root.children.length > 1) {
    root.children = root.children.sort((a, b) =>
      (a as TreeNode).label > (b as TreeNode).label
        ? 1
        : (b as TreeNode).label > (a as TreeNode).label
        ? -1
        : 0
    );
    for (let child of root.children) sortTree(child as TreeNode);
  }
}

export { sortTree };
