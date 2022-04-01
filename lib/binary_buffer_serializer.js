/**
 * Implement a binary buffer serializer.
 * 
 * |-- copyright and license --|
 * @package    binary-buffer-serializer
 * @author     Ronen Ness (ronenness@gmail.com | http://ronenness.com)
 * @copyright  (c) 2022 Ronen Ness
 * @license    MIT
 * 
*/
'use strict';
const SerializeContext = require('./serialize_context');
const Parser = require('./parser');
const DeserializeContext = require('./deserialize_context');
const { PartialNotAllowedError, MissingSerializeMethod, MissingDeserializeMethod } = require('./exceptions');
const BinaryData = require('./binary_data');


/**
 * Implement a binary buffer builder and parser.
 * Used to serialize / deserialize data quickly and efficiently into and from bytes array.
 */
class BinaryBufferSerializer
{
    /**
     * Create the Binary Buffer serializer.
     * @param {Parser} parser Parser object to use, responsible to serialize / deserialize types. If not provided will use the default built-in parser.
     */
    constructor(parser)
    {
        this._parser = parser || new Parser();
        this._fields = [];
        this._fieldsNames = new Set();
        this._booleans = new Set();
        this._lastField = null;
        this._allowPartial = BinaryBufferSerializer.defaults.allowPartial;
    }

    /**
     * Serialize data into binary buffer and return a bytes buffer.
     * @example
     *  // create a buffer serializer and serialize into a binary buffer
     *  let bs = new BinaryBufferSerializer().long('coord_x').long('coord_y').boolean('is_static').string('identifier');
     *  let buffer = bs.serialize({coord_x: 15, coord_y: 10, is_static: false, identifier: 'tank_001'});
     * @param {*} data Dictionary with data to serialize. Keys and values should match the defined serializer fields.
     * @param {Boolean} keepBuffer If true, will keep the internal buffer we serialize into. Used internally when serializing children.
     * @returns {BinaryData} Serialized data container.
     * @throws {PartialNotAllowedError} If missing a field and partial data is not allowed.
     */
    serialize(data, keepBuffer)
    {
        // create context
        let context = new SerializeContext(data, keepBuffer);

        // calculate how many bytes are required for fields mask (which fields are present in data)
        let fieldsMaskBytes = this._allowPartial ? Math.ceil(this._fields.length / 8) : 0;

        // reserve bytes for field flags
        let reservedOffset = context.offset;
        context.enlargeBufferIfNeeded(fieldsMaskBytes);
        context.offset += fieldsMaskBytes;

        // fields mask curr byte and bit index
        let fieldsMaskCurrByte = 0;
        let fieldsMaskBitIndex = 0;

        // serialize fields
        let booleansInData = [];
        for (let fieldIndex = 0; fieldIndex < this._fields.length; fieldIndex++)
        {
            // check if got a valid value
            let field = this._fields[fieldIndex];
            let gotValue = data[field.name] !== undefined;

            // allow partial data? build fields mask
            if (this._allowPartial) 
            {
                if (gotValue) {
                    fieldsMaskCurrByte |= (1 << fieldsMaskBitIndex);
                }
                fieldsMaskBitIndex++;
                if (fieldsMaskBitIndex >= 8 || (fieldIndex === this._fields.length - 1)) {
                    context.output[reservedOffset++] = fieldsMaskCurrByte;
                    fieldsMaskCurrByte = 0;
                    fieldsMaskBitIndex = 0;
                }
            }
            // don't allow partial and have missing field? exception
            else if (!gotValue) {
                throw new PartialNotAllowedError(field.name);
            }

            // if its a boolean, skip it. we put all booleans in the end
            if (field.type === 'boolean') { 
                booleansInData.push(field.name);
                continue; 
            }

            // if got here but don't have value we need to skip
            if (!gotValue) continue;

            // set context to current field
            let value = data[field.name];
            if (field.preSerialize) { 
                value = field.preSerialize(value); 
            }
            context.startSerializing(field.name, field.data, value);

            // get serialization method
            let method = this._parser['serialize_' + field.type];
            if (!method) { throw new MissingSerializeMethod(field.type); }

            // serialize value as array
            if (field.asArray && field.asArray.arrayLenBytes) {
                let len = value.length;
                for (let i = 0; i < field.asArray.arrayLenBytes; ++i) {
                    context.pushByte((len >> (i * 8)) & 0xff);
                }
                for (let i = 0; i < len; ++i) {
                    context.value = value[i];
                    method.call(this._parser, context);
                }
            }
            // serialize single data
            else {
                method.call(this._parser, context);
            }
        }

        // serialize booleans
        let currByte = 0;
        let currIndex = 0;
        for (let booleanFieldName of booleansInData) {
            
            // get current value and check if set
            let val = data[booleanFieldName];
            
            // if true, set bit
            if (val) {
                currByte |= (1 << currIndex);
            }

            // update bit index and if finished current byte write it.
            currIndex++;
            if (currIndex >= 8) {
                context.pushByte(currByte);
                currByte = 0;
                currIndex = 0;
            }
        
        }

        // push last boolean
        if (currIndex > 0) {
            context.pushByte(currByte);
        }

        // return result
        return context.getFinalOutput();
    }

