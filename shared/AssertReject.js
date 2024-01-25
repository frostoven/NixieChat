const _ = require('lodash');

const { isObject, isNumber } = _;
const isArray = Array.isArray;
const isView = ArrayBuffer.isView;

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
      return this.checkFailed(
        logTitle, `is larger than ${maxLength} characters.`, onError,
      );
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
   * @param {number} [maxLength] - 0 means "don't check".
   * @param {function} onError
   * @return {boolean}
   */
  nonEmptyString(logTitle, value, maxLength, onError) {
    if (value === '') {
      return this.checkFailed(logTitle, 'is empty.', onError);
    }

    return this.string(logTitle, value, maxLength, onError);
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
    if (isObject(value) && !isArray(value)) {
      return true;
    }

    return this.checkFailed(logTitle, 'is not a valid object.', onError);
  }

  /**
   * Check if the specified value is an array, and that it holds data.
   * @param {string} logTitle
   * @param {array} value
   * @param {function} onError
   * @return {boolean}
   */
  nonEmptyArray(logTitle, value, onError) {
    if (isArray(value) && value.length !== 0) {
      return true;
    }

    return this.checkFailed(logTitle, 'is not a populated array.', onError);
  }

  /**
   * @param {string} logTitle
   * @param {string|undefined} value
   * @param {number|undefined} minSize
   * @param {function} onError
   * @return {boolean}
   */
  numberLessThan(logTitle, value, minSize = -Infinity, onError) {
    if (isNumber(value)) {
      if (value < minSize) {
        return this.checkFailed(logTitle, `is too small.`, onError);
      }
      else {
        return true;
      }
    }

    return this.checkFailed(logTitle, `is not a valid number.`, onError);
  }

  /**
   * Any number except NaN (which is a number by technical definition).
   * @param {string} logTitle
   * @param {string|undefined} value
   * @param {function} onError
   * @return {boolean}
   */
  anyNumber(logTitle, value, onError) {
    if (_.isNumber(value) && !isNaN(value)) {
      return true;
    }

    return this.checkFailed(logTitle, `is not a valid number.`, onError);
  }

  /**
   * @param {string} logTitle
   * @param {string|undefined} value
   * @param {number|undefined} maxSize
   * @param {function} onError
   * @return {boolean}
   */
  bufferSmallerThan(logTitle, value, maxSize, onError) {
    if (isView(value) && value.length < maxSize) {
      return true;
    }

    return this.checkFailed(logTitle, 'is not an appropriate buffer.', onError);
  }
}

module.exports = {
  AssertReject,
};
