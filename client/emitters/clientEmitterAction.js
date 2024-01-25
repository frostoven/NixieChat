let _autoCounter = 0;

const clientEmitterAction = {
  // Exists only so that we can write things like "if (!validAction)".
  nop: _autoCounter++,
  reloadStorage: _autoCounter++,
  reloadApp: _autoCounter++,
  // Action indicating that some ContactCreator instance has had significant
  // changes. Used by UIs to rerender themselves if they're concerned with
  // adding new contacts and need live updates.
  updateContactCreatorViews: _autoCounter++,
  // Used for DH and handshake net status updates. Contains the step being run
  // and the overall progress percentage.
  updateDhStatus: _autoCounter++,
};

export {
  clientEmitterAction,
}
