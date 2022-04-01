/**
 * Custom exceptions this module could throw.
 * 
 * |-- copyright and license --|
 * @package    binary-buffer-serializer
 * @author     Ronen Ness (ronenness@gmail.com | http://ronenness.com)
 * @copyright  (c) 2022 Ronen Ness
 * @license    MIT
 * 
*/
'use strict';


// partial data not allowed error
class PartialNotAllowedError extends Error {
    constructor(missingField) {
        super(`Field '${missingField}' is not present in source data, and partial data is not allowed for this serializer.`);
        this.name = "PartialNotAllowedError";
    }
}


// tried to serialize a type but couldn't find any method for it.
class MissingSerializeMethod extends Error {
    constructor(type) {
        super(`Tried to serialize field type '${type}' but could not find a matching method in the parser class.`);
        this.name = "MissingSerializeMethod";
    }
}


// tried to serialize a type but couldn't find any method for it.
class MissingDeserializeMethod extends Error {
    constructor(type) {
        super(`Tried to deserialize field type '${type}' but could not find a matching method in the parser class.`);
        this.name = "MissingDeserializeMethod";
    }
}


// tried to serialize a type but couldn't find any method for it.
class WrongValueType extends Error {
    constructor(value) {
        super(`Wrong type or value (${value}).`);
        this.name = "WrongValueType";
    }
}


// export the exceptions
module.exports = {
    PartialNotAllowedError: PartialNotAllowedError,
    MissingSerializeMethod: MissingSerializeMethod,
    MissingDeserializeMethod: MissingDeserializeMethod,
    WrongValueType: WrongValueType,
};