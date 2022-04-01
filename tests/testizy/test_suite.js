/**
 * Define a test suite (contains a collection of test cases for a specific functionality or module).
 * Author: Ronen Ness.
 * Created: 2022.
 * License: MIT.
 * 
*/
'use strict';
const TestFailedException  = require('./test_failed_exception');
const TestResult = require("./test_result");
const Assert = require("./assert");

/**
 * Represent a test suite.
 */
class TestSuite
{
    /**
     * Create the test suite.
     * @param {String} name Test suite name.
     * @param {*} params Optional additional params. May include:
     *                      - description: test suite textual description.
     * @param {*} logger Logger handler class.
     */
    constructor(name, params, logger)
    {
        this._name = name;
        this._params = params || {};
        this.logger = logger;
        this._cases = new Map();
    }

    /**
     * Get suite name.
     */
    get name()
    {
        return this._name;
    }

    /**
     * Get test suite description.
     */
    get description()
    {
        return this._params.description || "";
    }

    /**
     * Define a test case.
     * @param {String} name Test case name.
     * @param {Function} method Test case implementation method. Get 'Assert' instance as a single parameter.
     * @param {*} params Optional additional params for this test case. May include:
     *                     - timeout: timeout in ms to run the case. defaults to 10000.
     */
    case(name, method, params)
    {
        // log
        this.logger.info(`[Testizy] [${this._name}] Define test case: '${name}'.`);

        // sanity
        if (this._cases.get(name)) {
            throw new Error(`A test case named '${name}' already exists!`);
        }

        // default params
        params = params || {};
        params.timeout = params.timeout || 10000;

        // store case
        this._cases.set(name, {method: method, params: params});
    }

    /**
     * Set a setup method to run before tests.
     * @param {Function} method Setup function to run before tests.
     * @param {Number} timeout Timeout for setup code, in ms (only for async code). Defaults to 10000.
     */
    setup(method, timeout)
    {
        this._setup = {method: method, params: {timeout: timeout || 10000}};
    }

    /**
     * Set a setup method to run after tests.
     * @param {Function} method Teardown function to run after tests.
     * @param {Number} timeout Timeout for teardown code, in ms (only for async code). Defaults to 10000.
     */
    teardown(method, timeout)
    {
        this._teardown = {method: method, params: {timeout: timeout || 10000}};
    }

    /**
     * Create an artifical delay between test cases.
     * This will generate a "test case" that just waits for the given time.
     * @param {Number} time How long to wait, in milliseconds.
     * @param {String} reason Waiting reason, will appear as case name.
     */
    wait(time, reason) 
    {
        this.case('[wait] ' + reason, (assert) => 
        {
            return new Promise((resolve, reject) => 
            {
                setTimeout(resolve, time);
            });
        }, {timeout: time + 1000});
    }
    
    /**
     * Run this test suite.
     * @returns {Promise<TestResult>} Test results.
     */
    run()
    {
        return new Promise(async (resolve, reject) => {

            // start running test suite
            this.logger.info(`[Testizy] [${this._name}] Start running..`);
            let result = new TestResult(this, this.logger);

            // execute case inside an async method that returns a promise
            // that way we can handle cases that return promises while having a timeout to break them if they don't finish on time
            let execution = async (caseName, testCase, result) => {

                return new Promise(async (resolve, reject) => {
                    try {

                        // start case
                        result._startCase(caseName);

                        // create assert object
                        let assert = new Assert();

                        // run test and get promise (if test indeed returns a promise)
                        let promise = testCase.method(assert);

                        // set timeout to break the case if its async
                        if (promise && testCase.params.timeout) {
                            setTimeout(() => {
                                if (!result.hasResultFor(caseName)) {
                                    result._addError(caseName, `Test did not finish in timely manner (timeout: ${testCase.params.timeout} ms)`, null);
                                    resolve(false);
                                }
                            }, testCase.params.timeout);
                        }

                        // if we got a promise, wait for it
                        if (promise) {
                            await promise;
                        }

                        // success
                        result._addSuccessIfDidntFail(caseName);
                    }
                    // handle exceptions and assert failures
                    catch (e) {

                        // assert failed
                        if (e instanceof TestFailedException) {
                            result._addError(caseName, e.message, e.stack);
                        }
                        // unknown exception
                        else {
                            this.logger.warn(`[Testizy] [${this._name}] Got exception while running test case: '${caseName}'. Exception: ${e}.`);
                            result._addError(caseName, `Exception while running test: ${e}`);
                        }
                    }

                    // return success or failure
                    resolve(result.isSuccess(caseName));
                });
            }

            // run setup code
            if (this._setup) {
                this.logger.debug(`[Testizy] [${this._name}] Run setup code.`);
                let success = await execution('__setup__', this._setup, result);
                if (!success) {
                    this.logger.warn(`[Testizy] [${this._name}] Will not run tests because had an error during setup code.`);
                    resolve(result);
                    return;
                }
            }

            // iterate and execute cases
            for (const [caseName, testCase] of this._cases.entries()) {

                // run test case and await for it to finish, either from timeout or actually finish
                this.logger.debug(`[Testizy] [${this._name}] Run test case: '${caseName}'.`);
                await execution(caseName, testCase, result);
            }

            // run teardown code
            if (this._teardown) {
                this.logger.debug(`[Testizy] [${this._name}] Run teardown code.`);
                let success = await execution('__teardown__', this._teardown, result);
                if (!success) {
                    this.logger.warn(`[Testizy] [${this._name}] Had error in teardown code.`);
                }
            }

            // done!
            this.logger.info(`[Testizy] [${this._name}] Finished all cases. Errors: ${result.errorsCount}, Success: ${result.successCount}.`);
            resolve(result);
        });
    }
}

module.exports = TestSuite;