    /**
     * Deserialize data from a binary buffer and return a dictionary with field values.
     * @example
     *  // create a buffer serializer and deserialize a data buffer with it
     *  let bs = new BinaryBufferSerializer().long('coord_x').long('coord_y').boolean('is_static').string('identifier');
     *  let data = bs.deserialize(bufferToParse);
     * @param {BinaryData|Uint8Array|DeserializeContext} data Serialized data container to parse, as returned from a 'serialize' call. Can also be deserialization context.
     * @returns {*} Dictionary with deserialized data.
     */
    deserialize(data)
    {
        // get data from result
        if (data instanceof BinaryData) { data = data.buffer; }

        // build deserialize context
        let context = (data instanceof DeserializeContext) ? data : new DeserializeContext(data);

        // if allow partial data, read field bits (tells us which fields are included in data)
        let fieldsBits = 0;
        if (this._allowPartial) {
            let requiredBytes = Math.ceil(this._fields.length / 8);
            for (let i = 0; i < requiredBytes; ++i) {
                fieldsBits |= context.popByte() << (i * 8);
            }
        }

        // set of boolean fields that appear in data
        let booleansInData = [];

        // deserialize fields
        let index = 0;
        for (let field of this._fields)
        {
            // if partial, check if the field is included
            if (this._allowPartial && ((fieldsBits & (1 << index)) === 0)) {
                index++;
                continue;
            }
            index++;

            // if boolean, add to booleans set and skip because all booleans are deserialized in the end
            if (field.type === 'boolean') {
                booleansInData.push(field.name);
                continue;
            }

            // set context to current field
            context.startDeserializing(field.name, field.data);

            // get deserialization method
            let method = this._parser['deserialize_' + field.type];
            if (!method) { throw new MissingDeserializeMethod(field.type); }

            // deserialize value as array
            if (field.asArray && field.asArray.arrayLenBytes) {
                let len = 0;
                for (let i = 0; i < field.asArray.arrayLenBytes; ++i) {
                    len |= context.popByte() << (i * 8);
                }
                let arr = [];
                for (let i = 0; i < len; ++i) {
                    method.call(this._parser, context);
                    arr.push(context.output[field.name]);
                }
                context.output[field.name] = arr;
            }
            // deserialize single value
            else {
                method.call(this._parser, context);
            }


            // run post deserialization method
            if (field.postDeserialize) { 
                context.output[field.name] = field.postDeserialize(context.output[field.name]); 
            }
        }

        // deserialize booleans
        let bitIndex = 0;
        let currByte = null;
        for (let booleanFieldName of booleansInData) {
            
            // get new byte
            if (currByte === null) { 
                currByte = context.popByte(); 
            }

            // extract current value and advance bit index
            context.output[booleanFieldName] = (currByte & 1) !== 0;
            currByte >>= 1;
            bitIndex++;

            // check if need to take next byte
            if (bitIndex >= 8) {
                currByte = null;
                bitIndex = 0;
            }
        
        }

        // return deserialized data
        return context.output;
    }

    /**
     * Add a field to the serializer.
     * Note: only use this method for special custom types that you add to the parser.
     * For built-in types, use the designated methods.
     * @param {String} name Field name.
     * @param {String} type Type identifier, must be implemented in the parser instance.
     * @param {*} data Optional additional data.
     */
    addField(name, type, data)
    {
        // sanity checks
        if (!name || !type) {
            throw new Error(`Invalid field name or type!`);
        }
        if (this._fieldsNames.has(name)) {
            throw new Error(`Field named '${name}' is already defined!`);
        }

        // add field
        this._lastField = {name: name, type: type, data: data};
        this._fields.push(this._lastField);
        this._fieldsNames.add(name);
        return this;
    }

