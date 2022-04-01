/**
 * The main class to run and define tests.
 * Author: Ronen Ness.
 * Created: 2022.
 * License: MIT.
 * 
*/
'use strict';
const TestSuite = require('./test_suite');
const Assert = require('./assert');
const TestFailedException = require('./test_failed_exception');
const TestResult = require('./test_result');

/**
 * The main tests engine class.
 * 
 * @example
 * // create the tests suite.
 * let testizy = new Testizy();
 * 
 * // define a test suite for arithmetic operators.
 * testizy.suite('Arithmetics', (suite) => {
 *   suite.case('1 + 1 = 2', (assert) => {
 *      assert.equals(1 + 1, 2);
 *   });
 * });
 * 
 * // run all tests and render them
 * testizy.run(null, testizy.renderTest);
 */
class Testizy
{
    /**
     * Create the tests engine.
     * @param {*} logger Optional object for Testizy logs. If not set, will use console. If set to null, will not output anything.
     */
    constructor(logger)
    {
        this._tests = new Map();
        if (logger === null) { logger = NullLogger; }
        this.logger = logger || console;
        this.logger.info(`
        ___________              __  .__               
        \\__    ___/___   _______/  |_|__|__________.__.
          |    |_/ __ \\ /  ___/\\   __\\  \\___   <   |  |
          |    |\\  ___/ \\___ \\  |  | |  |/    / \\___  |
          |____| \\___  >____  > |__| |__/_____ \\/ ____|
                     \\/     \\/                \\/\\/     
        
                     A simple, modern, pure JavaScript testing framework.
                     By Ronen Ness, 2022.
                     `);
        this.logger.info(`[Testizy] Created new engine.`);
        this.logger.debug(`[Testizy] Note: set the 'logger' constructor param to null to disable verbose output from Testizy.`);
    }

    /**
     * Create a new test suite.
     * @param {String} name Test suite name.
     * @param {Function} generator Function to define the test suite cases. Receive a single parameter of 'TestSuit' type.
     * @param {*} params Optional additional params.
     * @returns {TestSuite} Newly created test suite.
     */
    suite(name, generator, params)
    {
        // log
        this.logger.info(`[Testizy] Define new test suite: '${name}'`);

        // sanity
        if (this._tests.get(name)) {
            throw new Error(`A test suite named '${name}' already exists!`);
        }

        // create test suite
        let suite = new TestSuite(name, params || {}, this.logger);
        this._tests.set(name, suite);

        // call generator method
        if (generator) {
            generator(suite);
        }

        // return the suite
        return suite;
    }

    /**
     * Run tests.
     * @param {String|Array<String>} tests Optional test suite or list of test suite names to run. Omit to run everything.
     * @param {Function} onTestFinish Optional method to call with (testName, result) every time a test suite finish running.
     * @returns {Promise<Object.<String, TestResult>>} Map with test suite name as key, and test results as value.
     */
    run(tests, onTestFinish)
    {
        return new Promise(async (resolve, reject) => {

            // default tests
            if (!tests) {
                tests = this._tests.keys();
            }
            // if a single test provided, turn to array
            else if (typeof tests === 'string') {
                tests = [tests];
            }

            // convert tests to a set
            tests = new Set(tests);

            // log
            this.logger.info(`[Testizy] Run test suites: '${Array.from(tests).join(',')}'.`);

            // run tests
            let results = new Map();
            for (const [testName, testSuite] of this._tests.entries()) {
                if (tests.has(testName)) {
                    let result = await testSuite.run();
                    results.set(testName, result);
                    if (onTestFinish) {
                        onTestFinish(testName, result);
                    }
                }
            }

            // return results
            this.logger.info(`[Testizy] Finished running tests.`);
            resolve(results);
        });
    }

    /**
     * Inject default CSS rules for testizy classes. 
     */
    injectDefaultCss()
    {
        document.head.insertAdjacentHTML("beforeend", `
            <style>
                .testizy {
                    font-family: Tahoma;
                }
                .testizy-success {
                    color: green;
                }
                .testizy-failed {
                    color: red;
                }
            </style>
        `);
    }

