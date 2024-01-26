import Modal from './modal/Modal';

declare global {
  interface Window {
    $dialog: Modal;
    $floatingForm: Modal;
  }
}
