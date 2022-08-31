'use strict';

/**
 * creates a plain object that contains newsletter subscription information
 * @param {Object} newsletterObj - customerObject
 * @returns {Object} an object that contains information about the newsletter subscription
 */

function createNewsletterObject(newsletterObj) {
    var result;
    if (newsletterObj) {
        result = {
            firstName : newsletterObj.firstName,
            lastName : newsletterObj.lastName,
            email : newsletterObj.email
        };

        if (result.stateCode === 'undefined') {
            result.stateCode = '';
        }

    } else {
        result = null;
    }
    return result;

}

/**
 * creates a plain object that contains address information
 * @param {object} newsletterObj - customerObject
 * @constructor
 */

function newsletter(newsletterObj) {
    this.newsletter = createNewsletterObject(newsletterObj);
}



module.exports = newsletter;