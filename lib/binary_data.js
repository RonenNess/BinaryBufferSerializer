/**
 * Store the compressed binary data from serialization result.
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
 * Store the compressed binary data from serialization result.
 * Note: internal buffer may be actually larger than really is and contain padded bytes. To reduce that, use 'trim()'.
 */
class BinaryData
{
    /**
     * Create the binary data.
     * @param {Buffer} buffer Buffer with data bytes.
     * @param {Number} size Actual size in bytes.
     */
    constructor(buffer, size)
    {
        this._buffer = buffer;
        this._len = size;
    }

    /**
     * Get actual data length.
     */
    get length() 
    {
        return this._len;
    }

    /**
     * Get the internal buffer with all data.
     * Keep in mind the result buffer may contain padded bytes you need to ignore! For actual length, check out the length property.
     */
    get buffer()
    {
        return this._buffer;
    }

    /**
     * Remove all padded bytes from buffer, if exist.
     */
    trim()
    {
        if (this._len != this._buffer.length) {
            this._buffer = this._buffer.subarray(0, this._len);
        }
    }
}

// export the binary data.
module.exports = BinaryData;