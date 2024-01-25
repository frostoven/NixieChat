const _ = require('lodash');

/**
 * Class that does runtime type and value checking. Used by the API endpoints.
 * All functions return boolean values: True if the test passed, false if it
 * failed.
 */
class AssertReject {
  /**
   * Please override this via the constructor.
   * @param {string} logTitle
   * @param {string} failedCheck
   * @param {function} onError
   * @return {boolean|*}
   */
  checkFailed = (logTitle, failedCheck, onError) => {
    onError({ error: `[example response] '${logTitle}' ${failedCheck}` });
    return false;
  };

  constructor(onCheckFail) {
    if (typeof onCheckFail === 'function') {
      this.checkFailed = onCheckFail;
    }
    else {
      console.warn('[AssertReject] No onError callback specified.');
    }
  }

  /**
   * @param {string} logTitle
   * @param {string|undefined} value
   * @param {number|undefined} [maxLength] - 0 means "don't check".
   * @param {function} onError
   * @return {boolean}
   */
  string(logTitle, value, maxLength, onError) {
    if (typeof value !== 'string') {
      return this.checkFailed(logTitle, 'is not a string.', onError);
    }

    if (maxLength && value.length > maxLength) {
      return this.checkFailed(logTitle, `larger than ${maxLength} characters.`, onError);
    }

    return true;
  }

  /**
   * @param {string} logTitle
   * @param {string} value
   * @param {number} [maxLength] - 0 means "don't check".
   * @param {function} onError
   * @return {boolean}
   */
  stringOrNull(logTitle, value, maxLength, onError) {
    if (value === null) {
      return true;
    }

    return this.string(logTitle, value, maxLength, onError);
  }

  /**
   * @param {string} logTitle
   * @param {string} value
   * @param {function} onError
   * @return {boolean}
   */
  nonEmptyString(logTitle, value, onError) {
    if (typeof value === 'string' && value !== '') {
      return true;
    }

    return this.checkFailed(logTitle, 'bad string.', onError);
  }

  /**
   * Check if the specified value is an object. Returns false for null and
   * arrays.
   * @param {string} logTitle
   * @param {object} value
   * @param {function} onError
   * @return {boolean}
   */
  nonNullObject(logTitle, value, onError) {
    if (_.isObject(value) && !Array.isArray(value)) {
      return true;
    }

    return this.checkFailed(logTitle, 'not a valid object.', onError);
  }
}

module.exports = {
  AssertReject,
};
