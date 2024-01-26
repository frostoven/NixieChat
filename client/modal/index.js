import * as ReactDOM from 'react-dom';
import React from 'react';
import Modal from './Modal';
import './nixieDialogs';

// Add CSS style tag.
const style = document.createElement('style');
// style.type = 'text/css';
style.innerHTML = `
  .__kosmModalRoot {
    overflow: auto;
  }

  .kosm-modal {
    top: 50%;
    transform: translateY(-50%);
  }

  .kosm-modal.inverted > .header {
    color: #000;
    background-color: #a4f2ac;
  }
  
  .kosm-modal.inverted,
  .kosm-modal.inverted .content,
  .kosm-modal.inverted .content .header
  {
    color: #000;
    background-color: #fff;
  }

  .kosm-modal-actions {
    text-align: right;
    padding-bottom: 4px;
  }

  .inverted .kosm-modal-actions .ui.primary.button {
    background-color: #53ad39;
  }

  .inverted .kosm-modal-actions .ui.secondary.button {
    background-color: #53ad39;
  }

  /* z-index for $dialog */
  .ui.page.modals.dimmer:has(.kosmPriorityDialog) {
    z-index: 1000;
  }
  .kosmPriorityDialog {
    z-index: 1001;
  }

  /* z-index for $FormDialog */
  .ui.page.modals.dimmer:has(.kosmFormDialog) {
    z-index: 997;
  }
  .kosmFormDialog {
    z-index: 998;
  }
`;
document.getElementsByTagName('head')[0].appendChild(style);

// Create the $dialog root node.
const dialog = document.createElement('div');
dialog.className = '__kosmModalRoot';
dialog.style.position = 'fixed';
document.body.append(dialog);
ReactDOM.render(
  <Modal className="kosmPriorityDialog" globalName="$dialog"/>,
  dialog,
);

// Create the floatingForm root node.
const floatingForm = document.createElement('div');
floatingForm.className = '__kosmModalRoot';
floatingForm.style.position = 'fixed';
document.body.append(floatingForm);
ReactDOM.render(
  <Modal className="kosmFormDialog" globalName="$floatingForm"/>,
  floatingForm,
);

