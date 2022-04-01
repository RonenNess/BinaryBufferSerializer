// for nodejs tests
if (typeof window === 'undefined') {
    var BinaryBufferSerializer = require('../dist/binary-buffer-serializer.js');
    var Testizy = require('./testizy');
}

// performance for node
if (typeof performance === 'undefined') {
    var performance = {
        now: function() { return (new Date()).getTime(); }
    }
}


// add result to results table
function addResult(testTitle, runsCount, jsonSize, binarySize, jsonTime, binaryTime) 
{
    // calc some values
    let sizeDecrease = jsonSize - binarySize;
    let sizeDiff = isNaN(sizeDecrease) ? '--' : Math.round((sizeDecrease / jsonSize) * 100);
    let timeDecrease = jsonTime - binaryTime;
    let timeDiff = Math.round((timeDecrease / jsonTime) * 100);

    
    // for nodejs
    if (typeof document === 'undefined') {
        let pad = function(val, amount) {
            val = val.toString();
            let repeat = Math.max(amount - val.length, 2);
            return val + ' '.repeat(repeat);
        }
        if (!this._printedTitle) {
            console.log(`# Runs     ${pad('Test Name', 42)} ${pad('JSON Size', 12)} ${pad('Binary Size', 14)} ${pad('Size Diff', 12)} ${pad('JSON Time', 12)} ${pad('Binary Time', 12)} ${'Time Diff'}`);
            this._printedTitle = true;
        }
        console.log(`${runsCount}     ${pad(testTitle, 42)} ${pad(jsonSize, 12)} ${pad(binarySize, 14)} ${pad(sizeDiff + '%', 12)} ${pad(jsonTime, 12)} ${pad(binaryTime, 12)} ${timeDiff}%`);
        return;
    }
    
    
    // for web
    let body = document.getElementById("results-body");
    body.innerHTML += `
    <tr>
        <th>${runsCount}</th>
        <th>${testTitle}</th>
        <th>${jsonSize} bytes</th>
        <th>${binarySize} bytes</th>
        <th style="color:${sizeDiff < 0 ? 'red': 'green'}">${sizeDiff}%</th>
        <th>${jsonTime} ms</th>
        <th>${binaryTime} ms</th>
        <th style="color:${timeDiff < 0 ? 'red': 'green'}">${timeDiff}%</th>
    </tr>
    `;
}


// run a test
async function runTest(testTitle, sanityCheck, jsonCheck, binaryCheck)
{
    // number of runs
    let repeats = 500000;

    // do sanity check
    try {
        sanityCheck();
    }
    catch (e) {
        addResult(testTitle, repeats, 'ERROR', 'ERROR', 'ERROR', 'ERROR');
        return;
    }

    // run json
    let jsonSize;
    let jsonTime;
    await new Promise((resolve, reject) => {
        
        {
            let start = performance.now();
            for (let i = 1; i < repeats; ++i) {
                jsonCheck();
            }
            let lastResult = jsonCheck();
            let end = performance.now();
            jsonSize = lastResult ? new TextEncoder().encode(lastResult).length : 'N/A';
            jsonTime = Math.round(end - start);
        }

        // wait 1 seconds before proceeding
        setTimeout(resolve, 1000);
    });

    // run binary
    let binarySize;
    let binaryTime;
    await new Promise((resolve, reject) => {
        
        {
            let start = performance.now();
            for (let i = 1; i < repeats; ++i) {
                binaryCheck();
            }
            binarySize = (binaryCheck() || {length: 'N/A'}).length;
            let end = performance.now();
            binaryTime = Math.round(end - start);
        }
    
        // wait 1 seconds before proceeding
        setTimeout(resolve, 1000);
    });

    // add result
    addResult(testTitle, repeats, jsonSize, binarySize, jsonTime, binaryTime);
}


