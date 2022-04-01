/**
 * Implement the parser object, used to serialize / deserialize different types.
 * 
 * |-- copyright and license --|
 * @package    binary-buffer-serializer
 * @author     Ronen Ness (ronenness@gmail.com | http://ronenness.com)
 * @copyright  (c) 2022 Ronen Ness
 * @license    MIT
 * 
*/
'use strict';
const DeserializeContext = require("./deserialize_context");
const SerializeContext = require("./serialize_context");
const { WrongValueType } = require("./exceptions");
const UtfSerialize = require('./utf_serialize');


/**
 * Parser object to serialize / deserialize types.
 */
class Parser
{
    /**
     * Serialize a number.
     * @param {SerializeContextizeContext} context Serialization context.
     */
    serialize_number(context)
    {
        if (context.options.signed) {
            var value = context.value;
            switch (context.options.bytesCount)
            {
                case 1:
                    context.enlargeBufferIfNeeded(1);
                    context.offset = context.output.writeInt8(value, context.offset, true);
                    break;

                case 2:
                    context.enlargeBufferIfNeeded(2);
                    context.offset = context.output.writeInt16BE(value, context.offset, true);
                    break;

                case 4:
                    context.enlargeBufferIfNeeded(4);
                    context.offset = context.output.writeInt32BE(value, context.offset, true);
                    break;
            }
        }
        else { 
            var value = context.value >>> 0;
            switch (context.options.bytesCount)
            {
                case 1:
                    context.enlargeBufferIfNeeded(1);
                    context.offset = context.output.writeUInt8((value >>> 0) & 0xff, context.offset, true);
                    break;

                case 2:
                    context.enlargeBufferIfNeeded(2);
                    context.offset = context.output.writeUInt16BE((value >>> 0) & 0xffff, context.offset, true);
                    break;
            
                case 3:
                    context.enlargeBufferIfNeeded(3);
                    context.offset = context.output.writeUInt24BE((value >>> 0) & 0xffffff, context.offset, true);
                    break;

                case 4:
                    context.enlargeBufferIfNeeded(4);
                    context.offset = context.output.writeUInt32BE((value >>> 0) & 0xffffffff, context.offset, true);
                    break;
            }
        }
    }
    
    /**
     * Deserialize a number.
     * @param {DeserializeContext} context Deserialization context.
     */
    deserialize_number(context)
    {
        var value;
        if (context.options.signed) {
            switch (context.options.bytesCount)
            {
                case 1:
                    value = context.source.readInt8(context.offset);
                    context.offset++;
                    break;

                case 2:
                    value = context.source.readInt16BE(context.offset);
                    context.offset += 2;
                    break;

                case 4:
                    value = context.source.readInt32BE(context.offset);
                    context.offset += 4;
                    break;
            }
        }
        else { 
            switch (context.options.bytesCount)
            {
                case 1:
                    value = context.source.readUInt8(context.offset);
                    context.offset += 1;
                    break;

                case 2:
                    value = context.source.readUInt16BE(context.offset);
                    context.offset += 2;
                    break;

                case 3:
                    value = context.source.readUInt24BE(context.offset);
                    context.offset += 3;
                    break;   
                                        
                case 4:
                    value = context.source.readUInt32BE(context.offset);
                    context.offset += 4;
                    break;
            }
        }

        // add to result
        context.output[context.fieldName] = value;
    }

    /**
     * Serialize a float.
     * @param {SerializeContextizeContext} context Serialization context.
     */
    serialize_float(context)
    {
        context.enlargeBufferIfNeeded(4);
        context.offset = context.output.writeFloatBE(context.value, context.offset, true);
    }

    /**
     * Deserialize a number.
     * @param {DeserializeContext} context Deserialization context.
     */
    deserialize_float(context)
    {
        let value = context.source.readFloatBE(context.offset);
        context.offset += 4;
        context.output[context.fieldName] = Math.round(value * 1000) / 1000.0;
    }

    /**
     * Serialize an enum.
     * @param {SerializeContextizeContext} context Serialization context.
     */
    serialize_enum(context)
    {
        context.enlargeBufferIfNeeded(1);
        let index = context.options.valueToIndex[context.value];
        if (index === undefined) { throw new WrongValueType(`Can't find enum index for value ${context.value}`) }
        context.pushByte(index);
    }

    /**
     * Deserialize an enum.
     * @param {DeserializeContext} context Deserialization context.
     */
    deserialize_enum(context)
    {
        let index = context.popByte();
        let value = context.options.indexToValue[index];
        if (value === undefined) { throw new WrongValueType(`Can't find enum value for index ${index}`) }
        context.output[context.fieldName] = value;
    }

