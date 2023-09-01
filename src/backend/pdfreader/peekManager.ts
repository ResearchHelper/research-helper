import { reactive } from "vue";
import * as pdfjsLib from "pdfjs-dist";

export class PeekManager {
  links = reactive<HTMLAnchorElement[]>([]);
  pdfDocument: pdfjsLib.PDFDocumentProxy | undefined;

  setDocument(pdfDocument: pdfjsLib.PDFDocumentProxy) {
    this.pdfDocument = pdfDocument;
  }

  /**
   * Create a peeker for the given link
   */
  create(link: HTMLAnchorElement) {
    if (
      this.links.findIndex(
        (l) => l.getAttribute("id") === link.getAttribute("id")
      ) === -1
    )
      this.links.push(link);
  }

  /**
   * Destroy the peeker of the given peekerId
   */
  destroy(elementId: string) {
    // don't know why filter doesn't work here
    let ind = this.links.findIndex((link) => link.id === elementId);
    if (ind > -1) this.links.splice(ind, 1);
  }
}
