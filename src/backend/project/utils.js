/**
 * Sort tree nodes by labels
 * @param {Object} root
 */
function sortTree(root) {
  if (root.children?.length > 1) {
    root.children = root.children.sort((a, b) =>
      a.label > b.label ? 1 : b.label > a.label ? -1 : 0
    );
    for (let child of root.children) sortTree(child);
  }
}

export { sortTree };
