/**
 * This file released by Frostoven under the MIT License.
 */

import React from 'react';
import { Input, Modal as SemanticModal } from 'semantic-ui-react';
import { Button } from 'semantic-ui-react';

// Unique name used to identify modals.
const thisMenu = 'modal';

export const icons = {
  text: 'pencil alternate',
  number: 'numbered list',
};

let totalInstances = 0;

export default class Modal extends React.Component {
  static allowExternalListeners = true;

  static defaultState = {
    isVisible: false,
    modalCount: 0,
    currentClosedCount: 0,
    highestRecentCount: 0,
    selectionIndex: 0,
  };

  constructor(props) {
    super(props);
    this.state = Modal.defaultState;
    this._currentMenu = null;
    this._modalQueue = [];
    // Used specifically to listen for the user pressing escape. This is
    // overwritten by buildModal whenever a new dialog is shown.
    this._forceCloseListener = null;
  }

  componentDidMount() {
    if (++totalInstances > 1) {
      console.warn(
        'More than one modal component has been mounted. This will likely ' +
        'cause bugs. Please investigate.'
      );
    }

    // Replace all window.$modal placeholder boot functions with the real, now
    // loaded ones.
    window.$modal = this;
    window.$modal.static = Modal;
  }

  componentWillUnmount() {
    totalInstances--;
    console.warn('Modal component unmounted. This is probably a bug.');
    delete window.$modal;
  }

  _reprocessQueue = (optionalCallback) => {
    const modalQueue = this._modalQueue;
    if (!modalQueue.length) {
      // Reset modal to initial state.
      this._hide(optionalCallback);
    }
    else {
      if (modalQueue[modalQueue.length - 1].deactivated) {
        // This happens if the user requested deactivation by name. Close that
        // modal and move on.
        // Note: This is recursive as deactivateModal calls _reprocessQueue.
        return this.deactivateModal(optionalCallback);
      }

      this.setState({
        modalCount: modalQueue.length,
        currentClosedCount: this.state.currentClosedCount + 1,
      }, optionalCallback);
    }
  };

  _activateModal = () => {
    this.setState({
      isVisible: true,
    });
  };

  deactivateModal = (optionalCallback) => {
    this._modalQueue.shift();
    this._reprocessQueue(optionalCallback);
  };

  deactivateByTag = ({ tag }, optionalCallback) => {
    if (!tag) {
      return console.error('deactivateByTag requires a tag.');
    }

    const queue = this._modalQueue;
    for (let i = 0, len = queue.length; i < len; i++) {
      const modal = queue[i];
      if (modal.tag === tag) {
        modal.deactivated = true;
        break;
      }
    }
    this._reprocessQueue(optionalCallback);
  };

  /**
   * Creates a modal based on the specified options.
   * @param {string|object} options
   * @param {string|JSX.Element} options.header - Title at top of dialog.
   * @param {string|JSX.Element} options.body - The core content.
   * @param {undefined|Object[]} options.actions - Div containing buttons or status info.
   * @param {boolean} [options.unskippable] - If true, dialog cannot be skipped. Avoid where possible.
   * @param {boolean} [options.prioritise] - If true, pushes the dialog to the front. Avoid where possible.
   * @returns {Modal}
   */
  buildModal = (
    {
      header='Message', body='', actions, unskippable=false, prioritise=false,
      tag, inline=false, renderCustomDialog=null, onForceClose=()=>{},
    }
  ) => {
    Modal.allowExternalListeners = false;

    if (onForceClose) {
      this._forceCloseListener = onForceClose;
    }
    else {
      this._forceCloseListener = () => {};
    }

    this._registerKeyListeners();
    if (!actions) {
      actions = [
        { name: 'Close', onSelect: () => this.deactivateModal() },
      ];
    }

    this._activateModal();

    const options = {
      header, body, actions, unskippable, prioritise, tag,
      deactivated: false, inline, renderCustomDialog,
    };

    if (prioritise) {
      this._modalQueue.unshift(options);
    }
    else {
      this._modalQueue.push(options);
    }

    this.setState({
      modalCount: this._modalQueue.length - 1,
      highestRecentCount: this.state.highestRecentCount + 1,
      selectionIndex: 0,
    });
  };

