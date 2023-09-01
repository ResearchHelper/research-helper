import { Author, Folder, Project } from "../database";
type TreeNode = Folder | Project;
/**
 * Sort children of a tree node by labels
 * @param root - the root treenode
 */
export function sortTree(root: TreeNode) {
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

/**
 * Convert array of author objects to string
 * @param authors
 */
export function authorToString(authors: Author[] | undefined) {
  if (!!!authors?.length) return "";

  let names = [];
  for (let author of authors) {
    if (!!!author) continue;
    if (!!author.literal) names.push(author.literal);
    else names.push(`${author.given} ${author.family}`);
  }
  return names.join(", ");
}
