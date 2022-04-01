/**
 * A class to store test results.
 * Author: Ronen Ness.
 * Created: 2022.
 * License: MIT.
 * 
*/
'use strict';


/**
 * Class to store the test results of a single test suite.
 */
class TestResult
{
    /**
     * Create test results container.
     * @param {TestSuite} suite Test suite we create results for.
     * @param {*} logger Logger handler class.
     */
    constructor(suite, logger)
    {
        this._suite = suite;
        this._results = new Map();
        this._caseStartTime = {};
        this._errors = 0;
        this._success = 0;
        this._casesCount = 0;
        this.logger = logger;
    }

    /**
     * Check if a given test case have results or if its still waiting.
     * @param {String} name Test case name to check.
     * @returns True if have any result for test, false otherwise.
     */
    hasResultFor(name)
    {
        return Boolean(this._results.get(name));
    }

    /**
     * Check if a given test case has an error.
     * @param {String} name Test case name to check.
     * @returns True if have an error, false otherwise.
     */
    isError(name)
    {
        return this.hasResultFor(name) && this._results.get(name).success === false;
    }

    /**
     * Check if a given test case is a success.
     * @param {String} name Test case name to check.
     * @returns True if done and have no errors, false otherwise.
     */
    isSuccess(name)
    {
        return this.hasResultFor(name) && this._results.get(name).success === true;
    }

    /**
     * Get test suite name.
     */
    get testName()
    {
        return this._suite.name;
    }
    
    /**
     * Get test suite description.
     */
    get testDescription()
    {
        return this._suite.description;
    }

    /**
     * Get test results.
     */
    get results()
    {
        return this._results.entries();
    }

    /**
     * Get errors count.
     */
    get errorsCount()
    {
        return this._errors;
    }

    /**
     * Get success count.
     */
    get successCount()
    {
        return this._success;
    }

    /**
     * Get total results count.
     */
    get totalCount()
    {
        return this._casesCount;
    }

    /**
     * Start a test case.
     * @private
     * @param {String} caseName Test case name.
     */
    _startCase(caseName)
    {
        this._casesCount++;
        this._caseStartTime[caseName] = accurateTimestamp();
    }

    /**
     * Add error to test.
     * @private
     * @param {String} caseName Test case name.
     * @param {String} reason Reason for failure.
     * @param {Array<String>} stackTrace Error stack trace.
     */
    _addError(caseName, reason, stackTrace)
    {
        if (!this._results.get(caseName)) {
            let testTime = Math.round((accurateTimestamp() - this._caseStartTime[caseName]) * 1000) / 1000;
            this._results.set(caseName, {success: false, reason: reason, time: testTime, stackTrace: stackTrace || []});
            this.logger.warn(`[Testizy] [${this._suite.name}] Failed: '${reason}'.`);
            this._errors++;
        }
    }
    
    /**
     * Add success to test case unless there was an error.
     * @private
     * @param {String} caseName Test case name.
     */
    _addSuccessIfDidntFail(caseName)
    {
        if (!this._results.get(caseName)) {
            let testTime = Math.round((accurateTimestamp() - this._caseStartTime[caseName]) * 1000) / 1000;
            this._results.set(caseName, {success: true, time: testTime, reason: null});
            this.logger.debug(`[Testizy] [${this._suite.name}] Success.`);
            this._success++;
        }
    }
}


/**
 * Get accurate timestamp in ms.
 * @private
 */
function accurateTimestamp()
{
    if (typeof performance !== 'undefined') {
        return performance.now();
    }
    return (new Date).getTime();
}


module.exports = TestResult;