    /**
     * Serialize double.
     * @param {SerializeContextizeContext} context Serialization context.
     */
    serialize_double(context)
    {
        context.enlargeBufferIfNeeded(8);
        context.offset = context.output.writeDoubleBE(context.value, context.offset, true);
    }

    /**
     * Deserialize double.
     * @param {DeserializeContext} context Deserialization context.
     */
    deserialize_double(context)
    {
        let value = context.source.readDoubleBE(context.offset);
        context.offset += 8;
        context.output[context.fieldName] = value;
    }

    /**
     * Serialize a child buffer.
     * @param {SerializeContextizeContext} context Serialization context.
     */
    serialize_child(context)
    {
        let bs = context.options.bs;
        bs.serialize(context.value, true);
    }

    /**
     * Deserialize a child buffer.
     * @param {DeserializeContext} context Deserialization context.
     */
    deserialize_child(context)
    {
        let bs = context.options.bs;
        let prevOutput = context.output;
        context.output = {};
        prevOutput[context.fieldName] = bs.deserialize(context);
        context.output = prevOutput;
    }

    /**
     * Serialize time.
     * @param {SerializeContextizeContext} context Serialization context.
     */
    serialize_time(context)
    {
        if (!context.value.getTime) {
            throw new WrongValueType('Date', typeof context.value);
        }
        context.value = BigInt(context.value.getTime());
        context.options = { signed: false };
        this.serialize_bigint(context);
    }

    /**
     * Deserialize time.
     * @param {DeserializeContext} context Deserialization context.
     */
    deserialize_time(context)
    {
        context.options = { signed: false };
        this.deserialize_bigint(context);
        let asNum = Number(context.output[context.fieldName]);
        context.output[context.fieldName] = new Date(asNum);
    }

    /**
     * Serialize bigint.
     * @param {SerializeContextizeContext} context Serialization context.
     */
    serialize_bigint(context)
    {
        context.enlargeBufferIfNeeded(8);
        if (context.options.signed) {
            context.offset = context.output.writeBigInt64BE(context.value, context.offset);
        }
        else {
            context.offset = context.output.writeBigUInt64BE(context.value, context.offset);
        }
    }

    /**
     * Deserialize bigint.
     * @param {DeserializeContext} context Deserialization context.
     */
    deserialize_bigint(context)
    {
        if (context.options.signed) {
            context.output[context.fieldName] = context.source.readBigInt64BE(context.offset);
        }
        else {
            context.output[context.fieldName] = context.source.readBigUInt64BE(context.offset);
        }
        context.offset += 64;
    }

    /**
     * Serialize string.
     * @param {SerializeContextizeContext} context Serialization context.
     */
    serialize_string(context)
    {
        // string bytes
        let bytes;

        // encode string - unicode (support any character)
        if (context.options.unicode) {

            // convert to bytes
            bytes = UtfSerialize.utfToBytes(context.value); 
    
            // serialize length
            let strLen = bytes.length;
            for (let i = 0; i < context.options.lenBytes; ++i) {
                context.pushByte((strLen >> (i * 8)) & 0xff);
            }

            // serialize characters
            context.pushBytes(bytes);
        }
        // encode string - ascii only
        else {

            // serialize length
            let strLen = context.value.length;
            for (let i = 0; i < context.options.lenBytes; ++i) {
                context.pushByte((strLen >> (i * 8)) & 0xff);
            }

            // push bytes
            context.enlargeBufferIfNeeded(strLen);
            for (let i = 0; i < context.value.length; ++i) {
                context.output[context.offset++] = context.value.charCodeAt(i);
            }
        }
    }

    /**
     * Deserialize string.
     * @param {DeserializeContext} context Deserialization context.
     */
    deserialize_string(context)
    {
        // deserialize length
        let strLen = 0;
        let bytes = context.popBytes(context.options.lenBytes);
        for (let i = 0; i < bytes.length; ++i) {
            strLen |= bytes[i] << (i * 8);
        }

        // get bytes to pull
        let strBytes = context.popBytes(strLen);

        // decode string - unicode (support any character)
        if (context.options.unicode) {
            context.output[context.fieldName] = UtfSerialize.bytesToUtf(strBytes, 0, strBytes.length);
        }
        // decode string - ascii only
        else {
            let res = ''
            let i = 0
            while (i < strLen) {
              res += String.fromCharCode.apply(
                String,
                strBytes.subarray(i, i += 0x1000)
              )
            }
            context.output[context.fieldName] = res;
        }
    }
}


// export the serialize context object.
module.exports = Parser;