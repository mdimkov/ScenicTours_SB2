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

    /* MDIMKOV 14.09.2021: integration restlet used for Scenic BSP Vendor Bills -> integrated as vendor bills or credits in NetSuite
    *  if the total amount on the document is negative, a vendor *credit* will be created; otherwise: a vendor *bill*
    *  the list of invoice IDs is being kept in an array, so that it can be sent back with pass/fail statuses
    *  the array is being returned also when an error message is raised; the response JSON holds values for each invoice *line*
    *  NOTE!! while most of the variables say "bill" they equaly serve vendor *credits*
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

            // MDIMKOV 14.09.2021: declare the array that will hold the return data
            let returnObj = {"BSP": []};

            try {

                // MDIMKOV 14.09.2021: process the requestBody input, extract the bspVendorBill array

                log.audit('MDIMKOV', '--- requestBody START ---');

                log.debug('requestBody', requestBody);

                const bspVendorBillData = requestBody.BSP;

                // 13.07.2021: iterate through invoice records from the input payload
                bspVendorBillData.forEach((bspVendorBill) => {

                    log.audit('bspVendorBill', bspVendorBill);

                    log.audit('MDIMKOV', 'Start creating the output object...');

                    const integrationID = bspVendorBill["BSPHeader.IntegrationID"];

                    // MDIMKOV 14.09.2021: prepare an empty return object structure that holds all bspVendorBill lines and set them to 'Not Processed'
                    log.debug('MDIMKOV', 'Push object to initial return object...');

                    returnObj.BSP.push(
                        {
                            "IntegrationID": integrationID,
                            "IntegrationType": "BSP",
                            "Status": 'NN',
                            "ErrorMessage": null,
                            "ProcessedDate": null,
                            "DocumentType": null,
                            "DocumentNumber": null,
                            "NetSuiteId": null
                        }
                    )

                    // MDIMKOV 14.09.2021: try to create the vendor bill / credit; if impossible, add respective message to the return array
                    try {

                        // MDIMKOV 16.09.2021: the total of each document will be summed; depending on the sign, a bill or a credit will be created
                        let totalAmount = 0;

                        bspVendorBill.BSPLine.forEach((bspVendorBillLine) => {
                            totalAmount += bspVendorBillLine.Amount;
                        });

                        log.audit('MDIMKOV', 'Start assigning header values...');

                        // MDIMKOV 14.09.2021: get the header data and assign it to constants
                        const vendorId = bspVendorBill["BSPHeader.VendorId"];
                        const invoiceDate = bspVendorBill["BSPHeader.InvoiceDate"] || new Date();
                        const currency = bspVendorBill["BSPHeader.Currency"];

                        log.audit('vendorId', vendorId);
                        log.audit('currency', currency);

                        if (vendorId && currency) {

                            log.audit('MDIMKOV', 'Start creating invoice header...');

                            // MDIMKOV 13.07.2021: create the sales invoice record
                            var recBspVendorBill = record.create({
                                type: totalAmount >= 0 ? 'vendorbill' : 'vendorcredit',
                                isDynamic: true,
                                defaultValues: {
                                    entity: vendorId
                                }
                            });

                            // MDIMKOV 13.07.2021: set the header values
                            recBspVendorBill.setValue('trandate', new Date(invoiceDate));
                            recBspVendorBill.setValue('custbody_document_date', new Date(invoiceDate));
                            recBspVendorBill.setValue('custbody_oro_21_integrtype', 'BSP');
                            recBspVendorBill.setValue('custbody_oro_21_integrid', integrationID);
                            recBspVendorBill.setValue('approvalstatus', 2);
                            recBspVendorBill.setValue('currency', lib.currencyISOtoID(currency));

                            // MDIMKOV 13.07.2021: set the line items on the invoice
                            log.audit('MDIMKOV', 'Start creating document lines...');

                            bspVendorBill.BSPLine.forEach((bspVendorBillLine) => {

                                const account = bspVendorBillLine.GLAccountId;
                                const lineDescription = bspVendorBillLine.LineDescription;
                                const amount = totalAmount >= 0 ? bspVendorBillLine.Amount : -bspVendorBillLine.Amount; // if vendor credit, reverse the sign
                                const tourId = bspVendorBillLine['TourID'];
                                const taxClassId = bspVendorBillLine.TaxClassId;

                                recBspVendorBill.selectNewLine({
                                    sublistId: 'expense'
                                });

                                recBspVendorBill.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'account',
                                    value: account
                                });
                                recBspVendorBill.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'description',
                                    value: lineDescription
                                });
                                recBspVendorBill.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'amount',
                                    value: amount
                                });
                                recBspVendorBill.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'cseg_oro_tour',
                                    value: tourId
                                });

                                recBspVendorBill.commitLine({
                                    sublistId: 'expense'
                                });

                            });

                            const bspVendorBillId = recBspVendorBill.save({
                                ignoreMandatoryFields: true
                            });

                            log.audit('MDIMKOV', 'Created invoice with ID ' + bspVendorBillId);

                            // MDIMKOV 13.07.2021: get the document number (needed in the output JSON)
                            if (bspVendorBillId) {
                                var lookUpVendorBill = search.lookupFields({
                                    type: totalAmount >= 0 ? 'vendorbill' : 'vendorcredit',
                                    id: bspVendorBillId,
                                    columns: ['transactionnumber']
                                });
                            }

                            let docNum = '';

                            if (lookUpVendorBill) {
                                docNum = lookUpVendorBill.transactionnumber;
                            }


                            // MDIMKOV 14.09.2021: adding bspVendorBill SUCCEEDED, add the entry to the return object
                            log.audit('MDIMKOV', 'Start declaring status...');
                            declareStatus(returnObj.BSP, integrationID, 'HK', null, bspVendorBillId, docNum, totalAmount);


                        } else {
                            // MDIMKOV 14.09.2021: a mandatory field is missing
                            declareStatus(returnObj.BSP, integrationID, 'ER', 'One of the following mandatory field values is missing: vendorId, currency', 0, '', totalAmount);
                        }

                    } catch (e) {

                        log.error('ERROR', e.message + ' --- ' + e.stack);

                        // MDIMKOV 14.09.2021: adding bspVendorBill FAILED, add the failed entry to the return object
                        declareStatus(returnObj.BSP, integrationID, 'ER', e.message + ' --- ' + e.stack, 0, '', totalAmount);

                    }

                });

                log.audit('MDIMKOV', '--- requestBody END ---');

                return returnObj;

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);

                // MDIMKOV 14.09.2021: return the return object, which holds information about failed/succeeded entries
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


        function declareStatus(obj, IntegrationID, status, message, id, docNum, totalAmount) {

            const objIndex = obj.findIndex((obj => obj.IntegrationID === IntegrationID));

            // MDIMKOV 13.07.2021: if the error message was due to Script Execution Usage Limit Exceeded, the entries need to be returned as not processed
            if (!message || !message.includes('Script Execution Usage Limit Exceeded')) {

                // MDIMKOV 14.09.2021: update the respective output array element with success/failure status
                obj[objIndex].Status = status;
                obj[objIndex].ErrorMessage = message;
                obj[objIndex].ProcessedDate = new Date;
                obj[objIndex].DocumentType = totalAmount >= 0 ? 'vendor bill' : 'vendor credit';
                obj[objIndex].DocumentNumber = docNum;
                obj[objIndex].NetSuiteId = id;

            }

        }

        return {get, put, post, delete: doDelete}

    });
