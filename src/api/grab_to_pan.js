class GrabToPan {
  /**
   * Construct a GrabToPan instance for a given HTML element.
   * @param {Element} options.element
   * @param {function} [options.ignoreTarget] - See `ignoreTarget(node)`.
   * @param {function(boolean)} [options.onActiveChanged] - Called when
   *   grab-to-pan is (de)activated. The first argument is a boolean that
   *   shows whether grab-to-pan is activated.
   */
  constructor(options) {
    this.element = options.element;
    this.document = options.element.ownerDocument;
    if (typeof options.ignoreTarget === "function") {
      this.ignoreTarget = options.ignoreTarget;
    }
    this.onActiveChanged = options.onActiveChanged;

    // Bind the contexts to ensure that `this` always points to
    // the GrabToPan instance.
    this.activate = this.activate.bind(this);
    this.deactivate = this.deactivate.bind(this);
    this.toggle = this.toggle.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._endPan = this._endPan.bind(this);

    // This overlay will be inserted in the document when the mouse moves during
    // a grab operation, to ensure that the cursor has the desired appearance.
    const overlay = (this.overlay = document.createElement("div"));
    overlay.className = "grab-to-pan-grabbing";
  }

  /**
   * Bind a mousedown event to the element to enable grab-detection.
   */
  activate() {
    if (!this.active) {
      this.active = true;
      this.element.addEventListener("mousedown", this._onMouseDown, true);
      this.element.style.cursor = "grab";
      this.onActiveChanged?.(true);
    }
  }

  /**
   * Removes all events. Any pending pan session is immediately stopped.
   */
  deactivate() {
    if (this.active) {
      this.active = false;
      this.element.removeEventListener("mousedown", this._onMouseDown, true);
      this._endPan();
      this.onActiveChanged?.(false);
    }
  }

  toggle() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * Whether to not pan if the target element is clicked.
   * Override this method to change the default behaviour.
   *
   * @param {Element} node - The target of the event.
   * @returns {boolean} Whether to not react to the click event.
   */
  ignoreTarget(node) {
    // Check whether the clicked element is, a child of, an input element/link.
    return node.matches(
      "a[href], a[href] *, input, textarea, button, button *, select, option"
    );
  }

  _onMouseDown(event) {
    if (event.button !== 0 || this.ignoreTarget(event.target)) {
      return;
    }
    if (event.originalTarget) {
      try {
        // eslint-disable-next-line no-unused-expressions
        event.originalTarget.tagName;
      } catch (e) {
        // Mozilla-specific: element is a scrollbar (XUL element)
        return;
      }
    }

    this.scrollLeftStart = this.element.scrollLeft;
    this.scrollTopStart = this.element.scrollTop;
    this.clientXStart = event.clientX;
    this.clientYStart = event.clientY;
    this.document.addEventListener("mousemove", this._onMouseMove, true);
    this.document.addEventListener("mouseup", this._endPan, true);
    // When a scroll event occurs before a mousemove, assume that the user
    // dragged a scrollbar (necessary for Opera Presto, Safari and IE)
    // (not needed for Chrome/Firefox)
    this.element.addEventListener("scroll", this._endPan, true);
    this.element.style.cursor = "grabbing";
    event.preventDefault();
    event.stopPropagation();

    const focusedElement = document.activeElement;
    if (focusedElement && !focusedElement.contains(event.target)) {
      focusedElement.blur();
    }
  }

  _onMouseMove(event) {
    this.element.removeEventListener("scroll", this._endPan, true);
    if (!(event.buttons & 1)) {
      // The left mouse button is released.
      this._endPan();
      return;
    }
    const xDiff = event.clientX - this.clientXStart;
    const yDiff = event.clientY - this.clientYStart;
    const scrollTop = this.scrollTopStart - yDiff;
    const scrollLeft = this.scrollLeftStart - xDiff;
    if (this.element.scrollTo) {
      this.element.scrollTo({
        top: scrollTop,
        left: scrollLeft,
        behavior: "instant",
      });
    } else {
      this.element.scrollTop = scrollTop;
      this.element.scrollLeft = scrollLeft;
    }
    if (!this.overlay.parentNode) {
      document.body.append(this.overlay);
    }
  }

  _endPan() {
    this.element.style.cursor = "grab";
    this.element.removeEventListener("scroll", this._endPan, true);
    this.document.removeEventListener("mousemove", this._onMouseMove, true);
    this.document.removeEventListener("mouseup", this._endPan, true);
    // Note: ChildNode.remove doesn't throw if the parentNode is undefined.
    this.overlay.remove();
  }
}

export { GrabToPan };
