/**
 * Implement the testing methods.
 * Author: Ronen Ness.
 * Created: 2022.
 * License: MIT.
 * 
*/
'use strict';
const TestFailedException = require('./test_failed_exception');

/**
 * Assert class - provide the testing methods.
 * This class implements a set of comparison / testing methods, that raise `TestFailedException` exception if condition is not met.
 * That unique exception is than caught by the test suite to mark the test as a failure.
 */
class Assert
{
    /**
     * Perform strict equals comparison.
     * Handle all basic types (numbers, boolean, undefined, dates, array, dictionary, etc.) and perform recursive checks.
     * If objects implement 'equals' method, will use it.
     * @param {*} actual Actual value.
     * @param {*} expected Expected value.
     * @param {String} reason Optional error reason.
     */
    equals(actual, expected, reason)
    {
        if (!compareObjects(actual, expected)) {
            reason = reason || `${repr(actual)} and ${repr(expected)} are not equal`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Perform strict not-equals comparison.
     * Handle all basic types (numbers, boolean, undefined, dates, array, dictionary, etc.) and perform recursive checks.
     * If objects implement 'equals' method, will use it.
     * @param {*} actual Actual value.
     * @param {*} expected Expected value.
     * @param {String} reason Optional error reason.
     */
    notEquals(actual, expected, reason)
    {
        if (compareObjects(actual, expected)) {
            reason = reason || `${repr(actual)} and ${repr(expected)} are equal`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Perform a simple loose equals using the == operator.
     * @param {*} actual Actual value.
     * @param {*} expected Expected value.
     * @param {String} reason Optional error reason.
     */
    looseEquals(actual, expected, reason)
    {
        if (actual != expected) {
            reason = reason || `${repr(actual)} != ${repr(expected)}`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Perform a simple loose equals using the == operator.
     * @param {*} actual Actual value.
     * @param {*} expected Expected value.
     * @param {String} reason Optional error reason.
     */
    looseNotEquals(actual, expected, reason)
    {
        if (actual == expected) {
            reason = reason || `${repr(actual)} == ${repr(expected)}`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Fail the test without condition.
     * @param {String} reason Optional error reason.
     */
    fail(reason)
    {
        reason = reason || `'fail()' was called`;
        throw new TestFailedException(reason);
    }

    /**
     * Make sure given value translates to Boolean true.
     * @param {*} actual Actual value to check.
     * @param {String} reason Optional error reason.
     */
    true(actual, reason)
    {
        if (!Boolean(actual)) {
            reason = reason || `Boolean(${repr(actual)}) is not true`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Make sure given value translates to Boolean false.
     * @param {*} actual Actual value to check.
     * @param {String} reason Optional error reason.
     */
    false(actual, reason)
    {
        if (Boolean(actual)) {
            reason = reason || `Boolean(${repr(actual)}) is not false`;
            throw new TestFailedException(reason);
        }
    }
    
    /**
     * Check if values are the same using Object.is().
     * @param {*} actual Actual value to check.
     * @param {*} expected Expected value.
     * @param {String} reason Optional error reason.
     */
    is(actual, expected, reason)
    {
        if (!Object.is(actual, expected)) {
            reason = reason || `Object.is(${repr(actual)}, ${repr(expected)}) is false`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Check if values are not the same using !Object.is().
     * @param {*} actual Actual value to check.
     * @param {*} expected Expected value.
     * @param {String} reason Optional error reason.
     */
    isNot(actual, expected, reason)
    {
        if (Object.is(actual, expected)) {
            reason = reason || `Object.is(${repr(actual)}, ${repr(expected)}) is true`;
            throw new TestFailedException(reason);
        }
    }
    
    /**
     * Call a given method and expect a given exception (or any if 'errorType' is not defined).
     * @param {*} method Method to call and expect exception from.
     * @param {*} errorType Optional error type to except (if not defined, will except any).
     * @param {String} reason Optional error reason.
     */
    except(method, errorType, reason)
    {
        // sanity
        if (typeof method !== 'function') {
            throw new Error("'method' must be a function!");
        }

        // run test
        let gotException;
        try {
            method();
            gotException = false;
        }
        // handle exceptions
        catch (e) {
            gotException = true;
            if (errorType && e.constructor !== errorType) {
                reason = reason || `Expected ${errorType.name || repr(errorType)}, but got error of type ${e.constructor.name || repr(expected)}) instead`;
                throw new TestFailedException(reason);
            }
        }

        if (!gotException) {
            reason = reason || `Expected an exception but didn't get any`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Check if a value is not null / undefined, but is empty.
     * Can handle any object that has 'length' or 'size', or return a valid value from Object.keys() or Object.entries().
     * @param {*} actual Actual value to check.
     * @param {String} reason Optional error reason.
     */
    empty(actual, reason)
    {
        // make sure not null or undefined
        if (!actual) {
            reason = reason || `Object is null or undefined.`;
            throw new TestFailedException(reason);
        }

        // make sure suitable for test
        if ((actual.size === undefined) && (actual.length === undefined) && !(actual instanceof Object)) {
            reason = reason || `Object type is not suitable for 'empty' check.`;
            throw new TestFailedException(reason);
        }

        // check if empty
        if (!isEmpty(actual)) {
            reason = reason || `Object is not empty.`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Check if a value is not null / undefined, and is not empty.
     * Can handle any object that has 'length' or 'size', or return a valid value from Object.keys() or Object.entries().
     * @param {*} actual Actual value to check.
     * @param {String} reason Optional error reason.
     */
    notEmpty(actual, reason)
    {
        // make sure not null or undefined
        if (!actual) {
            reason = reason || `Object is null or undefined.`;
            throw new TestFailedException(reason);
        }

        // make sure suitable for test
        if ((actual.size === undefined) && (actual.length === undefined) && !(actual instanceof Object)) {
            reason = reason || `Object type is not suitable for 'notEmpty' check.`;
            throw new TestFailedException(reason);
        }

        // check if empty
        if (isEmpty(actual)) {
            reason = reason || `Object is empty.`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Check if value is an instance of type.
     * @param {*} actual Actual value to check.
     * @param {*} type Object to check if value is instance of.
     * @param {String} reason Optional error reason.
     */
    instanceOf(actual, type, reason)
    {
        // special checks
        if (type === Number) {
            if (typeof actual !== 'number') {
                reason = reason || `${repr(actual)} is not instanceof ${type.name || repr(type)}`;
                throw new TestFailedException(reason);
            }
            return;
        }
        if (type === Boolean) {
            if (typeof actual !== 'boolean') {
                reason = reason || `${repr(actual)} is not instanceof ${type.name || repr(type)}`;
                throw new TestFailedException(reason);
            }
            return;
        }
        if (type === String) {
            if (typeof actual !== 'string') {
                reason = reason || `${repr(actual)} is not instanceof ${type.name || repr(type)}`;
                throw new TestFailedException(reason);
            }
            return;
        }
        if (type === Function) {
            if (typeof actual !== 'function') {
                reason = reason || `${repr(actual)} is not instanceof ${type.name || repr(type)}`;
                throw new TestFailedException(reason);
            }
            return;
        }
        if (type === undefined) {
            if (typeof actual !== 'undefined') {
                reason = reason || `${repr(actual)} is not instanceof ${type.name || repr(type)}`;
                throw new TestFailedException(reason);
            }
            return;
        }

        // default
        if (!(actual instanceof type)) {
            reason = reason || `${repr(actual)} is not instanceof ${type.name || repr(type)}`;
            throw new TestFailedException(reason);
        }
    }

    /**
     * Create a promise and resolve it after given time, used to create sleeping time in test cases.
     * @example
     * await assert.sleep(1000, 'Wait for one second.');
     * @param {Number} timeMs Time to sleep, in ms.
     * @param {String} comment Optional waiting comment.
     */
    wait(timeMs, comment)
    {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, timeMs);
        });
    }
}

/**
 * Get textual representation of a value.
 * @private
 */
function repr(val)
{
    if (typeof val === 'number') {
        return val;
    }

    try {
        return JSON.stringify(val);
    }
    catch(e) {
        return val;
    }
}

/**
 * Check if a given value is empty.
 * @private
 */
function isEmpty(actual)
{
    if ((actual.length === 0) || (actual.size === 0)) {
        return true;
    }
    else if ((typeof actual.length === 'number') || (typeof actual.size === 'number')) {
        return false;
    }
    return (Object.keys(actual).length === 0) && (Object.entries(actual).length === 0);
}

/**
 * Deep compare objects.
 * @private
 */
function compareObjects(o1, o2)
{
    // use 'equals' method
    if (o1 && o1.equals) {
        return o1.equals(o2);
    }
    if (o2 && o2.equals) {
        return o2.equals(o1);
    }

    // compare primitives
    if ((typeof o1 === 'string' || typeof o1 === 'number' || typeof o1 === 'boolean' || o1 === null || o1 === undefined || o1 instanceof Function) ||
        (typeof o2 === 'string' || typeof o2 === 'number' || typeof o2 === 'boolean' || o2 === null || o2 === undefined || o2 instanceof Function)) {
        return o1 === o2;
    }

    // check types
    if (o1 && o2 && o1.constructor !== o2.constructor) {
        return false;
    }

    // date objects
    if (o1 instanceof Date) {
        if (!(o2 instanceof Date)) { return false; }
        return o1.getTime() === o2.getTime();
    }
    if (o2 instanceof Date) {
        if (!(o1 instanceof Date)) { return false; }
        return o2.getTime() === o1.getTime();
    }

    // convert sets to arrays
    if (o1 instanceof Set) { o1 = Array.from(o1); }
    if (o2 instanceof Set) { o2 = Array.from(o2); }

    // compare arrays
    if (o1 instanceof Array || o2 instanceof Array) 
    {
        // one is not array? error
        if (!(o1 instanceof Array) || !(o2 instanceof Array)) {
            return false;
        }

        // different length?
        if (o1.length !== o2.length) {
            return false;
        }

        // compare values
        for (let i = 0; i < o1.length; ++i) {
            if (!compareObjects(o1[i], o2[i])) {
                return false;
            }
        }
    }

    // if we got here we need to iterate object keys.
    // get keys and sort them.
    let keysO1 = Object.keys(o1).sort();
    let keysO2 = Object.keys(o2).sort();

    // different number of keys? not equal.
    if (keysO1.length !== keysO2.length) {
        return false;
    }

    // different key values? not equal.
    for (let i = 0; i < keysO1.length; ++i) {
        if (!compareObjects(keysO1[i], keysO2[i])) {
            return false;
        }
    }

    // iterate keys to compare values in objects recursively
    for (let i = 0; i < keysO1.length; ++i)
    {
        let valo = o1[keysO1[i]];
        let valp = o2[keysO1[i]];
        if (!compareObjects(valo, valp)) {
            return false;
        }
    }
    return true;
}


module.exports = Assert;