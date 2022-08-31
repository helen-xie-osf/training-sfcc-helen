'use strict';

/**
 * Copy information from address object and save it in the system
 * @param {Object} newsletter - newsletter to save information into
 * @param {Object} currentNewsletter - newsletter info to copy from
 *
 */
 function updateNewsletterFields(newsletter, currentNewsletter) {

    //newsletter = currentNewsletter;


    newsletter.newsletter = {
        firstName : currentNewsletter.newsletter.firstName,
        lastName : currentNewsletter.newsletter.lastName,
        email : currentNewsletter.newsletter.email
    }


}

/**
 * Stores a new newsletter for a given customer
 * @param {Object} newsletter - New newsletter to be saved
 * @param {Object} customer - Current customer
 * @returns {void}
 */
 function saveNewsletter(newsletter, customer) {
    var Transaction = require('dw/system/Transaction');


    Transaction.wrap(function () {

        var firstName = customer.raw.getProfile().getFirstName();
        var lastName = customer.raw.getProfile().getLastName();
        var email = customer.raw.getProfile().getEmail();

        var currentNewsletter = {
            firstName: firstName,
            lastName: lastName,
            email: email
        };
        updateNewsletterFields(newsletter, currentNewsletter);

    });
}


/**
 * Copy information from address object and save it in the system
 * @param {object} newsletter - newsletter to save information into
 * @returns {void}
 */
function sendSubscriptionEmail(newsletter) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var userObject = {
        firstName: newsletter.newsletter.firstName,
        lastName: newsletter.newsletter.lastName
    };

    var emailObj = {
        to: newsletter.newsletter.email,
        subject: Resource.msg('email.subject.newsletterSubscription', 'newsletter', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    emailHelpers.sendEmail(emailObj, 'account/newsletterSubscriptionEmail', userObject);

}

module.exports = {
    updateNewsletterFields: updateNewsletterFields,
    saveNewsletter: saveNewsletter,
    sendSubscriptionEmail: sendSubscriptionEmail
};
