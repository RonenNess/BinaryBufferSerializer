/**
 * Serialization context object.
 * 
 * |-- copyright and license --|
 * @package    binary-buffer-serializer
 * @author     Ronen Ness (ronenness@gmail.com | http://ronenness.com)
 * @copyright  (c) 2022 Ronen Ness
 * @license    MIT
 * 
*/
'use strict';
const BinaryData = require('./binary_data');
const Buffer = require('./buffer_polyfill');
var output = new Buffer(32);
var offset = 0;

/**
 * Serialization context, hold serialization current data + result.
 */
class SerializeContext
{
    /**
     * Create the serialization context.
     * @param {*} data Input data dictionary we are serializing (the entire data).
     * @param {Boolean} keepBuffer If true, will keep the internal buffer we serialize into. Used internally when serializing children.
     */
    constructor(data, keepBuffer)
    {
        this.fieldName = null;
        this.options = null;
        this.value = null;
        this.data = data;
        if (!keepBuffer) {
            output = new Buffer(32);
            offset = 0;
        }
    }

    // getters and setters
    get output() { return output; }
    get offset() { return offset; }
    set offset(val) { offset = val; }

    /**
     * Set the context to start serializing a field.
     * @param {String} fieldName Field name.
     * @param {*} options Field options.
     * @param {*} value Current field value we serialize.
     */
    startSerializing(fieldName, options, value)
    {
        this.fieldName = fieldName;
        this.options = options;
        this.value = value;
    }

    /**
     * Enlarge buffer if needed.
     * @param extraBytes How many additional bytes we'll need.
     */
    enlargeBufferIfNeeded(extraBytes)
    {
        if (offset + extraBytes >= output.length) {
            this._doubleBufferSize(offset + extraBytes + 1);
        }
    }

    /**
     * Push a single byte to output.
     */
    pushByte(val)
    {
        this.enlargeBufferIfNeeded(1);
        offset = output.writeUInt8(val, offset);
    }

    /**
     * Push a set of bytes to output.
     */
    pushBytes(vals)
    {
        this.enlargeBufferIfNeeded(vals.length);
        for (let i = 0; i < vals.length; ++i) {
            output[offset++] = vals[i];
        }
    }

    /**
     * Double buffer size.
     */
    _doubleBufferSize(requiredLen)
    {
        let newBuffer = new Buffer(Math.max(output.length * 2, requiredLen + 32));
        output.copy(newBuffer);
        output = newBuffer;
    }

    /**
     * Get final output as binary data.
     */
    getFinalOutput()
    {
        return new BinaryData(output, offset);
    }
}


// export the serialize context object.
module.exports = SerializeContext;