    /**
     * Set if this serializer allow partial data, ie serializing data without all keys.
     * @param {Boolean} allow Should we allow partial data or not.
     */
    allowPartial(allow)
    {
        this._lastField = null;
        this._allowPartial = allow;
        return this;
    }

    /**
     * Add a custom processing method to run before serializing this field.
     * @example
     *  // define a long field that we round before serialization into buffer
     *  bs.long('round_long_field').preSerialize(Math.round);
     * @param {Function} handler Handler method to run on data before serializing it.
     */
    preSerialize(handler)
    {
        if (!this._lastField) { throw new Error("Must declare a field first."); }
        this._lastField.preSerialize = handler;
        return this;
    }

    /**
     * Add a custom processing method to run after deserializing this field.
     * @example
     *  // define a long field that we round after deserialization from buffer
     *  bs.long('round_long_field').postDeserialize(Math.round);
     * @param {Function} handler Handler method to run on data after deserializing it.
     */
    postDeserialize(handler)
    {
        if (!this._lastField) { throw new Error("Must declare a field first."); }
        this._lastField.postDeserialize = handler;
        return this;
    }

    /**
     * Turn the last defined field into an array.
     * @example
     *  // define an array of short numbers named 'shorts_array_name'.
     *  bs.short('shorts_array_name').array();
     * @param {Number} arrayLenBytes How many bytes to use to store array size. Defaults to 1, meaning max array length is 255 items.
     */
    array(arrayLenBytes)
    {
        if (!this._lastField) { throw new Error("Must declare a field first."); }
        this._lastField.asArray = { arrayLenBytes: arrayLenBytes || 1 };
        return this;
    }

    /**
     * Define a number field with changing number of bytes.
     * @example
     *  // define a signed number in the size of 3 bytes (24 bits).
     *  bs.short('field_name', 3, true);
     * @param {String} name Field name.
     * @param {Number} bytesCount How many bytes to use for this number (defaults to 4).
     * @param {Boolean} signed If true, will be a signed number (default). If false, will be unsigned positive only field.
     */
    number(name, bytesCount, signed)
    {
        if (bytesCount > 4) { throw new Error("Can't define number field with more than 4 bytes. For big numbers please use 'bigint'."); }
        if (signed === undefined) { signed = true; }
        if (bytesCount === undefined) { bytesCount = 4; }
        this.addField(name, 'number', {bytesCount: bytesCount, signed: signed});
        return this;
    }

    /**
     * Define an enum field. This field is very efficient as it only takes 1 byte.
     * @example
     *  // define an enum with log levels
     *  bs.enum('log_level', ['debug', 'info', 'warn', 'error']);
     * @param {String} name Field name.
     * @param {Array<String>} options Enum options (max length = 255 strings).
     */
    enum(name, options)
    {
        if (options.length > 255) { throw new Error("Can't have more than 255 options for an enum field!"); }
        let valueToIndex = {};
        let indexToValue = options.slice(0);
        for (let i = 0; i < options.length; ++i) {
            valueToIndex[options[i]] = i;
        }
        this.addField(name, 'enum', {valueToIndex: valueToIndex, indexToValue: indexToValue});
        return this;
    }
    
    /**
     * Define an unsigned byte field (1 byte, positive only).
     * @example
     *  // define an unsigned byte field.
     *  bs.byte('field_name');
     * @param {String} name Field name.
     */
    byte(name)
    {
        this.number(name, 1, false);
        return this;
    }
    
    /**
     * Define a signed byte field (1 byte, signed).
     * @example
     *  // define a signed byte field.
     *  bs.char('field_name');
     * @param {String} name Field name.
     */
    char(name)
    {
        this.number(name, 1, true);
        return this;
    }

    /**
     * Define an unsigned short field (2 bytes, positive only).
     * @example
     *  // define an unsigned short field.
     *  bs.ushort('field_name');
     * @param {String} name Field name.
     */
    ushort(name)
    {
        this.number(name, 2, false);
        return this;
    }
    
