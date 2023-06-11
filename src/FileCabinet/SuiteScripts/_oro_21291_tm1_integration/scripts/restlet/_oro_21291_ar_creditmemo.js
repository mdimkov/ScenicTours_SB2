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

    /* MDIMKOV 17.07.2021: integration restlet used for Scenic AR credit memos -> integrated as customer credit memos in NetSuite
    *  the list of invoice IDs is being kept in an array, so that it can be sent back with pass/fail statuses
    *  the array is being returned also when an error message is raised; the response JSON holds values for each credit memo
    *  each credit memo refunds the invoice fully (nothing is being changed on the item level)
    *  if a credit memo was already issued for the respective invoice, a new invoice is not being created again
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

            // MDIMKOV 17.07.2021: declare the array that will hold the return data
            let returnObj = {"ARCreditNote": []};

            try {

                // MDIMKOV 17.07.2021: process the requestBody input, extract the creditMemo array

                log.audit('MDIMKOV', '--- requestBody START ---');

                log.debug('requestBody', requestBody);

                const creditMemoData = requestBody.ARCreditNote;

                // 13.07.2021: iterate through credit memo records from the input payload and create the initial output JSON
                creditMemoData.forEach((creditMemo) => {

                    log.debug('creditMemo', creditMemo);

                    log.debug('MDIMKOV', 'Start creating the output object...');

                    returnObj.ARCreditNote.push(
                        {
                            "IntegrationID": creditMemo.IntegrationID,
                            "IntegrationType": "ARCreditNote",
                            "CreditNoteNumber": null,
                            "Status": 'NN',
                            "ErrorMessage": null,
                            "ProcessedDate": null,
                            "NetSuiteId": null
                        });
                });

                // 13.07.2021: iterate through credit memo records from the input payload and create credit memos
                creditMemoData.forEach((creditMemo) => {

                    const integrationID = creditMemo.IntegrationID;

                    try {

                        log.debug('creditMemo', creditMemo);
                        const nsInvoiceId = creditMemo.ApplyNetSuiteID;
                        const postingDate = new Date(creditMemo.PostingDate) || new Date();

                        if (nsInvoiceId) {

                            // MDIMKOV 17.07.2021: raise error message if the invoice already has a credit memo created
                            if (!creditMemoExists(nsInvoiceId)) {

                                // MDIMKOV 13.07.2021: create the sales invoice record
                                let recCreditMemo = record.transform({
                                    fromType: record.Type.INVOICE,
                                    fromId: nsInvoiceId,
                                    toType: record.Type.CREDIT_MEMO,
                                    isDynamic: false,
                                });

                                recCreditMemo.setValue('custbody_oro_21_integrtype', 'ARCreditNote');
                                recCreditMemo.setValue('custbody_oro_21_integrid', integrationID);
                                recCreditMemo.setValue('trandate', postingDate);

                                const creditMemoId = recCreditMemo.save({ignoreMandatoryFields: true});

                                if (creditMemoId) {
                                    // MDIMKOV 19.07.2021: find the document number for the newly-created credit note
                                    let cmDocNum = lib.transIntIdToDocNum(creditMemoId);

                                    // MDIMKOV 17.07.2021: adding creditMemo SUCCEEDED, add the entry to the return object
                                    log.audit('MDIMKOV', 'Start declaring status...');
                                    declareStatus(returnObj.ARCreditNote, integrationID, 'HK', null, creditMemoId, cmDocNum);
                                }

                            } else {
                                // MDIMKOV 17.07.2021: this invoice already has a credit memo associated with it, declare failure
                                declareStatus(returnObj.ARCreditNote, integrationID, 'ER', 'This invoice already has an associated credit note.', 0, '');
                            }


                        } else {
                            // MDIMKOV 17.07.2021: a mandatory field is missing
                            declareStatus(returnObj.ARCreditNote, integrationID, 'ER', 'The following field value is missing: ApplyNetSuiteID', 0, '');
                        }

                    } catch (e) {

                        log.error('ERROR', e.message + ' --- ' + e.stack);

                        // MDIMKOV 17.07.2021: adding creditMemo FAILED, add the failed entry to the return object
                        declareStatus(returnObj.ARCreditNote, integrationID, 'ER', e.message + ' --- ' + e.stack, 0, '');

                    }

                });

                log.audit('MDIMKOV', '--- requestBody END ---');

                return returnObj;

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);

                // MDIMKOV 17.07.2021: return the return object, which holds information about failed/succeeded entries
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


        // MDIMKOV 17.07.2021: this function changes the transaction output JSON status, declaring success or failure
        function declareStatus(obj, integrId, status, message, id, docNum) {

            // MDIMKOV 16.06.2021: find the element to be updated in the output JSON
            const objIndex = obj.findIndex((obj => obj.IntegrationID === integrId));

            // MDIMKOV 24.06.2021: if the error message was due to Script Execution Usage Limit Exceeded, the entries need to be returned as not processed
            if (!message || !message.includes('Script Execution Usage Limit Exceeded')) {

                // MDIMKOV 16.06.2021: update the respective output array element with success/failure status
                obj[objIndex].Status = status;
                obj[objIndex].CreditNoteNumber = docNum;
                obj[objIndex].ErrorMessage = message;
                obj[objIndex].ProcessedDate = new Date;
                obj[objIndex].NetSuiteId = id;

            }

        }


        // MDIMKOV 17.07.2021: this function checks if the invoice already has a credit memo associated with it (returns true if so)
        function creditMemoExists(invoiceId) {

            var cmSearchObj = search.create({
                type: 'creditmemo',
                filters:
                    [
                        ['type', 'anyof', 'CustCred'],
                        'AND',
                        ['mainline', 'is', 'T'],
                        'AND',
                        ['createdfrom', 'anyof', invoiceId]
                    ],
                columns:
                    [
                        'internalid'
                    ]
            });

            var cmSearchResults = cmSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            if (cmSearchResults.length > 0) {
                return true;
            } else {
                return false;
            }

        }

        return {get, put, post, delete: doDelete}

    })
;
