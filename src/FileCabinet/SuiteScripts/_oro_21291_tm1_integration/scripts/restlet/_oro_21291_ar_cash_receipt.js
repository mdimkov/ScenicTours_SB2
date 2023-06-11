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

    /* MDIMKOV 02.07.2021: integration restlet used for Scenic AR cash receipts -> integrated as customer deposits in NetSuite
    *  the list of customer deposit IDs is being kept in an array, so that it can be sent back with pass/fail statuses
    *  the array is being returned also when an error message is raised
    *  the book code represents an actual customer -- it maps to customer.extenralid
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

            // MDIMKOV 02.07.2021: declare the array that will hold the return data
            let returnObj = {"CustomerDeposit": []};

            try {

                // MDIMKOV 02.07.2021: process the requestBody input, extract the custDeposit array

                log.audit('MDIMKOV', '--- requestBody START ---');

                log.debug('requestBody', requestBody);

                const custDepositData = requestBody.CustomerDeposit;

                log.debug('custDepositData', custDepositData);

                // MDIMKOV 02.07.2021: prepare an empty return object structure that holds all custDeposit IDs and set them to 'Not Processed'
                custDepositData.forEach((custDeposit) => {
                    returnObj.CustomerDeposit.push(
                        {
                            "IntegrationID": custDeposit.IntegrationID,
                            "IntegrationType": "ARCashReceipt",
                            "Deposit#": null,
                            "Status": 'NN',
                            "ErrorMessage": null,
                            "ProcessedDate": null,
                            "NetSuiteId": null
                        }
                    )
                });


                // MDIMKOV 02.07.2021: iterate through custDeposit records from requestBody and create them in NetSuite
                custDepositData.forEach((custDeposit) => {
                    const integrationID = custDeposit.IntegrationID;
                    const bookCode = custDeposit.BookCode;
                    const memo = custDeposit.Memo;
                    const companyNumber = custDeposit.CompanyNumber;
                    const date = custDeposit.Date;
                    const undepositedFunds = 'T';
                    const amount = custDeposit.Amount;
                    const paymentType = custDeposit.PaymentType;
                    const currency = custDeposit.Currency;

                    // MDIMKOV 02.07.2021: try to create the customer depost; if impossible, add respective message to the return array
                    try {

                        // MDIMKOV 21.06.2021: if the record exists, create it, otherwise: update it
                        const recordId = lib.getRecIdbyExtId('customerdeposit', integrationID);
                        log.audit('recordId', recordId);

                        if (!recordId) {
                            var recCustDeposit = record.create({
                                type: 'customerdeposit'
                            });
                        } else {
                            var recCustDeposit = record.load({
                                type: 'customerdeposit',
                                id: recordId
                            });
                        }

                        if (bookCode && amount) {

                            recCustDeposit.setValue('externalid', integrationID);
                            recCustDeposit.setValue('custbody_oro_21_integrtype', 'ARCashReceipt');
                            recCustDeposit.setValue('customer', lib.getRecIdbyExtId('customer', bookCode));
                            recCustDeposit.setValue('usepaymentoption', false);
                            recCustDeposit.setValue('memo', memo);
                            recCustDeposit.setValue('custbody_oro_21_ataxregno', companyNumber);
                            recCustDeposit.setValue('trandate', date ? new Date(date) : '');
                            recCustDeposit.setValue('undepfunds', undepositedFunds);
                            recCustDeposit.setValue('payment', amount);
                            recCustDeposit.setValue('paymentmethod', lib.findListValueCached(paymentType, 'paymentmethod', true));
                            recCustDeposit.setValue('currency', lib.currencyISOtoID(currency));

                            log.debug('Customer Id', lib.getRecIdbyExtId('customer', bookCode));

                            const custDepId = recCustDeposit.save({
                                ignoreMandatoryFields: true
                            });

                            // MDIMKOV 05.07.2021: get the customer deposit number (needed in the output JSON
                            if (custDepId) {
                                var lookUpCustDep = search.lookupFields({
                                    type: search.Type.CUSTOMER_DEPOSIT,
                                    id: custDepId,
                                    columns: ['tranid']
                                });
                            }

                            let docNum = '';

                            if (lookUpCustDep) {
                                docNum = lookUpCustDep.tranid;
                            }


                            // MDIMKOV 02.07.2021: adding custDeposit SUCCEEDED, add the entry to the return object
                            declareStatus(returnObj.CustomerDeposit, integrationID, 'HK', null, custDepId, docNum);


                        } else {
                            // MDIMKOV 02.07.2021: a mandatory field is missing
                            declareStatus(returnObj.CustomerDeposit, integrationID, 'ER', 'One of the following mandatory field values is missing: book code, amount', 0, '');
                        }

                    } catch (e) {

                        log.error('ERROR', e.message + ' --- ' + e.stack);

                        // MDIMKOV 02.07.2021: adding custDeposit FAILED, add the failed entry to the return object
                        declareStatus(returnObj.CustomerDeposit, integrationID, 'ER', e.message + ' --- ' + e.stack, 0, '');

                    }


                });

                log.audit('MDIMKOV', '--- requestBody END ---');

                return returnObj;

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);

                // MDIMKOV 02.07.2021: return the return object, which holds information about failed/succeeded entries
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


        function declareStatus(obj, integrationId, status, message, id, docNum) {

            // MDIMKOV 02.07.2021: find the element to be updated in the output JSON
            const objIndex = obj.findIndex((obj => obj.IntegrationID == integrationId));

            // MDIMKOV 24.06.2021: if the error message was due to Script Execution Usage Limit Exceeded, the entries need to be returned as not processed
            if (!message || !message.includes('Script Execution Usage Limit Exceeded')) {

                // MDIMKOV 02.07.2021: update the respective output array element with success/failure status
                obj[objIndex]['Deposit#'] = docNum;
                obj[objIndex].Status = status;
                obj[objIndex].ErrorMessage = message;
                obj[objIndex].ProcessedDate = new Date;
                obj[objIndex].NetSuiteId = id;

            }

        }


        return {get, put, post, delete: doDelete}

    });
