'use strict';

/**
 * @namespace Newsletter
 */

var server = require('server');

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Creates a list of address model for the logged in user
 * @param {string} customerNo - customer number of the current customer
 * @returns {List} a plain list of objects of the current customer's addresses
 */
 function getList(customerNo) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var NewsletterModel = require('*/cartridge/models/newsletter');

    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    var rawNewsletter = {
        firstName: customer.getProfile().getFirstName(),
        lastName: customer.getProfile().getLastName(),
        email: customer.getProfile().getEmail()
    }
    var newsletter = new NewsletterModel(rawNewsletter);

    return newsletter;

}
/**
 * Creates a list of address model for the logged in user
 * @param {string} customerNo - customer number of the current customer
 * @param {Object} newsletter
 * @returns {void}
 */
function setList(customerNo, newsletter) {
    var CustomerMgr = require('dw/customer/CustomerMgr');

    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    var profile = customer.getProfile();
    profile.setFirstName(newsletter.newsletter.firstName);
    profile.setLastName(newsletter.newsletter.lastName);
    profile.setEmail(newsletter.newsletter.email);


}

/**
 * Newsletter-List : Used to show newsletter subscription info created by a registered shopper
 * @name Base/Newsletter-List
 * @function
 * @memberof NewsLetter
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
 server.get('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    var actionUrls = {
        // In case need edit/delete button/feature
        deleteActionUrl: URLUtils.url('Newsletter-Delete').toString(),
        listActionUrl: URLUtils.url('Newsletter-List').toString(),
        redirectUrl: URLUtils.url('Newsletter-List').toString()
    };
    res.render('account/subscription', {
        newsletter: getList(req.currentCustomer.profile.customerNo),
        actionUrls: actionUrls,
        breadcrumbs: [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.newsletter', 'newsletter', null),
                url: URLUtils.url('Newsletter-Show').toString()
            }
        ]
    });
    next();
});

/**
 * Address-AddAddress : A link to a page to create a new address
 * @name Base/Newsletter-Show
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - registration - A flag determining whether or not this is a newly registered account
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
 server.get(
    'Show',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var newsletterForm = server.forms.getForm('newsletter');
        newsletterForm.clear();
        res.render('account/editNewsletter', {
            newsletterForm: newsletterForm,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.newsletter', 'newsletter', null),
                    url: URLUtils.url('Newsletter-Show').toString()
                }
            ]
        });
        next();
    }
);

/**
 * Newsletter-Subscribe :Save newsletter subscription data
 * @name Base/Newsletter-Subscribe
 * @function
 * @memberof newsletter
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post('Subscribe', server.middleware.https,consentTracking.consent, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var newsletterHelpers = require('*/cartridge/scripts/helpers/newsletterHelpers');
    var NewsletterModel = require('*/cartridge/models/newsletter');


    var newsletterForm = server.forms.getForm('newsletter');
    var newsletterFormObj = newsletterForm.toObject();
    newsletterFormObj.newsletterForm = newsletterForm;
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    //var addressBook = customer.getProfile().getAddressBook();
    if (newsletterForm.valid) {
        res.setViewData(newsletterFormObj);

        var formInfo = res.getViewData();
        Transaction.wrap(function () {

            var newsletter= getList(req.currentCustomer.profile.customerNo); //as default newsletter info
            var currentNewsletter = new NewsletterModel(newsletterFormObj);

            if(currentNewsletter){
                // Save form's info
                newsletterHelpers.updateNewsletterFields(newsletter, currentNewsletter);

                // Update customer profile with newsletter info
                setList(req.currentCustomer.profile.customerNo, currentNewsletter);
            }

                // Send newsletter subscription email
                newsletterHelpers.sendSubscriptionEmail(newsletter);

                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('Newsletter-List').toString()
                });


            });
        }  else {
            formInfo.newsletterForm.valid = false;
            formInfo.newsletterForm.error =
                Resource.msg('error.message.newsletter.subscribe', 'newsletter', null);
            res.json({
                success: false,
                fields: formErrors.getFormErrors(newsletterForm)
            });
        }


        res.redirect(URLUtils.url('Newsletter-List'));
        next();
});

module.exports = server.exports();
