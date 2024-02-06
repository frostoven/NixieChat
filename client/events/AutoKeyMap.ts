/**
 * This file released by Frostoven under the MIT License.
 */

/** Function signature. */
type KeyMapSignature = { [key: string]: Function };

/**
 * Convenience class for quickly binding keys to handlers.
 *
 * Meant to be used within React components that respond to key bindings.
 *
 * @example
 *   componentDidMount() {
 *     this.autoKeyMap.bindKeys({
 *       Enter: this.handleAccept,
 *       Escape: this.handleCancellation,
 *     });
 *   }
 *
 *   componentWillUnmount() {
 *     this.autoKeyMap.unbindAllKeys();
 *   }
 *
 *   handleAccept = ({ code }) => {
 *     console.log('->', code); // 'Enter'
 *   };
 *
 *   handleCancellation = ({ code }) => {
 *     console.log('->', code); // 'Escape'
 *   };
 */
class AutoKeyMap {
  private _keyMap: KeyMapSignature | null = null;

  bindKeys(keyMap: KeyMapSignature) {
    if (this._keyMap === null) {
      this._keyMap = keyMap;
    }
    else {
      this._keyMap = {
        ...this._keyMap,
        ...keyMap,
      };
    }

    document.addEventListener('keydown', this.handleKey);
  }

  unbindAllKeys() {
    this._keyMap = null;
    document.removeEventListener('keydown', this.handleKey);
  }

  handleKey = (event: KeyboardEvent) => {
    if (!this._keyMap) {
      return;
    }

    const binding = this._keyMap[event.code];
    if (typeof binding === 'function') {
      binding(event);
    }
  };
}

export {
  AutoKeyMap,
  KeyMapSignature,
};
