/**
 * Deserialization context object.
 * 
 * |-- copyright and license --|
 * @package    binary-buffer-serializer
 * @author     Ronen Ness (ronenness@gmail.com | http://ronenness.com)
 * @copyright  (c) 2022 Ronen Ness
 * @license    MIT
 * 
*/
'use strict';


/**
 * Deserialization context, hold deserialization current data + result.
 */
class DeserializeContext
{
    /**
     * Create the serialization context.
     * @param {Buffer} source buffer we are deserializing from.
     */
    constructor(source)
    {
        this.fieldName = null;
        this.options = null;
        this.source = source;
        this.offset = 0;
        this.output = {};
    }

    /**
     * Pop a single byte from output.
     */
    popByte()
    {
        return this.source.readUInt8(this.offset++);
    }
    
    /**
     * Pop bytes from output.
     */
    popBytes(count)
    {
        let ret = this.source.slice(this.offset, this.offset + count);
        this.offset += count;
        return ret;
    }

    /**
     * Set the context to start parsing a field.
     * @param {String} fieldName Field name.
     * @param {*} options Field options.
     */
    startDeserializing(fieldName, options)
    {
        this.fieldName = fieldName;
        this.options = options;
    }
}


// export the deserialize context
module.exports = DeserializeContext;