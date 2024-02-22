/**
 * This file released by Frostoven under the MIT License.
 */

/** Function signature. */
type KeyMapSignature = { [key: string]: Function };

/** The total amount of instances that have been created since app boot. */
let totalInstances = 0;

/**
 * Convenience class for quickly binding keys to handlers. Also has a concept
 * of focus to prevent multiple visible components from taking keyboard input
 * all at once.
 *
 * Additionally, attempts to track certain states such as Caps Lock, though
 * this isn't guaranteed to work reliably, and only updates state when *other*
 * keys are pressed.
 *
 * Meant to be used within React components that respond to key bindings.
 *
 * @example
 *   autoKeyMap = new AutoKeyMap();
 *
 *   componentDidMount() {
 *     this.autoKeyMap.bindKeys({
 *       Enter: this.handleAccept,
 *       Escape: this.handleCancellation,
 *     });
 *   }
 *
 *   componentWillUnmount() {
 *     this.autoKeyMap.destroy();
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
  // Attempt at tracking Caps Lock.
  static capsLockOn = false;
  // Shift is currently being held down.
  static isShiftDown = false;

  // Used to keep track of what has focus.
  private static _windowStackOrder: string[] = [];

  // The ID of this instance. Used to work with window focus.
  private readonly _windowId: string = '';
  // Key bindings are stored in this variable.
  private _keyMap: KeyMapSignature | null = null;
  // If true, this instance temporarily stops listening for events.
  private _paused = false;
  // If true, this instance will refuse to do any further key processing.
  private _destroyed = false;

  constructor({
    windowId = null,
    stealFocus = false,
  }: {
    windowId?: string | null,
    stealFocus?: boolean,
  } = {}) {
    if (!windowId) {
      windowId = `${totalInstances++}${Math.random()}`;
    }
    this._windowId = windowId;

    if (stealFocus) {
      AutoKeyMap._windowStackOrder.unshift(windowId);
    }
    else {
      AutoKeyMap._windowStackOrder.push(windowId);
    }
  }

  bindKeys(keyMap: KeyMapSignature) {
    if (this._destroyed) {
      return console.error(
        'Cannot bind new keys - AutoKeyMap has been destroyed.',
      );
    }

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

  handleKey = (event: KeyboardEvent) => {
    // Update CapsLock state.
    if (event.getModifierState!) {
      AutoKeyMap.capsLockOn = event.getModifierState('CapsLock');
    }

    AutoKeyMap.isShiftDown = event.shiftKey;

    if (!this._keyMap || this._destroyed) {
      return;
    }

    // Check if this instance has focus.
    if (AutoKeyMap._windowStackOrder[0] !== this._windowId) {
      return;
    }

    const binding = this._keyMap[event.code];
    if (typeof binding === 'function') {
      event.preventDefault();
      event.stopPropagation();
      binding(event);
    }
  };

  // Temporarily disable this instance.
  pause() {
    this._paused = true;
  }

  // Enable this instance if previously disabled via pause. Does not undo a
  // destroy().
  resume() {
    this._paused = false;
  }

  // Prevents further use of this instance.
  destroy() {
    this._destroyed = true;
    this._keyMap = null;
    document.removeEventListener('keydown', this.handleKey);

    // While this method would normally be on large arrays, keep in mind that
    // this application does not allow more than around 3 active windows at a
    // time. So this won't hurt performance.
    const idIndex = AutoKeyMap._windowStackOrder.indexOf(this._windowId);
    if (idIndex !== -1) {
      AutoKeyMap._windowStackOrder.splice(idIndex, 1);
    }
  }
}

export {
  AutoKeyMap,
  KeyMapSignature,
};