  _hide = (optionalCallback) => {
    this._removeKeyListeners();
    Modal.allowExternalListeners = true;
    this.setState({
      isVisible: false,
      currentClosedCount: 0,
      highestRecentCount: 0,
    }, optionalCallback);
  };

  _registerKeyListeners = () => {
    document.addEventListener('keydown', this._receiveKeyEvent, true);
  };

  _removeKeyListeners = () => {
    document.removeEventListener('keydown', this._receiveKeyEvent, true);
  };

  _receiveKeyEvent = (event) => {
    const { code } = event;
    if (code === 'Escape') {
      // Hard-quit; 'Escape' means cancel.
      return this.deactivateModal(() => {
        this._forceCloseListener && this._forceCloseListener(null);
      });
    }

    Modal.allowExternalListeners = false;
    // Capture mode is used by features such as setting key bindings to
    // detect which controls the user wants to map. Unless we're capturing
    // keys, we have no need for special keys, and can allow external
    // listeners such as the input manager plugin to process keys.
    if (code === 'F11' || code === 'F12') {
      Modal.allowExternalListeners = true;
      return;
    }

    event.stopPropagation();

    if (code === 'Enter' || code === 'NumpadEnter') {
      return this._select();
    }

    let selected = this.state.selectionIndex || 0;

    if (code === 'ArrowDown' || code === 'ArrowRight') {
      selected++;
      let length = this.getActiveModal()?.actions?.length;
      if (typeof length !== 'number') {
        length = 1;
      }
      if (selected >= length) {
        selected = length - 1;
      }
      this.setState({ selectionIndex: selected });
    }
    else if (code === 'ArrowUp' || code === 'ArrowLeft') {
      selected--;
      if (selected < 0) {
        selected = 0;
      }
      this.setState({ selectionIndex: selected });
    }
  };

  _select = (selected) => {
    if (typeof selected !== 'number') {
      selected = this.state.selectionIndex || 0;
    }
    const activeModal = this.getActiveModal() || {};
    if (!activeModal.actions?.length) {
      return;
    }
    const action = activeModal.actions[selected];
    if (action.disabled) {
      return;
    }

    const callback = action.onSelect;
    if (typeof callback === 'function') {
      callback({ selected, ...action });
    }
  };

  _getModalCountText() {
    const modalCount = this._modalQueue.length;
    let modalCountText = '';
    const { currentClosedCount, highestRecentCount } = this.state;
    if (modalCount > 1 || currentClosedCount > 0) {
      modalCountText = `(${currentClosedCount + 1}/${highestRecentCount}) `;
    }
    return modalCountText;
  }

  /**
   * Retrieves the active modal from the modal queue.
   * @returns {Object|undefine} The active modal object, or undefined if the
   * queue is empty.
   */
  getActiveModal = () => {
    return this._modalQueue[0];
  };

  /**
   * Backwards compatible with window.alert.
   * @param {string|object} options
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   * @param [optionalCallback]
   */
  alert = (options, optionalCallback) => {
    if (typeof options === 'string') {
      options = {
        body: options,
      };
    }

    if (typeof optionalCallback === 'function' && !options.actions) {
      options.actions = [
        {
          name: 'OK',
          onSelect: () => {
            this.deactivateModal(() => optionalCallback(true));
          }
        },
      ];
    }

    options.onForceClose = optionalCallback;
    this.buildModal(options);
  };

  /**
   * @param {string|object} options
   * @param {undefined|function} [callback] - Optional. Omit if using options.
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   * @param {undefined|string} options.yesText - Text to use for positive button.
   * @param {undefined|string} options.noText - Text to use for negative button.
   */
  confirm = (options, callback) => {
    if (typeof options === 'string') {
      options = {
        body: options,
      };
    }

    if (typeof callback !== 'function') {
      callback = () => console.warn('No callbacks passed to confirm.');
    }

    if (!options.actions) {
      options.actions = [
        {
          name: options.yesText ? options.yesText : 'Yes',
          onSelect: () => {
            this.deactivateModal(() => callback(true));
          }
        },
        {
          name: options.noText ? options.noText : 'No',
          onSelect: () => {
            this.deactivateModal(() => callback(false));
          }
        },
      ];
    }

    options.onForceClose = callback;
    this.buildModal(options);
  };