    /**
     * Define a signed short field (2 bytes, signed).
     * @example
     *  // define a signed short field.
     *  bs.short('field_name');
     * @param {String} name Field name.
     */
    short(name)
    {
        this.number(name, 2, true);
        return this;
    }

    /**
     * Define an unsigned medium int field (3 bytes, positive only).
     * @example
     *  // define a unsigned int field.
     *  bs.umint('field_name');
     * @param {String} name Field name.
     */
    umint(name)
    {
        this.number(name, 3, false);
        return this;
    }

    /**
     * Define an unsigned int field (4 bytes, positive only).
     * @example
     *  // define a unsigned int field.
     *  bs.uint('field_name');
     * @param {String} name Field name.
     */
    uint(name)
    {
        this.number(name, 4, false);
        return this;
    }
    
    /**
     * Define a signed int field (4 bytes, signed).
     * @example
     *  // define a signed int field.
     *  bs.int('field_name');
     * @param {String} name Field name.
     */
    int(name)
    {
        this.number(name, 4, true);
        return this;
    }

    /**
     * Define an unsigned bigint field (8 bytes, unsigned).
     * @example
     *  // define an unsigned big int field.
     *  bs.ubigint('field_name');
     * @param {String} name Field name.
     */
    ubigint(name)
    {
        this.addField(name, 'bigint', {signed: false});
        return this;
    }
    
    /**
     * Define a signed bigint field (8 bytes, signed).
     * @example
     *  // define a big int field.
     *  bs.bigint('field_name');
     * @param {String} name Field name.
     */
    bigint(name)
    {
        this.addField(name, 'bigint', {signed: true});
        return this;
    }
            
    /**
     * Define a float field (4 bytes, signed, with 3 digits after decimal point).
     * @example
     *  // define a float field.
     *  bs.float('field_name');
     * @param {String} name Field name.
     */
    float(name)
    {
        this.addField(name, 'float');
        return this;
    }
            
    /**
     * Define a double field (signed with more accurate decimal point. varying in size.).
     * @example
     *  // define a double field.
     *  bs.double('field_name');
     * @param {String} name Field name.
     */
    double(name)
    {
        this.addField(name, 'double');
        return this;
    }
    
    /**
     * Define a boolean field.
     * All booleans are compressed together into a bitmap, meaning any additional boolean can either add a byte to the
     * total binary size (if additional byte is required) or stay the same size if we still have available bits.
     * @example
     *  // define a boolean (1 bit) field.
     *  bs.boolean('field_name');
     * @param {String} name Field name.
     */
    boolean(name)
    {
        this.addField(name, 'boolean');
        this._booleans.add(name);
        return this;
    }

    /**
     * Define a string field with varying number of bytes for length.
     * @example
     *  // define a string field that uses 2 bytes to store length.
     *  bs.string('field_name', 2);
     * @param {String} name Field name.
     * @param {Number} lenBytes How many bytes to use to store the string's len (default to 2).
     * @param {Boolean} encodeUtf8 If true, will encode string as utf8 (required for non-ascii strings). This method is a lot slower, so only use if you need characters outside the ascii table.
     */
    string(name, lenBytes, encodeUtf8)
    {
        if (lenBytes === undefined) { lenBytes = 1; }
        if (lenBytes > 4) { throw new Error("String length cannot be move than 4 bytes."); }
        this.addField(name, 'string', {lenBytes: lenBytes, unicode: Boolean(encodeUtf8)});
        return this;
    }

    /**
     * Define a Date field.
     * @example
     *  // define a date field, uses 8 bytes to store timestamp
     *  bs.time('field_name');
     * @param {String} name Field name.
     */
    time(name)
    {
        this.addField(name, 'time');
        return this;
    }

    /**
     * Define a child binary serializer field type.
     * @example
     *  // define a child serializer field.
     *  bs.child('field_name', otherBs);
     * @param {String} name Field name.
     * @param {BinaryBufferSerializer} binarySerializer Binary serializer to use as child.
     */
    child(name, binarySerializer)
    {
        this.addField(name, 'child', {bs: binarySerializer});
        return this;
    }
}


// default values to all new serializers
BinaryBufferSerializer.defaults = {
    allowPartial: false,
}


// export the binary buffer serializer object.
module.exports = BinaryBufferSerializer;