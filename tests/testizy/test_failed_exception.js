/**
 * Define an exception we raise when a test fails.
 * Author: Ronen Ness.
 * Created: 2022.
 * License: MIT.
 * 
*/
'use strict';


/**
 * Define an exception for failing test.
 * @param {String} message Test failure exception.
 */
 function TestFailedException(message) {
    this.message = message;
    // Use V8's native method if available, otherwise fallback
    if ("captureStackTrace" in Error) {
        Error.captureStackTrace(this, TestFailedException);
    }
    else {
        this.stack = (new Error()).stack;
    }
    if (typeof this.stack === 'string') {
        this.stack = this.stack.split('\n');
    }
}
TestFailedException.prototype = Object.create(Error.prototype);
TestFailedException.prototype.name = "TestFailedException";
TestFailedException.prototype.constructor = TestFailedException;


module.exports = TestFailedException;