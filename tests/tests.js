// for nodejs tests
if (typeof window === 'undefined') {
    var BinaryBufferSerializer = require('../dist/binary-buffer-serializer.js');
    var Testizy = require('./testizy');
}

// init testizy
let testizy = new Testizy();

// Serialize numbers
testizy.suite('Serialize Numbers', (suite) => {

    // test a numberic value
    function testNumber(assert, bs, minVal, maxVal, wrapTests, expectedLen)
    {
        // test with value 0
        {
            let buff = bs.serialize({test: 0});
            let result = bs.deserialize(buff);
            assert.equals({test: 0}, result);
            assert.equals(expectedLen, buff.length);
        }

        // test with value 115
        {
            let buff = bs.serialize({test: 115});
            let result = bs.deserialize(buff);
            assert.equals({test: 115}, result);
            assert.equals(expectedLen, buff.length);
        }

        // test with max value
        {
            let buff = bs.serialize({test: maxVal});
            let result = bs.deserialize(buff);
            assert.equals({test: maxVal}, result);
            assert.equals(expectedLen, buff.length);
        }

        // test with min value
        {
            let buff = bs.serialize({test: minVal});
            let result = bs.deserialize(buff);
            assert.equals({test: minVal}, result);
            assert.equals(expectedLen, buff.length);
        }

        // test with half max value
        {
            let val = Math.round(maxVal / 2);
            let buff = bs.serialize({test: val});
            let result = bs.deserialize(buff);
            assert.equals({test: val}, result);
            assert.equals(expectedLen, buff.length);
        }

        // test with 25% max value
        {
            let val = Math.round(maxVal / 4);
            let buff = bs.serialize({test: val});
            let result = bs.deserialize(buff);
            assert.equals({test: val}, result);
            assert.equals(expectedLen, buff.length);
        }

        // test with 75% max value
        {
            let val = Math.round(maxVal / 4) * 3;
            let buff = bs.serialize({test: val});
            let result = bs.deserialize(buff);
            assert.equals({test: val}, result);
            assert.equals(expectedLen, buff.length);
        }

        // test with half min value
        if (minVal < 0) {
            let val = Math.round(minVal / 2);
            let buff = bs.serialize({test: val});
            let result = bs.deserialize(buff);
            assert.equals({test: val}, result);
            assert.equals(expectedLen, buff.length);
        }

        // do wrap tests
        if (wrapTests) 
        {
            // test with wrap from min
            {
                let buff = bs.serialize({test: minVal - 1});
                let result = bs.deserialize(buff);
                assert.equals({test: maxVal}, result);
                assert.equals(expectedLen, buff.length);
            }

            // test with wrap from max
            {
                let buff = bs.serialize({test: maxVal + 1});
                let result = bs.deserialize(buff);
                assert.equals({test: minVal}, result);
                assert.equals(expectedLen, buff.length);
            }
        }
    }


    suite.case('byte', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().byte('test');
        testNumber(assert, bs, 0, 255, true, 2);
    });


    suite.case('char', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().char('test');
        testNumber(assert, bs, -128, 127, true, 2);
    });


    suite.case('ushort', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().ushort('test');
        testNumber(assert, bs, 0, 65535, true, 3);
    });

    suite.case('short', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().short('test');
        testNumber(assert, bs, -32768, 32767, true, 3);
    });


    suite.case('umint', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().umint('test');
        testNumber(assert, bs, 0, 16777215, true, 4);
    });

    suite.case('uint', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().uint('test');
        testNumber(assert, bs, 0, 4294967295, true, 5);
    });

    suite.case('int', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().int('test');
        testNumber(assert, bs, -2147483648, 2147483647, true, 5);
    });
    

    suite.case('bigint', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().bigint('test');
        {
            let buff = bs.serialize({test: 115n});
            let result = bs.deserialize(buff);
            assert.equals(9, buff.length);
            assert.equals({test: 115n}, result);
        }
        {
            let buff = bs.serialize({test: -547547574757475115n});
            let result = bs.deserialize(buff);
            assert.equals(9, buff.length);
            assert.equals({test: -547547574757475115n}, result);
        }
        {
            let buff = bs.serialize({test: 547547574757475115n});
            let result = bs.deserialize(buff);
            assert.equals(9, buff.length);
            assert.equals({test: 547547574757475115n}, result);
        }
    });
    

    suite.case('ubigint', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().ubigint('test');
        {
            let buff = bs.serialize({test: 115n});
            let result = bs.deserialize(buff);
            assert.equals(9, buff.length);
            assert.equals({test: 115n}, result);
        }
        {
            let buff = bs.serialize({test: 7574757475115n});
            let result = bs.deserialize(buff);
            assert.equals(9, buff.length);
            assert.equals({test: 7574757475115n}, result);
        }
        {
            let buff = bs.serialize({test: 547547574757475115n});
            let result = bs.deserialize(buff);
            assert.equals(9, buff.length);
            assert.equals({test: 547547574757475115n}, result);
        }
    });
    

    suite.case('float', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().float('test');
        let values = [0, 12.345, -7531.123, 5.979, 6.512, 7.412, 0.731, 9.671, Math.round(Math.PI * 1000) / 1000.0, 0.001, 1000.0, -1000, -0.005];
        for (let value of values)
        {
            {
                let buff = bs.serialize({test: value});
                let result = bs.deserialize(buff);
                assert.equals(1 + 4, buff.length);
                assert.equals({test: value}, result);
            }
        }
    });


    suite.case('double', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().double('test');
        let values = [0, 12.3453215, -7531.1274574523, 5.9794245, 6.5532112, 7.4125252, 0.7331191, 9.64171, Math.round(Math.PI * 1000000) / 1000000.0, 0.00001, 1000.00, -1000, -0.000051];
        for (let value of values)
        {
            {
                let buff = bs.serialize({test: value});
                let result = bs.deserialize(buff);
                assert.equals(9, buff.length);
                assert.equals({test: value}, result);
            }
        }
    });


}, {description: "Test numbers serialization."});


