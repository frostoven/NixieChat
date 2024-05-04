/**
 * This file released by Frostoven under the MIT License.
 */

/**
 * Used to easily manage text carets in contentEditable inputs.
 */
class CaretControl {
  _parent: HTMLElement | null = null;
  _lastSelectionOffset = 0;
  _lastSelectedNode: Node | null = null;

  /**
   * This is React-ref-friendly. This class will not care if the rug is pulled
   * from under us and the element vanishes, so long as we just call setParent
   * each time.
   * @param element
   */
  setParent(element: HTMLElement) {
    this._parent = element;
    this._lastSelectionOffset = 0;
    this._lastSelectedNode = null;

    element.addEventListener('paste', () => this.recordSelectionData());
    element.addEventListener('mouseup', () => this.recordSelectionData());
    element.addEventListener('keyup', () => this.recordSelectionData());
    element.addEventListener('focus', () => this.restoreCaretPosition());
  }

  /**
   * This is the caret tracking function. It should ideally be called after
   * every input change.
   */
  recordSelectionData() {
    if (!this._parent) {
      return null;
    }

    const selection = window.getSelection();
    if (document.activeElement !== this._parent || !selection) {
      return null;
    }

    this._lastSelectionOffset = selection.focusOffset;
    this._lastSelectedNode = selection.focusNode;
  }

  /**
   * This should be called when your input regains focus. The reason this
   * function is necessary is that contentEditable elements reset their caret
   * position when they lose focus.
   * @param autoFocus
   */
  restoreCaretPosition(autoFocus?: boolean | undefined) {
    autoFocus && this._parent && this._parent.focus();
    if (this._lastSelectedNode) {
      this._moveCaretToNode(this._lastSelectedNode, this._lastSelectionOffset);
    }
  }

  /**
   * Focuses the element and then inserts the specified element at the
   * current element position.
   * @param element
   */
  insertNodeAtCaret(element: HTMLElement | Node) {
    this.restoreCaretPosition(true);

    let targetNode: Node;
    const lastSelectedNode = this._lastSelectedNode;
    if (!this._parent) {
      console.error('[insertNodeAtCaret] Cannot insert node: Parent is not set.');
      return;
    }
    if (!lastSelectedNode) {
      // This happens if the user inserts something like an emoticon before
      // having clicked the chat box.
      this._parent.append(element);
      return;
    }

    // Check what the caret was last resting on.
    if (lastSelectedNode.nodeType === Node.TEXT_NODE) {
      const textNode = this._lastSelectedNode as Text;
      if (!textNode) {
        return;
      }
      const rightSide = textNode.splitText(this._lastSelectionOffset);
      const leftSide = rightSide.previousSibling as Text;
      console.log('=>', { leftSide, rightSide });
      try {
        this._parent.replaceChild(textNode, leftSide);
      }
      catch (_) {
        // This usually happens if the form changes without focus (such as with
        // mouse pasting).
        this._parent.append(element);
        return;
      }
      if (rightSide.textContent) {
        this._parent.insertBefore(leftSide, rightSide);
      }
      targetNode = rightSide;
    }
    else {
      targetNode = lastSelectedNode;
    }

    // We use this as a means to anchor the caret.
    const blankNode = document.createTextNode('');

    try {
      this._parent.insertBefore(element, targetNode);
      this._parent.insertBefore(blankNode, element.nextSibling);
    }
    catch (_) {
      // This usually happens if the form changes without focus (such as with
      // mouse pasting).
      this._parent.append(element);
      return;
    }

    // Record the new position.
    this._moveCaretToNode(blankNode, 0);
    this.recordSelectionData();
  }

  getLastKnownSelectionInfo() {
    return {
      selectionOffset: this._lastSelectionOffset,
      selectedNode: this._lastSelectedNode,
    };
  }

  /**
   * @private
   * @param node
   * @param offset
   */
  _moveCaretToNode(node: Node, offset: number) {
    const range = new Range();
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    range.setStart(node, offset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export {
  CaretControl,
};
