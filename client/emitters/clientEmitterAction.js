let _autoCounter = 0;

const clientEmitterAction = {
  nop: _autoCounter++,
  softReloadApp: _autoCounter++,
  hardReloadApp: _autoCounter++,
};

export {
  clientEmitterAction,
}