// Serialize time
testizy.suite('Serialize Time', (suite) => {

    suite.case('time', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().time('test');
        {
            let curr = new Date();
            let buff = bs.serialize({test: curr});
            let result = bs.deserialize(buff);
            assert.equals(9, buff.length);
            assert.equals({test: curr}, result);
        }
        {
            let curr = new Date(0);
            let buff = bs.serialize({test: curr});
            let result = bs.deserialize(buff);
            assert.equals(9, buff.length);
            assert.equals({test: curr}, result);
        }
    });

}, {description: "Test time serialization."});


// Serialize strings
testizy.suite('Serialize Strings', (suite) => {

    suite.case('special characters', (assert) => {
        {
            let text = "שלום עולם!";
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 1, true);
            let buff = bs.serialize({test: text});
            let result = bs.deserialize(buff);
            assert.equals({test: text}, result);
        }
    });

    suite.case('default string', (assert) => {
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test');
            let buff = bs.serialize({test: "hello world!"});
            let result = bs.deserialize(buff);
            assert.equals(1 + "hello world!".length + 1 , buff.length);
            assert.equals({test: "hello world!"}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test');
            let str = new Array(255 + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 1, buff.length);
            assert.equals({test: str}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', true);
            let str = new Array(255 + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 1, buff.length);
            assert.equals({test: str}, result);
        }
    });

    suite.case('tiny string', (assert) => {
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 1);
            let buff = bs.serialize({test: "hello world!"});
            let result = bs.deserialize(buff);
            assert.equals(1 + "hello world!".length + 1, buff.length);
            assert.equals({test: "hello world!"}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 1);
            let str = new Array(255 + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 1, buff.length);
            assert.equals({test: str}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 1, true);
            let str = new Array(255 + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 1, buff.length);
            assert.equals({test: str}, result);
        }
    });

    suite.case('short string', (assert) => {
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 2);
            let buff = bs.serialize({test: "hello world!"});
            let result = bs.deserialize(buff);
            assert.equals(1 + "hello world!".length + 2, buff.length);
            assert.equals({test: "hello world!"}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 2);
            let str = new Array(0xffff + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 2, buff.length);
            assert.equals({test: str}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 2, true);
            let str = new Array(0xffff + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 2, buff.length);
            assert.equals({test: str}, result);
        }
    });

    suite.case('medium string', (assert) => {
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 3);
            let buff = bs.serialize({test: "hello world!"});
            let result = bs.deserialize(buff);
            assert.equals(1 + "hello world!".length + 3, buff.length);
            assert.equals({test: "hello world!"}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 3);
            let str = new Array(0xffffff + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 3, buff.length);
            assert.equals({test: str}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 3, true);
            let str = new Array(0xffffff + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 3, buff.length);
            assert.equals({test: str}, result);
        }
    });

    suite.case('big string', (assert) => {
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 4);
            let buff = bs.serialize({test: "hello world!"});
            let result = bs.deserialize(buff);
            assert.equals(1 + "hello world!".length + 4, buff.length);
            assert.equals({test: "hello world!"}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 4);
            let str = new Array(0xffffff * 2 + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 4, buff.length);
            assert.equals({test: str}, result);
        }
        {
            let bs = new BinaryBufferSerializer.BinaryBufferSerializer().string('test', 4, true);
            let str = new Array(0xffffff * 2 + 1).join( 'a' );
            let buff = bs.serialize({test: str});
            let result = bs.deserialize(buff);
            assert.equals(1 + str.length + 4, buff.length);
            assert.equals({test: str}, result);
        }
    });

}, {description: "Test string serialization."});


