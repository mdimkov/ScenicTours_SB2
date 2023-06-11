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

    /* MDIMKOV 12.07.2021: integration restlet used for Scenic AR invoices -> integrated as sales invoices in NetSuite
    *  the list of invoice IDs is being kept in an array, so that it can be sent back with pass/fail statuses
    *  the array is being returned also when an error message is raised; the response JSON holds values for each invoice *line*
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

            // MDIMKOV 12.07.2021: declare the array that will hold the return data
            let returnObj = {"ARInvoice": []};

            try {

                // MDIMKOV 12.07.2021: process the requestBody input, extract the salesInvoice array

                log.audit('MDIMKOV', '--- requestBody START ---');

                log.debug('requestBody', requestBody);

                const salesInvoiceData = requestBody.ARInvoice;

                // 13.07.2021: iterate through invoice records from the input payload
                salesInvoiceData.forEach((salesInvoice) => {

                    log.audit('salesInvoice', salesInvoice);

                    log.audit('MDIMKOV', 'Start creating the output object...');

                    // MDIMKOV 12.07.2021: prepare an empty return object structure that holds all salesInvoice lines and set them to 'Not Processed'
                    salesInvoice.ARInvoiceLine.forEach((salesInvoiceLine) => {

                        log.debug('salesInvoiceLine', salesInvoiceLine);

                        log.debug('MDIMKOV', 'Push object to initial return object...');

                        returnObj.ARInvoice.push(
                            {
                                "IntegrationID": salesInvoiceLine.IntegrationID,
                                "IntegrationType": "ARInvoice",
                                "InvoiceNumber": null,
                                "Status": 'NN',
                                "ErrorMessage": null,
                                "ProcessedDate": null,
                                "NetSuiteId": null
                            }
                        )

                    });

                    // MDIMKOV 12.07.2021: try to create the sales invoice; if impossible, add respective message to the return array
                    try {

                        log.audit('MDIMKOV', 'Start assigning header values...');

                        // MDIMKOV 12.07.2021: get the header data and assign it to constants
                        const bookCode = salesInvoice["ARInvoiceHeader.BookCode"];
                        const invoiceDate = salesInvoice["ARInvoiceHeader.InvoiceDate"] || new Date();
                        const currency = salesInvoice["ARInvoiceHeader.Currency"];
                        const dueDate = salesInvoice["ARInvoiceHeader.DueDate"];

                        if (bookCode && currency) {

                            log.audit('MDIMKOV', 'Start creating invoice header...');

                            // MDIMKOV 13.07.2021: create the sales invoice record
                            var recSalesInvoice = record.create({
                                type: 'invoice',
                                isDynamic: true
                            });

                            // MDIMKOV 13.07.2021: set the header values
                            recSalesInvoice.setValue('entity', lib.getRecIdbyExtId('customer', bookCode));
                            recSalesInvoice.setValue('trandate', new Date(invoiceDate));
                            recSalesInvoice.setValue('currency', lib.currencyISOtoID(currency));
                            recSalesInvoice.setValue('duedate', dueDate ? new Date(dueDate) : '');
                            recSalesInvoice.setValue('custbody_oro_21_integrtype', 'ARInvoice');
                            recSalesInvoice.setValue('approvalstatus', 2);

                            // MDIMKOV 13.07.2021: set the line items on the invoice
                            log.audit('MDIMKOV', 'Start creating invoice lines...');

                            salesInvoice.ARInvoiceLine.forEach((salesInvoiceLine) => {

                                const integrationID = salesInvoiceLine.IntegrationID;
                                const itemId = salesInvoiceLine.ItemID;
                                const lineDescription = salesInvoiceLine.LineDescription;
                                const amount = salesInvoiceLine.Amount;
                                const tour = salesInvoiceLine.Tour;
                                const cabinClass = salesInvoiceLine.CabinClass;
                                const dRDateFrom = salesInvoiceLine.DRDateFrom ? new Date(salesInvoiceLine.DRDateFrom) : '';
                                const dRDateTo = salesInvoiceLine.DRDateTo ? new Date(salesInvoiceLine.DRDateTo) : '';

                                recSalesInvoice.selectNewLine({
                                    sublistId: 'item'
                                });

                                recSalesInvoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_oro_21_integrid',
                                    value: integrationID
                                });
                                recSalesInvoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    value: itemId
                                });
                                recSalesInvoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'description',
                                    value: lineDescription
                                });
                                recSalesInvoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: amount
                                });
                                recSalesInvoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_oro_21_tourid',
                                    value: lib.findListValue(tour,'customrecord_cseg_oro_tour')
                                });
                                if (dRDateFrom) {
                                    recSalesInvoice.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_oro_21000_revrec_startdate',
                                        value: dRDateFrom
                                    });
                                }
                                if (dRDateTo) {
                                    recSalesInvoice.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_oro_21000_revrec_enddate',
                                        value: dRDateTo
                                    });
                                }

                                recSalesInvoice.commitLine({
                                    sublistId: 'item'
                                });

                            });

                            const salesInvoiceId = recSalesInvoice.save({
                                ignoreMandatoryFields: true
                            });

                            log.audit('MDIMKOV', 'Created invoice with ID ' + salesInvoiceId);

                            // MDIMKOV 13.07.2021: get the invoice number (needed in the output JSON)
                            if (salesInvoiceId) {
                                var lookUpInvoice = search.lookupFields({
                                    type: search.Type.INVOICE,
                                    id: salesInvoiceId,
                                    columns: ['tranid']
                                });
                            }

                                let docNum = '';

                            if (lookUpInvoice) {
                                docNum = lookUpInvoice.tranid;
                            }


                            // MDIMKOV 12.07.2021: adding salesInvoice SUCCEEDED, add the entry to the return object
                            log.audit('MDIMKOV', 'Start declaring status...');
                            declareStatus(salesInvoice.ARInvoiceLine, returnObj.ARInvoice, 'HK', null, salesInvoiceId, docNum);


                        } else {
                            // MDIMKOV 12.07.2021: a mandatory field is missing
                            declareStatus(salesInvoice.ARInvoiceLine, returnObj.ARInvoice,'ER', 'One of the following mandatory field values is missing: book code, currency', 0, '');
                        }

                    } catch (e) {

                        log.error('ERROR', e.message + ' --- ' + e.stack);

                        // MDIMKOV 12.07.2021: adding salesInvoice FAILED, add the failed entry to the return object
                        declareStatus(salesInvoice.ARInvoiceLine, returnObj.ARInvoice,'ER', e.message + ' --- ' + e.stack, 0, '');

                    }

                });

                log.audit('MDIMKOV', '--- requestBody END ---');

                return returnObj;

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);

                // MDIMKOV 12.07.2021: return the return object, which holds information about failed/succeeded entries
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


        function declareStatus(invLines, obj, status, message, id, docNum) {

            invLines.forEach((salesInvoiceLine) => {

                const objIndex = obj.findIndex((obj => obj.IntegrationID === salesInvoiceLine.IntegrationID));

                // MDIMKOV 13.07.2021: if the error message was due to Script Execution Usage Limit Exceeded, the entries need to be returned as not processed
                if (!message || !message.includes('Script Execution Usage Limit Exceeded')) {

                    // MDIMKOV 12.07.2021: update the respective output array element with success/failure status
                    obj[objIndex].Status = status;
                    obj[objIndex].InvoiceNumber = docNum;
                    obj[objIndex].ErrorMessage = message;
                    obj[objIndex].ProcessedDate = new Date;
                    obj[objIndex].NetSuiteId = id;

                }

            });

        }


        return {get, put, post, delete: doDelete}

    });
