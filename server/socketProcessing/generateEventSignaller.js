/**
 * The creates an event object with listener callback standby.
 * @param [context] - Optional reference to the parent context if you're
 * targeting a class.
 */
const generateEventSignaller = (context = null) => {
  let callbacks = [];
  return {
    /**
     * Add callback to listen for triggered events.
     * @param {function} callback
     */
    addListener: (callback) => {
      callbacks.push(callback);
    },
    /**
     * Remove callback previously added using addListener.
     * @param {function} callback
     */
    removeListener: (callback) => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        return callbacks.splice(index, Math.max(index, 0));
      }
      else {
        console.error('[removeListener] Could not find callback', callbacks);
      }
    },
    /**
     * Trigger all callbacks registered via addListener.
     * @param [data] - Optional data to send to all listeners.
     */
    trigger: (data) => {
      for (let i = 0, len = callbacks.length; i < len; i++) {
        const callback = callbacks[i];
        if (context) {
          callback.apply(context, data);
        }
        else {
          callback(data);
        }
      }
    },
    // Debug function.
    _getCallbacks: () => {
      return callbacks;
    },
  }
};

module.exports = {
  generateEventSignaller,
};