// Serialize booleans
testizy.suite('Serialize Booleans', (suite) => {

    suite.case('single boolean', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().boolean('test');
        {
            let buff = bs.serialize({test: true});
            let result = bs.deserialize(buff);
            assert.equals(2, buff.length);
            assert.equals({test: true}, result);
        }
        {
            let buff = bs.serialize({test: false});
            let result = bs.deserialize(buff);
            assert.equals(1 + 1, buff.length);
            assert.equals({test: false}, result);
        }
    });

    suite.case('8 booleans (1 bytes)', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer();
        let data = {};
        for (let i = 1; i <= 8; ++i) {
            bs.boolean('test' + i)
            data['test' + i] = Math.random() < 0.5 ? true : false;
        }
        {
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(1 + 1, buff.length);
            assert.equals(data, result);
        }
    });

    suite.case('9 booleans (2 bytes)', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer();
        let data = {};
        for (let i = 1; i <= 9; ++i) {
            bs.boolean('test' + i)
            data['test' + i] = Math.random() < 0.5 ? true : false;
        }
        {
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(2 + 2, buff.length);
            assert.equals(data, result);
        }
    });

    suite.case('16 booleans (2 bytes)', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer();
        let data = {};
        for (let i = 1; i <= 16; ++i) {
            bs.boolean('test' + i)
            data['test' + i] = Math.random() < 0.5 ? true : false;
        }
        {
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(2 + 2, buff.length);
            assert.equals(data, result);
        }
    });

    suite.case('17 booleans (3 bytes)', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer();
        let data = {};
        for (let i = 1; i <= 17; ++i) {
            bs.boolean('test' + i)
            data['test' + i] = Math.random() < 0.5 ? true : false;
        }
        {
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(3 + 3, buff.length);
            assert.equals(data, result);
        }
    });

    suite.case('32 booleans (3 bytes)', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer();
        let data = {};
        for (let i = 1; i <= 32; ++i) {
            bs.boolean('test' + i)
            data['test' + i] = Math.random() < 0.5 ? true : false;
        }
        {
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(4 + 4, buff.length);
            assert.equals(data, result);
        }
    });

}, {description: "Test booleans serialization."});


// Serialize child buffers
testizy.suite('Serialize Child Buffers', (suite) => {

    suite.case('single child', (assert) => {
        let cbs = new BinaryBufferSerializer.BinaryBufferSerializer().string('str').byte('num');
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().child('child', cbs).boolean('test');
        {
            let data = {test: true, child: {str: 'hello', num: 123}};
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(10, buff.length);
            assert.equals(data, result);
        }
    });

    suite.case('multiple children', (assert) => {
        let cbs1 = new BinaryBufferSerializer.BinaryBufferSerializer().string('str').byte('num');
        let cbs2 = new BinaryBufferSerializer.BinaryBufferSerializer().boolean('bl').float('fl');
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().child('child', cbs1).child('child2', cbs2).boolean('test');
        {
            let data = {test: true, child: {str: 'hello', num: 123}, child2: {bl: false, fl: 123.456}};
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(16, buff.length);
            assert.equals(data, result);
        }
    });

    suite.case('deep children', (assert) => {
        let cbs1 = new BinaryBufferSerializer.BinaryBufferSerializer().string('str').byte('num');
        let cbs2 = new BinaryBufferSerializer.BinaryBufferSerializer().boolean('bl').float('fl').child('child', cbs1);
        let cbs3 = new BinaryBufferSerializer.BinaryBufferSerializer().child('child', cbs2);
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().child('child3', cbs3).string('foo');
        {
            let data = {foo: 'hello', child3: {child: {bl: false, fl: 123.456, child: {str: 'hello', num: 123}}}};
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(22, buff.length);
            assert.equals(data, result);
        }
    });

}, {description: "Test children serialization."});



