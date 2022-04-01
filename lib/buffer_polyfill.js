/**
 * Provide a node-like buffer object for browsers, using the built file from package https://github.com/feross/buffer.
 * 
 * |-- copyright and license --|
 * @package    binary-buffer-serializer
 * @author     Ronen Ness (ronenness@gmail.com | http://ronenness.com)
 * @copyright  (c) 2022 Ronen Ness
 * @license    MIT
 * 
*/
'use strict';

// get buffer either from nodejs module, or the browser version
var buffer;
try {
    buffer = require('buffer').Buffer;
}
catch (e) {
    buffer = require('../external/buffer/index').Buffer;
}

// make sure we got buffer
if (!buffer) {
    throw new Error("Failed to require buffer!");
}

function checkInt (buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
}
function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

// extend buffer - read 3 bytes uint
if (!Buffer.prototype.readUint24BE) {
    Buffer.prototype.readUint24BE =
    Buffer.prototype.readUInt24BE = function readUint24BE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 3, this.length)
        return ((this[offset] << 16) | (this[offset + 1] << 8) | (this[offset + 2]))
    }
}

// extend buffer - write 3 bytes int
if (!Buffer.prototype.writeUint24BE) {
    Buffer.prototype.writeUint24BE =
    Buffer.prototype.writeUInt24BE = function writeUInt24BE (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 3, 0xffffff, 0)
        this[offset] = (value >>> 16) & 0xff
        this[offset + 1] = (value >>> 8) & 0xff
        this[offset + 2] = (value & 0xff)
        return offset + 3
    }
}

// extend buffer - write 64 bit uint
if (!Buffer.prototype.writeBigUInt64BE && typeof BigInt !== 'undefined') {
    function wrtBigUInt64BE (buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7)

        let lo = Number(value & BigInt(0xffffffff))
        buf[offset + 7] = lo
        lo = lo >> 8
        buf[offset + 6] = lo
        lo = lo >> 8
        buf[offset + 5] = lo
        lo = lo >> 8
        buf[offset + 4] = lo
        let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
        buf[offset + 3] = hi
        hi = hi >> 8
        buf[offset + 2] = hi
        hi = hi >> 8
        buf[offset + 1] = hi
        hi = hi >> 8
        buf[offset] = hi
        return offset + 8
    }

    Buffer.prototype.writeBigUInt64BE = function writeBigUInt64BE (value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
    }

    Buffer.prototype.writeBigInt64BE = function writeBigInt64BE (value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
    }

    Buffer.prototype.readBigInt64BE = function readBigInt64BE (offset) {
        offset = offset >>> 0
        validateNumber(offset, 'offset')
        const first = this[offset]
        const last = this[offset + 7]
        if (first === undefined || last === undefined) {
          boundsError(offset, this.length - 8)
        }
      
        const val = (first << 24) + // Overflow
          this[++offset] * 2 ** 16 +
          this[++offset] * 2 ** 8 +
          this[++offset]
      
        return (BigInt(val) << BigInt(32)) +
          BigInt(this[++offset] * 2 ** 24 +
          this[++offset] * 2 ** 16 +
          this[++offset] * 2 ** 8 +
          last)
    }

    Buffer.prototype.readBigUInt64BE = function readBigUInt64BE (offset) {
        offset = offset >>> 0
        validateNumber(offset, 'offset')
        const first = this[offset]
        const last = this[offset + 7]
        if (first === undefined || last === undefined) {
          boundsError(offset, this.length - 8)
        }
      
        const hi = first * 2 ** 24 +
          this[++offset] * 2 ** 16 +
          this[++offset] * 2 ** 8 +
          this[++offset]
      
        const lo = this[++offset] * 2 ** 24 +
          this[++offset] * 2 ** 16 +
          this[++offset] * 2 ** 8 +
          last
      
        return (BigInt(hi) << BigInt(32)) + BigInt(lo)
    }

    function validateNumber (value, name) {
        if (typeof value !== 'number') {
          throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
        }
      }
      
      function boundsError (value, length, type) {
        if (Math.floor(value) !== value) {
          validateNumber(value, type)
          throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value)
        }
      
        if (length < 0) {
          throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
        }
      
        throw new errors.ERR_OUT_OF_RANGE(type || 'offset',
                                          `>= ${type ? 1 : 0} and <= ${length}`,
                                          value)
      }


      function checkBounds (buf, offset, byteLength) {
        validateNumber(offset, 'offset')
        if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
          boundsError(offset, buf.length - (byteLength + 1))
        }
      }
      
      function checkIntBI (value, min, max, buf, offset, byteLength) {
        if (value > max || value < min) {
          const n = typeof min === 'bigint' ? 'n' : ''
          let range
          if (byteLength > 3) {
            if (min === 0 || min === BigInt(0)) {
              range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`
            } else {
              range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
                      `${(byteLength + 1) * 8 - 1}${n}`
            }
          } else {
            range = `>= ${min}${n} and <= ${max}${n}`
          }
          throw new errors.ERR_OUT_OF_RANGE('value', range, value)
        }
        checkBounds(buf, offset, byteLength)
      }
}

// export buffer
module.exports = buffer;