    /**
     * Render test results as HTML elements.
     * @param {Object.<String, TestResult>} results Test results to render.
     * @param {Element} parentDom Optional parent DOM element to render in (will use document.body if not set).
     */
    renderAllTests(results, parentDom)
    {
        this.logger.info(`[Testizy] Render test results..`);
        parentDom = parentDom || document.body;

        parentDom.innerHTML += `<h1 class='testizy-h1'>Tests Results</h1>`;
        for (const [suiteName, suiteResults] of results.entries()) {
            this.renderTest(suiteName, suiteResults);
        }

        this.logger.info(`[Testizy] Done rendering.`);
    }
    
    /**
     * Render a single test results as HTML elements.
     * @param {String} suiteName test suite name.
     * @param {suiteResults} results Test results to render.
     * @param {Element} parentDom Optional parent DOM element to render in (will use document.body if not set).
     */
    renderTest(suiteName, suiteResults, parentDom)
    {
        parentDom = parentDom || document.body;
        let successClass = suiteResults.errorsCount ? 'testizy-failed' : 'testizy-success';
        parentDom.innerHTML += `<h2 class='testizy testizy-h2 ${successClass}'>${suiteName} [${suiteResults.successCount} / ${suiteResults.totalCount}]</h2>`;
        parentDom.innerHTML += `<p class='testizy testizy-p testizy-desc ${successClass}'>${suiteResults.testDescription}</p>`;
        for (const [caseName, caseResult] of suiteResults.results) {
            if (caseResult.success) {
                parentDom.innerHTML += `<p class='testizy testizy-p testizy-success'>✔️ '${caseName}' [${caseResult.time} ms]</p>`;
            }
            else {
                parentDom.innerHTML += `<p class='testizy testizy-p testizy-failed'>❌ '${caseName}' [${caseResult.time} ms]<br /> • Error message: '${caseResult.reason}'<br /> • Origin: ${caseResult.stackTrace[2]}</p>`;
            }
        }
    }

    /**
     * Write all test results to log or console.
     * @param {Object.<String, TestResult>} results Test results to log.
     * @param {Boolean} colors Should we use console colors? Defaults to true.
     * @param {*} _console Console instance to use. Defaults to console.
     */
    logAllTests(results, colors, _console)
    {
        for (const [suiteName, suiteResults] of results.entries()) {
            this.logTest(suiteName, suiteResults, colors, _console);
        }
    }
    
    /**
     * Write a single test result to log or console.
     * @param {String} suiteName Test suite name.
     * @param {TestResult} suiteResults Test result to log.
     * @param {Boolean} colors Should we use console colors? Defaults to true.
     * @param {*} _console Console instance to use. Defaults to console.
     */
    logTest(suiteName, suiteResults, colors, _console)
    {
        _console = _console || console;

        if (colors === undefined) { colors = true; }
        let successClass = colors ? (suiteResults.errorsCount ? "\x1b[31m" : "\x1b[32m") : '';

        _console.log(successClass + `\n\n${suiteName} [${suiteResults.successCount} / ${suiteResults.totalCount}]`);
        _console.log("-----------------------------------------------------------------------------------------");
        _console.log(successClass + `${suiteResults.testDescription}`);

        for (const [caseName, caseResult] of suiteResults.results) {
            if (caseResult.success) {
                _console.log(successClass + `V '${caseName}' [${caseResult.time} ms]`);
            }
            else {
                _console.log(successClass + `X '${caseName}' [${caseResult.time} ms]\n - Error message: '${caseResult.reason}'\n - Origin: ${caseResult.stackTrace[2]}`);
            }
        }

        if (colors) {
            _console.log("\x1b[0m");
        }
    }
}



// Attach the sub-classes to the main Testizy class.
Testizy.TestSuite = TestSuite;
Testizy.TestResult = TestResult;
Testizy.Assert = Assert;
Testizy.TestFailedException = TestFailedException;

// set version
Testizy.version = '1.0.1';


// null logger to hide output
const NullLogger = {
    trace: function() {},
    debug: function() {},
    info: function() {},
    warn: function() {},
    error: function() {}
}


// for node modules
if (typeof module !== 'undefined') {
    module.exports = Testizy;
}