// Serialize selected set of forms
testizy.suite('Random Data Examples', (suite) => {

    suite.case('case 1', (assert) => {

        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer()
        .string("foo")
        .boolean("bool1")
        .boolean("bool2")
        .string("strfield")
        .string("strarray").array()
        .short("short")
        .child("child", 
            new BinaryBufferSerializer.BinaryBufferSerializer()
            .int("child_int")
            .boolean("child_bool")
            .float("float")
        );

        for (let i = 0; i < 1000; ++i) {
            
            // create data
            let data = {
                "foo": "bar", 
                "bool1": Math.random() < 0.5, 
                "bool2": Math.random() < 0.5, 
                "strfield": "hello world!", 
                "strarray": ['aaa' + Math.round(Math.random() * 1000).toString(), 'bbb' + Math.round(Math.random() * 1000).toString()],
                "short": Math.round(Math.random() * 0xffff / 2), 
                "child": {
                    "child_int": Math.round(Math.random() * 0xffffffff / 2),
                    "child_bool": Math.random() < 0.5,
                    "float": 123.456, 
                }
            };

            // serialize and make sure data is correct
            let buff = bs.serialize(data);
            let parsed = bs.deserialize(buff);
            assert.equals(data, parsed);
        }
    });


    suite.case('case 2', (assert) => {

        // define serializer
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer()
        .string("string_field")
        .boolean("some_bool")
        .child("child", 
            new BinaryBufferSerializer.BinaryBufferSerializer()
                .int("child_int")
                .boolean("child_bool")
        );

        for (let i = 0; i < 1000; ++i) {
            
            // create data
            let data = {
                string_field: "hello world!",
                some_bool: Math.random() < 0.5,
                child: {
                    child_int: Math.round(Math.random() * 10000),
                    child_bool: Math.random() < 0.5
                }
            };

            // serialize and make sure data is correct
            let buff = bs.serialize(data);
            let parsed = bs.deserialize(buff);
            assert.equals(data, parsed);
        }
    });


}, {description: "Test random data with selected buffers."});


// Serialize preSerialize
testizy.suite('Serialize PreSerialize', (suite) => {

    suite.case('pre serialize', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().int('test').preSerialize(Math.abs);
        {
            let buff = bs.serialize({test: -100});
            let result = bs.deserialize(buff);
            assert.equals(5, buff.length);
            assert.equals({test: 100}, result);
        }
    });

}, {description: "Test preSerialize callback."});


// Deserialize postDeserialize
testizy.suite('Deserialize PostDeserialize', (suite) => {

    suite.case('post deserialize', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().int('test').postDeserialize(Math.abs);
        {
            let buff = bs.serialize({test: -100});
            let result = bs.deserialize(buff);
            assert.equals(5, buff.length);
            assert.equals({test: 100}, result);
        }
    });

}, {description: "Test postDeserialize callback."});


// Arrays
testizy.suite('Arrays', (suite) => {

    suite.case('numbers array', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).char("char").array().short("short").array().int("int").array();
        {
            let data = {"char": [125, 111, 75, 127], "short": [32000, 0, 111, 1000], "int": [0, 100, 1000, 10000, 2107483647]};
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(35, buff.length);
            assert.equals(data, result);
        }
    });

    suite.case('strings array', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).string("str").array();
        {
            let data = {"str": ["hello", "world", "!"]};
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(15, buff.length);
            assert.equals(data, result);
        }
    });

}, {description: "Test array types."});


// Enums
testizy.suite('Enums', (suite) => {

    suite.case('simple enum', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).enum("enum", ['one', 'two', 'three']);
        {
            let data = {"enum": 'one'};
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(1, buff.length);
            assert.equals(data, result);
        }
    });

    suite.case('wrong enum value (exception', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).enum("enum", ['one', 'two', 'three']);
        {
            let data = {"enum": 'one1'};
            assert.except(() => { bs.serialize(data) }, BinaryBufferSerializer.WrongValueType);
        }
    });

}, {description: "Test enum types."});


// Partial Data
testizy.suite('Partial Data', (suite) => {

    suite.case('missing fields without partial allowed (exception)', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(false).char("char").short("short").int("int");
        {
            let data = {"char": 125, "short": 300, "int": 1555};
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(data, result);
        }
        {
            let data = {"char": 125, "int": 1555};
            assert.except(() => { bs.serialize(data) }, BinaryBufferSerializer.PartialNotAllowedError);
        }
    });

    suite.case('missing fields with partial allowed = true (ok)', (assert) => {
        let bs = new BinaryBufferSerializer.BinaryBufferSerializer().allowPartial(true).char("char").short("short").int("int");
        {
            let data = {"char": 125, "short": 300, "int": 1555};
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(data, result);
        }
        {
            let data = {"char": 125, "int": 1555};
            let buff = bs.serialize(data);
            let result = bs.deserialize(buff);
            assert.equals(data, result);
        }
    });

}, {description: "Test partial data."});


// allow partial data by default
BinaryBufferSerializer.BinaryBufferSerializer.defaults.allowPartial = true;

setTimeout(function() {

    // run all tests and render them in browser
    if (typeof document !== 'undefined') {
        testizy.injectDefaultCss();
        testizy.run(null, testizy.renderTest);
    }
    // run all tests in nodejs
    else {
        let runTests = async () => {
            let results = await testizy.run();
            console.log ("------------------------------------------------------");
            console.log ("FINISHED RUNNING TESTS! HERE ARE THE RESULTS..");
            console.log ("Note: to disable all output above set logger to null");
            console.log ("------------------------------------------------------");
            testizy.logAllTests(results, true, console);
        }
        runTests();
    }

}, 100);