  /**
   * Asks a question and offers the user with a list of options to select from.
   * Intended to be used in place of dropdowns, which in their standard form
   * are somewhat difficult to get right when allowing for peripherals other
   * than the mouse.
   * @param {object} options
   * @param {string|JSX.Element} options.header
   * @param {undefined|JSX.Element} options.actions
   * @param callback
   */
  buttonPrompt = (options={}, callback) => {
    if (typeof callback !== 'function') {
      callback = () => console.warn('No callbacks passed to buttonPrompt.');
    }

    if (!options.actions) {
      options.actions = [{ name: 'Default', value: 0 }];
    }

    options.actions.forEach((item) => {
      item.onSelect = () => {
        this.deactivateModal(() => callback(item));
      }
    });

    options.inline = true;
    if (typeof options.body !== 'string') {
        options.body = 'Please select an option:';
    }

    options.onForceClose = callback;
    this.buildModal(options);
  };

  /**
   * @param {string|object} options
   * @param {undefined|function} [callback] - Optional. Omit if using options.
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   */
  prompt = (options, callback) => {
    let recordedText = '';

    let question = 'Enter a value:';
    if (typeof options === 'string') {
      question = options;
      options = {};
    }
    else if (typeof options.body === 'string') {
      question = options.body;
    }

    options.body = (
      <div>
        {question}<br/><br/>
        {/* auto focus: */}
        <Input fluid icon={icons.text} focus autoFocus onChange={
          event => {
            recordedText = event.target.value;
            this.setState({ selectionIndex: 0 });
          }
        }/>
      </div>
    );

    if (typeof callback !== 'function') {
      callback = () => console.warn('No callbacks passed to prompt.');
    }

    if (!options.actions) {
      const onClick = (text) => {
        this.deactivateModal(() => callback(text));
      };

      options.actions = [
        {
          name: 'Submit',
          onSelect: () => {
            this.deactivateModal(() => callback(recordedText));
          }
        },
        {
          name: 'Cancel',
          onSelect: () => {
            this.deactivateModal(() => callback(null));
          }
        },
      ];
    }

    options.onForceClose = callback;
    this.buildModal(options);
  };

  /**
   * Changes the contents of the modal currently visible.
   * @param modalOptions
   */
  modifyModal = (modalOptions) => {
    if (!this._modalQueue.length) {
      return;
    }
    this._modalQueue[0] = modalOptions;
    this.forceUpdate();
  };

  render() {
    const activeModal = this.getActiveModal() || {};
    const { inline, renderCustomDialog } = activeModal;

    if (renderCustomDialog) {
      return renderCustomDialog();
    }

    const selected = this.state.selectionIndex || 0;
    const modalCountText = this._getModalCountText();
    const darkMode = Settings.isDarkModeEnabled();

    return (
      <SemanticModal
        className={`kosm-modal${darkMode ? '' : ' inverted'}`}
        open={!!this._modalQueue.length}
      >
        <SemanticModal.Header>
          {modalCountText}
          {activeModal.header}
        </SemanticModal.Header>
        <SemanticModal.Content>
            {activeModal.body}
        </SemanticModal.Content>
        <div
          {...this.props}
        >
          <div className='kosm-modal-actions'>
            {activeModal?.actions?.map((menuEntry, index) => {
              // React element was passed in instead of regular object.
              if (React.isValidElement(menuEntry)) {
                return menuEntry;
              }

              return (
                <Button
                  key={`ModalButton-${index}`}
                  primary={selected === index}
                  disabled={menuEntry.disabled || false}
                  onClick={() => {
                    this.setState({ selectionIndex: index }, () => {
                      this._select(index);
                    });
                  }}
                >
                  {menuEntry.name}
                </Button>
              );
            })}
            {activeModal?.actions?.length === 0 ? (<><br/><br/></>) : null}
          </div>
        </div>
      </SemanticModal>
    );
  }
}