// run all tests
async function runAllTests()
{

    // SERIALIZE: STRING
    {

        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).string("foo");

        // define data
        let data = {"foo": "Hello World!"};

        await runTest("Serialize simple string",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                return JSON.stringify(data);
            },

            // do binary
            () => {
                return bs.serialize(data);
            }
        );
    }
    // SERIALIZE: STRING


    // SERIALIZE: UNICODE STRING
    {

        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).string("foo", 1, true);

        // define data
        let data = {"foo": "שלום אחשלי!"};

        await runTest("Serialize unicode strings",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                return JSON.stringify(data);
            },

            // do binary
            () => {
                return bs.serialize(data);
            }
        );
    }
    // SERIALIZE: UNICODE STRING


    // SERIALIZE: BOOLEANS
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).boolean("foo").boolean("bar").boolean("foobar").boolean("bla").boolean("goo");

        // define data
        let data = {"foo": true, "bar": false, "foobar": true, "bla": true, "goo": false};

        await runTest("Serialize booleans",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                return JSON.stringify(data);
            },

            // do binary
            () => {
                return bs.serialize(data);
            }
        );
    }
    // SERIALIZE: BOOLEANS


    // SERIALIZE: UNSIGNED INTEGERS
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).byte("byte").ushort("ushort").uint("uint");

        // define data
        let data = {"byte": 255, "ushort": 65000, "uint": 4290967295};

        await runTest("Serialize byte, ushort, and uint",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                return JSON.stringify(data);
            },

            // do binary
            () => {
                return bs.serialize(data);
            }
        );
    }
    // SERIALIZE: UNSIGNED INTEGERS

    
    // SERIALIZE: INTEGERS
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).char("char").short("short").int("int");

        // define data
        let data = {"char": 125, "short": 32000, "int": 2107483647};

        await runTest("Serialize char, short, and int",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                return JSON.stringify(data);
            },

            // do binary
            () => {
                return bs.serialize(data);
            }
        );
    }
    // SERIALIZE: INTEGERS


    // SERIALIZE: INTEGERS ARRAY
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).char("char").array().short("short").array().int("int").array();

        // define data
        let data = {"char": [125, 111, 75, 127], "short": [32000, 0, 111, 1000], "int": [0, 100, 1000, 10000, 2107483647]};
        
        await runTest("Serialize arrays of numbers",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                return JSON.stringify(data);
            },

            // do binary
            () => {
                return bs.serialize(data);
            }
        );
    }
    // SERIALIZE: INTEGERS ARRAY


    // SERIALIZE: FLOATS
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).float("float");

        // define data
        let data = {"float": 12345.789};

        await runTest("Serialize floats",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                return JSON.stringify(data);
            },

            // do binary
            () => {
                return bs.serialize(data);
            }
        );
    }
    // SERIALIZE: FLOATS


    // SERIALIZE: DOUBLES
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).double("double");

        // define data
        let data = {"double": 1234531.7842141219};

        await runTest("Serialize doubles",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                return JSON.stringify(data);
            },

            // do binary
            () => {
                return bs.serialize(data);
            }
        );
    }
    // SERIALIZE: DOUBLES


    // SERIALIZE: COMPLEX TEST
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer()
            .string("foo")
            .boolean("bool1")
            .boolean("bool2")
            .string("strfield")
            .short("short")
            .child("child", 
                new BinaryBufferSerializer.BinaryBufferSerializer()
                .int("child_int")
                .boolean("child_bool")
                .float("float")
        );
        
        // define data
        let data = {
            "foo": "bar", 
            "bool1": true, 
            "bool2": false, 
            "strfield": "hello world!", 
            "short": 12345, 
            "child": {
            "child_int": 12345678,
            "child_bool": false,
            "float": 123.764
            }
        };

        await runTest("Serialize complex dict with a child",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                return JSON.stringify(data);
            },

            // do binary
            () => {
                return bs.serialize(data);
            }
        );
    }
    // SERIALIZE: COMPLEX TEST




    // --------------------------------------------------------------------------





    // DESERIALIZE: STRING
    {

        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).string("foo");

        // define data
        let data = {"foo": "Hello World!"};

        let jsonData = JSON.stringify(data);
        let binData = bs.serialize(data);
        
        await runTest("Deserialize simple string",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                JSON.parse(jsonData);
            },

            // do binary
            () => {
                bs.deserialize(binData);
            }
        );
    }
    // DESERIALIZE: STRING


    // DESERIALIZE: UNICODE STRING
    {

        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).string("foo", 1, true);

        // define data
        let data = {"foo": "שלום אחשלי!"};

        let jsonData = JSON.stringify(data);
        let binData = bs.serialize(data);
        
        await runTest("Deserialize unicode strings",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                JSON.parse(jsonData);
            },

            // do binary
            () => {
                bs.deserialize(binData);
            }
        );
    }
    // DESERIALIZE: UNICODE STRING


    // DESERIALIZE: BOOLEANS
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).boolean("foo").boolean("bar").boolean("foobar").boolean("bla").boolean("goo");

        // define data
        let data = {"foo": true, "bar": false, "foobar": true, "bla": true, "goo": false};

        let jsonData = JSON.stringify(data);
        let binData = bs.serialize(data);
        
        await runTest("Deserialize booleans",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                JSON.parse(jsonData);
            },

            // do binary
            () => {
                bs.deserialize(binData);
            }
        );
    }
    // DESERIALIZE: BOOLEANS


    // DESERIALIZE: UNSIGNED INTEGERS
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).byte("byte").ushort("ushort").uint("uint");

        // define data
        let data = {"byte": 255, "ushort": 65000, "uint": 4290967295};

        let jsonData = JSON.stringify(data);
        let binData = bs.serialize(data);
        
        await runTest("Deserialize byte, ushort, and uint",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                JSON.parse(jsonData);
            },

            // do binary
            () => {
                bs.deserialize(binData);
            }
        );
    }
    // DESERIALIZE: UNSIGNED INTEGERS


    // DESERIALIZE: INTEGERS
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).char("char").short("short").int("int");

        // define data
        let data = {"char": 125, "short": 32000, "int": 2107483647};

        let jsonData = JSON.stringify(data);
        let binData = bs.serialize(data);
        
        await runTest("Deserialize char, short, and int",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                JSON.parse(jsonData);
            },

            // do binary
            () => {
                bs.deserialize(binData);
            }
        );
    }
    // DESERIALIZE: INTEGERS


    // DESERIALIZE: INTEGERS ARRAY
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).char("char").array().short("short").array().int("int").array();

        // define data
        let data = {"char": [125, 111, 75, 127], "short": [32000, 0, 111, 1000], "int": [0, 100, 1000, 10000, 2107483647]};

        let jsonData = JSON.stringify(data);
        let binData = bs.serialize(data);
        
        await runTest("Deserialize arrays of numbers",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                JSON.parse(jsonData);
            },

            // do binary
            () => {
                bs.deserialize(binData);
            }
        );
    }
    // DESERIALIZE: INTEGERS ARRAY


    // DESERIALIZE: FLOATS
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).float("float");

        // define data
        let data = {"float": 12345.789};

        let jsonData = JSON.stringify(data);
        let binData = bs.serialize(data);

        await runTest("Deserialize floats",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                JSON.parse(jsonData);
            },

            // do binary
            () => {
                bs.deserialize(binData);
            }
        );
    }
    // DESERIALIZE: FLOATS


    // DESERIALIZE: DOUBLES
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).double("double");

        // define data
        let data = {"double": 1234531.7842141219};
        
        let jsonData = JSON.stringify(data);
        let binData = bs.serialize(data);

        await runTest("Deserialize doubles",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                JSON.parse(jsonData);
            },

            // do binary
            () => {
                bs.deserialize(binData);
            }
        );
    }
    // DESERIALIZE: DOUBLES


    // DESERIALIZE: COMPLEX TEST
    {
        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer()
            .string("foo")
            .boolean("bool1")
            .boolean("bool2")
            .string("strfield")
            .short("short")
            .child("child", 
                new BinaryBufferSerializer.BinaryBufferSerializer()
                .int("child_int")
                .boolean("child_bool")
                .float("float")
        );
        
        // define data
        let data = {
            "foo": "bar", 
            "bool1": true, 
            "bool2": false, 
            "strfield": "hello world!", 
            "short": 12345, 
            "child": {
            "child_int": 12345678,
            "child_bool": false,
            "float": 123.764
            }
        };

        let jsonData = JSON.stringify(data);
        let binData = bs.serialize(data);

        await runTest("Deserialize complex dict with a child",

            // sanity check  
            () => {
                let buff = bs.serialize(data);
                let parsed = bs.deserialize(buff);
                let assert = new Testizy.Assert();
                assert.equals(data, parsed);
            },

            // do json
            () => {
                JSON.parse(jsonData);
            },

            // do binary
            () => {
                bs.deserialize(binData);
            }
        );
    }
    // DESERIALIZE: COMPLEX TEST


    if (typeof document !== 'undefined') {
        document.getElementById("done-label").style.display = 'block';
    }

}

// start
runAllTests();