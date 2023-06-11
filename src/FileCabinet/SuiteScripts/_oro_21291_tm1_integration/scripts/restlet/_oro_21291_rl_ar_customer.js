/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', './lib'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{lib} lib
     */

    /* MDIMKOV 08.06.2021: integration restlet used for creating A/R customers
    *  the list of customer external IDs is being kept in an array, so that it can be sent back with pass/fail statuses
    *  the array is being returned also when an error message is raised
    * */

    (record, search, lib) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {

        }

        /**
         * Defines the function that is executed when a PUT request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const put = (requestBody) => {

            // MDIMKOV 08.06.2021: declare the array that will hold the return data
            let returnObj = {"ARCustomers": []};

            try {

                // MDIMKOV 15.06.2021: process the requestBody input, extract the customer array

                log.audit('MDIMKOV', '--- requestBody START ---');

                log.debug('requestBody', requestBody);

                const customerData = requestBody.ARCustomers;

                log.debug('customerData', customerData);

                // MDIMKOV 16.06.2021: prepare an empty return object structure that holds all customer IDs and set them to 'Not Processed' (NN)
                customerData.forEach((customer) => {
                    returnObj.ARCustomers.push(
                        {
                            "IntegrationID": customer.IntegrationID,
                            "IntegrationType": "ARCustomer",
                            "BookCode": customer.BookCode,
                            "Status": 'NN',
                            "ErrorMessage": null,
                            "ProcessedDate": null,
                            "NetSuiteId": null
                        }
                    )
                });


                // MDIMKOV 15.06.2021: iterate through customer records from requestBody and create them in NetSuite
                customerData.forEach((customer) => {

                    const bookCode = customer.BookCode;
                    let emailPreference = 'DEFAULT';
                    if (customer.IsEmailPDF) emailPreference = 'PDF';
                    if (customer.IsEmailHTML) emailPreference = 'HTML';


                    // MDIMKOV 15.06.2021: try to create/update the customer; if impossible, add respective message to the return array
                    try {

                        // MDIMKOV 21.06.2021: if the record exists, create it, otherwise: update it
                        const recordId = lib.getRecIdbyExtId('customer', bookCode);
                        log.audit('recordId', recordId);

                        if (!recordId) {
                            var recCustomer = record.create({
                                type: record.Type.CUSTOMER
                            });
                        } else {
                            var recCustomer = record.load({
                                type: record.Type.CUSTOMER,
                                id: recordId,
                                isDynamic: true
                            });
                        }

                        // MDIMKOV 23.06.2021: manage mandatory fields for company name and first name, last name
                        if ((customer.Individual && customer.FirstName && customer.LastName) || (!customer.Individual && customer.CompanyName)) {

                            recCustomer.setValue('externalid', customer.IntegrationID);
                            recCustomer.setValue('isperson', customer.Individual ? 'T' : 'F');
                            recCustomer.setValue('firstname', customer.FirstName);
                            recCustomer.setValue('lastname', customer.LastName);
                            recCustomer.setValue('companyname', customer.CompanyName);
                            recCustomer.setValue('entitystatus', customer.CustomerStatusID);
                            recCustomer.setText('currency', customer.Currency);
                            recCustomer.setValue('subsidiary', customer.SubsidiaryID);
                            recCustomer.setValue('phone', customer.Phone);
                            recCustomer.setValue('fax', customer.Fax);
                            recCustomer.setValue('email', customer.Email);
                            recCustomer.setValue('custentity_emea_company_reg_num', customer.TaxRegistrationNumber);
                            recCustomer.setValue('emailpreference', emailPreference);
                            recCustomer.setValue('inactive', customer.Inactive ? 'T' : 'F');
                            recCustomer.setValue('custentity_oro_21_book_brand', customer.BookingBrandID);
                            recCustomer.setValue('custentity_oro_21_book_firstdepdt', customer.FirstDepartureDate ? new Date(customer.FirstDepartureDate) : '');
                            recCustomer.setValue('custentity_oro_21_book_firstretdt', customer.FirstReturnDate ? new Date(customer.FirstReturnDate) : '');
                            recCustomer.setValue('custentity_oro_21_book_lastdepdt', customer.LastDepartureDate ? new Date(customer.LastDepartureDate) : '');
                            recCustomer.setValue('custentity_oro_21_book_lastretdt', customer.LastReturnDate ? new Date(customer.LastReturnDate) : '');
                            recCustomer.setValue('custentity_oro_21_book_debtor', customer.DebtorModeID);
                            recCustomer.setValue('custentity_oro_21_book_date', customer.BookingDate ? new Date(customer.BookingDate) : '');
                            recCustomer.setValue('custentity_oro_21_book_cancel', customer.CancelDate ? new Date(customer.CancelDate) : '');
                            recCustomer.setValue('custentity_oro_21_book_sale_type', customer.SaleTypeID);
                            recCustomer.setValue('custentity_oro_21_book_compnumb', customer.CompanyNumber);
                            recCustomer.setValue('custentity_oro_integration_type', customer.IntegrationType);
                            if (customer. DefaultARAccount) {
                                recCustomer.setValue('receivablesaccount', lib.findAccountByNumber(customer.DefaultARAccount));
                            }
                            if (customer.AgentCode) {
                                const agentDetailsId = lib.singleRecordSearch('customrecord_oro_agent_details', ['custrecord_agent_code','is','CRUCHO22'], 'internalid')
                                if (agentDetailsId) {
                                    recCustomer.setValue('custentity_oro_21_book_agent_code', agentDetailsId);
                                }
                            }


                            const customerId = recCustomer.save({
                                ignoreMandatoryFields: true
                            });


                            if (customerId) {

                                // MDIMKOV 23.06.2021: update the customer entityid field (doesn't work as part of the main block during insert, for some reason)
                                record.submitFields({
                                    type: record.Type.CUSTOMER,
                                    id: customerId,
                                    values: {
                                        entityid: customer.BookCode
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });


                                // MDIMKOV 21.06.2021: since address was not added yet, declare the creation as a failure; it will be fixed once the address was added
                                declareStatus(returnObj.ARCustomers, bookCode, 'ER', 'Customer created but there was an issue attaching the address to it.', customerId);

                                // MDIMKOV 15.06.2021: add the customer address; if successfully added, the below will evaluate to true, so that the overall status can be set
                                let isAddressReady = updateAddress(customerId, customer);

                                // MDIMKOV 15.06.2021: adding customer SUCCEEDED, add the entry to the return object; isAddressReady[0] is the true/false return statement and isAddressReady[1] is the potential error message
                                if (isAddressReady[0]) {
                                    declareStatus(returnObj.ARCustomers, bookCode, 'HK', null, customerId);
                                } else {
                                    declareStatus(returnObj.ARCustomers, bookCode, 'ER', 'Customer created but there was an issue attaching the address to it. --- ' + isAddressReady[1], customerId);
                                }
                            } else {
                                // MDIMKOV 15.06.2021: adding customer FAILED, add the failed entry to the return object
                                declareStatus(returnObj.ARCustomers, bookCode, 'ER', 'Could not create customer', 0);
                            }

                        } else {
                            // MDIMKOV 15.06.2021: a mandatory field is missing
                            declareStatus(returnObj.ARCustomers, bookCode, 'ER', 'One of the following mandatory field values is missing: firstName, lastName, companyName', 0);
                        }

                    } catch (e) {

                        log.error('ERROR', e.message + ' --- ' + e.stack);

                        // MDIMKOV 15.06.2021: adding customer FAILED, add the failed entry to the return object
                        declareStatus(returnObj.ARCustomers, bookCode, 'ER', e.message + ' --- ' + e.stack, 0);

                    }


                });

                log.audit('MDIMKOV', '--- requestBody END ---');

                return returnObj;

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);

                // MDIMKOV 15.06.2021: return the return object, which holds information about failed/succeeded entries
                return returnObj;

            }

        }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {

        }

        /**
         * Defines the function that is executed when a DELETE request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const doDelete = (requestParams) => {

        }


        function declareStatus(obj, bookCode, status, message, id) {

            // MDIMKOV 16.06.2021: find the element to be updated in the output JSON
            const objIndex = obj.findIndex((obj => obj.BookCode === bookCode));

            // MDIMKOV 24.06.2021: if the error message was due to Script Execution Usage Limit Exceeded, the entries need to be returned as not processed
            if (!message ||  !message.includes('Script Execution Usage Limit Exceeded')) {

                // MDIMKOV 16.06.2021: update the respective output array element with success/failure status
                obj[objIndex].Status = status;
                obj[objIndex].ErrorMessage = message;
                obj[objIndex].ProcessedDate = new Date;
                obj[objIndex].NetSuiteId = id;

            }

        }


        // MDIMKOV 21.06.2021: this function deletes the existing addresses for a customer (if existing) and adds a new one; a business rule enforces just 1 address per customer
        function updateAddress(customerId, fieldsArray) {

            var returnVal = [false, ''];

            try {

                log.audit('MDIMKOV', '--- updateAddress START ---');

                var recCustomer = record.load({
                    type: record.Type.CUSTOMER,
                    id: customerId,
                    isDynamic: true
                });

                // MDIMKOV 21.06.2021: remove existing address lines
                var iAddrLineCount = recCustomer.getLineCount({sublistId: 'addressbook'});

                for (var j = 0; j < iAddrLineCount; j++) {

                    recCustomer.selectLine({
                        sublistId: 'addressbook',
                        line: j
                    });

                    recCustomer.removeLine({
                        sublistId: 'addressbook',
                        line: j
                    });

                }

                // MDIMKOV 21.06.2021: add the new address (only one address per customer: business rule)
                recCustomer.selectNewLine({
                    sublistId: 'addressbook'
                });

                var addressSubrecord = recCustomer.getCurrentSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress'
                });

                var addressee = fieldsArray.Individual ? fieldsArray.FirstName + ' ' + fieldsArray.LastName : fieldsArray.CompanyName;

                var country = '';
                if (fieldsArray.Country) {
                    if (lib.countryByCode(fieldsArray.Country)[0]) {
                        country = lib.countryByCode(fieldsArray.Country)[0].id;
                    }
                }

                addressSubrecord.setValue('country', fieldsArray.Country);
                addressSubrecord.setValue('label', fieldsArray.BillingLabel);
                addressSubrecord.setValue('addr1', fieldsArray.Address1);
                addressSubrecord.setValue('addr2', fieldsArray.Address2);
                addressSubrecord.setValue('city', fieldsArray.City);
                addressSubrecord.setText('state', fieldsArray.State);
                addressSubrecord.setValue('zip', fieldsArray.PostCode);
                addressSubrecord.setValue('addressee', addressee);

                recCustomer.commitLine({
                    sublistId: 'addressbook'
                });

                var recCustomerWithAddress = recCustomer.save();

                // MDIMKOV 21.05.2021: pass back a true return value, so that the overal success status can be updated on the customer
                if (recCustomerWithAddress) {
                    returnVal = [true, ''];
                }

                log.audit('MDIMKOV', '--- updateAddress END ---');

                return returnVal;

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);

                returnVal = [false, e.message + ' --- ' + e.stack];
                return returnVal;

            }

        }


        return {get, put, post, delete: doDelete}

    });
