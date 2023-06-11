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
            let returnObj = {"Refunds": []};

            try {

                // MDIMKOV 17.07.2021: process the requestBody input, extract the refund array

                log.audit('MDIMKOV', '--- requestBody START ---');

                log.debug('requestBody', requestBody);

                const refundData = requestBody.Refunds;
                log.debug('refundData', refundData);

                // 09.08.2021: iterate through refund records from the input payload and create the initial output JSON
                refundData.forEach((refund) => {

                    log.debug('refund', refund);

                    log.debug('MDIMKOV', 'Start creating the output object...');

                    returnObj.Refunds.push(
                        {
                            "IntegrationID": refund.Refund.IntegrationID,
                            "IntegrationType": "Refund",
                            "Status": 'NN',
                            "ProcessedDate": null,
                            "ErrorMessage": null,
                            "RFNetSuiteID": null,
                            "CMNetSuiteID": null,
                            "CDNetSuiteID": null
                        });
                });

                // 09.08.2021: iterate through credit memo records from the input payload and create credit memos
                refundData.forEach((refund) => {

                    log.audit('MDIMKOV', '*** new cycle ***');
                    log.debug('refund', refund);

                    const integrationID = refund.Refund.IntegrationID;
                    let customerRefundId = null;
                    let creditMemoId = null;
                    let customerDepositId = null;

                    try {

                        // MDIMKOV 09.08.2021: check if a credit note or a customer deposit needs to be created first
                        const raiseCreditNote = refund.RefundCreditNote.RaiseCreditNote;
                        const raiseCashReceipt = refund.RefundCustomerDeposit.RaiseCashReceipt;
                        log.debug('raiseCreditNote', raiseCreditNote);
                        log.debug('raiseCashReceipt', raiseCashReceipt);

                        if (raiseCreditNote) {
                            // MDIMKOV 09.08.2021: a credit memo needs to be created before creating the refund
                            log.audit('MDIMKOV', 'start creating a credit memo...');

                            const creditMemo = record.create({
                                type: record.Type.CREDIT_MEMO,
                                isDynamic: true,
                                defaultValues: {
                                    entity: refund.RefundCreditNote.NetSuiteCustomerId
                                }
                            });

                            creditMemo.setValue('custbody_oro_21_integrid', refund.RefundCreditNote.IntegrationID);
                            creditMemo.setValue('custbody_oro_21_integrtype', refund.RefundCreditNote.IntegrationType);
                            creditMemo.setValue('trandate', refund.RefundCreditNote.PostingDate ? new Date(refund.RefundCreditNote.PostingDate) : new Date());
                            // creditMemo.setValue('currency', lib.currencyISOtoID(refund.RefundCreditNote.Currency));


                            creditMemo.selectNewLine({
                                sublistId: 'item'
                            });

                            creditMemo.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: refund.RefundCreditNote.CreditNoteItemID
                            });

                            creditMemo.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                value: refund.RefundCreditNote.Quantity
                            });

                            creditMemo.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'description',
                                value: refund.RefundCreditNote.CreditNoteDesc
                            });

                            creditMemo.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                value: -1, // custom price level
                            });

                            creditMemo.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: refund.RefundCreditNote.Amount
                            });

                            creditMemo.commitLine({
                                sublistId: 'item'
                            });


                            creditMemoId = creditMemo.save();
                            log.audit('creditMemoId', creditMemoId);


                        } else if (raiseCashReceipt) {
                            // MDIMKOV 09.08.2021: a customer deposit needs to be created before creating the refund
                            log.audit('MDIMKOV', 'start creating a customer deposit...');

                            const customerDeposit = record.create({
                                type: record.Type.CUSTOMER_DEPOSIT,
                                defaultValues: {
                                    entity: refund.RefundCustomerDeposit.NetSuiteCustomerId
                                }
                            });

                            customerDeposit.setValue('paymentmethod', 5);
                            customerDeposit.setValue('custbody_oro_21_integrid', refund.RefundCustomerDeposit.IntegrationID);
                            customerDeposit.setValue('custbody_oro_21_integrtype', refund.RefundCustomerDeposit.IntegrationType);
                            customerDeposit.setValue('payment', refund.RefundCustomerDeposit.Amount);
                            customerDeposit.setValue('trandate', refund.RefundCustomerDeposit.PostingDate ? new Date(refund.RefundCustomerDeposit.PostingDate) : new Date());
                            customerDeposit.setValue('currency', lib.currencyISOtoID(refund.RefundCustomerDeposit.Currency));
                            // customerDeposit.setValue('undepfunds', true);

                            customerDepositId = customerDeposit.save();
                            log.audit('customerDepositId', customerDepositId);

                        }

                        /* MDIMKOV 09.08.2021: create the customer refund based on these 3 scenarios:
                            =1= if raiseCreditNote and raiseCashReceipt are set to false, just create a customer refund and apply anything available to it
                            =2= if raiseCreditNote is set to true, create a customer refund and apply only the newly-created credit note to it
                            =3= if raiseCashReceipt is set to true, create a customer refund and apply only the newly-created customer deposit to it
                         */

                        log.audit('MDIMKOV', 'start creating a customer refund header...');

                        // MDIMKOV 10.08.2021: create the refund with default values, so that the
                        const customerRefund = record.create({
                            type: record.Type.CUSTOMER_REFUND,
                            isDynamic: true,
                            defaultValues: {
                                entity: refund.Refund.NetSuiteCustomerId
                            }
                        });
                        customerRefund.setValue('custbody_oro_21_integrid', refund.Refund.IntegrationID);
                        customerRefund.setValue('custbody_oro_21_integrtype', refund.Refund.IntegrationType);
                        customerRefund.setValue('transactionnumber', refund.Refund.RefundNumber);
                        customerRefund.setValue('account', lib.findAccountByNumber(refund.Refund.BankAccount));
                        customerRefund.setValue('aracct', lib.findAccountByNumber(refund.Refund.ARAccount));
                        customerRefund.setValue('total', refund.Refund.Amount);
                        customerRefund.setValue('currency', lib.currencyISOtoID(refund.Refund.Currency));
                        customerRefund.setValue('trandate', refund.Refund.PostingDate ? new Date(refund.Refund.PostingDate) : new Date());
                        customerRefund.setValue('paymentmethod', 1); // cash

                        lib.longLog('debug', 'customerRefund-long', JSON.stringify(customerRefund));

                        const iApplyLinesCount = customerRefund.getLineCount({sublistId: 'apply'});       // credit memos
                        const iDepositLinesCount = customerRefund.getLineCount({sublistId: 'deposit'});   // deposits

                        log.debug('iApplyLinesCount', iApplyLinesCount);
                        log.debug('iDepositLinesCount', iDepositLinesCount);

                        // MDIMKOV 11.08.2021: scenario =1= if raiseCreditNote and raiseCashReceipt are set to false, just create a customer refund and apply anything available to it
                        if (!raiseCreditNote && !raiseCashReceipt) {
                            log.audit('MDIMKOV', 'continue creating customer refund (stand-alone) ...');

                            const initialAmount = refund.Refund.Amount; // the initial amount to be applied
                            let amountApplied = 0; // nothing applied so far
                            let amountRemaining = initialAmount; // what remains to be applied for this customer refund
                            let amountToApply = 0; // the amount that can be current applied to the respective line


                            for (var j = 0; j < iApplyLinesCount; j++) {
                                // MDIMKOV 10.08.2021: start applying amounts, beginning with the credit memos

                                log.debug('MDIMKOV', 'j=' + j + ' -------------');

                                if (amountRemaining === 0) {
                                    break;
                                }

                                const totalOnLine = customerRefund.getSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'due',
                                    line: j
                                });
                                log.debug('totalOnLine', totalOnLine);

                                if (amountRemaining > totalOnLine) {
                                    amountToApply = totalOnLine;
                                } else {
                                    amountToApply = amountRemaining;
                                }

                                customerRefund.selectLine({
                                    sublistId: 'apply',
                                    line: j
                                });

                                customerRefund.setCurrentSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'apply',
                                    value: true,
                                    line: j
                                });

                                customerRefund.setCurrentSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'amount',
                                    value: amountRemaining,
                                    line: j
                                });

                                customerRefund.commitLine({
                                    sublistId: 'apply'
                                });

                                amountApplied = amountApplied + amountToApply;
                                amountRemaining = initialAmount - amountApplied;

                            }

                            if (amountApplied < initialAmount) {
                                // MDIMKOV 10.08.2021: all credit memos exhausted, proceed with customer deposits

                                for (var i = 0; i < iDepositLinesCount; i++) {

                                    log.debug('MDIMKOV', '>> i=' + i + ' -------------');
                                    log.debug('amountApplied - before', amountApplied);
                                    log.debug('amountRemaining - before', amountRemaining);
                                    log.debug('amountToApply - before', amountToApply);

                                    if (amountRemaining === 0) {
                                        break;
                                    }

                                    const totalOnLine = customerRefund.getSublistValue({
                                        sublistId: 'deposit',
                                        fieldId: 'remaining',
                                        line: i
                                    });
                                    log.debug('totalOnLine', totalOnLine);

                                    if (amountRemaining > totalOnLine) {
                                        amountToApply = totalOnLine;
                                    } else {
                                        amountToApply = amountRemaining;
                                    }

                                    customerRefund.selectLine({
                                        sublistId: 'deposit',
                                        line: i
                                    });

                                    customerRefund.setCurrentSublistValue({
                                        sublistId: 'deposit',
                                        fieldId: 'apply',
                                        value: true,
                                        line: i
                                    });

                                    customerRefund.setCurrentSublistValue({
                                        sublistId: 'deposit',
                                        fieldId: 'amount',
                                        value: amountRemaining,
                                        line: i
                                    });

                                    customerRefund.commitLine({
                                        sublistId: 'deposit'
                                    });

                                    amountApplied = amountApplied + amountToApply;
                                    amountRemaining = initialAmount - amountApplied;


                                    log.debug('amountApplied - after', amountApplied);
                                    log.debug('amountRemaining - after', amountRemaining);
                                    log.debug('amountToApply - after', amountToApply);
                                    log.debug('MDIMKOV', '<< i=' + i + ' -------------');

                                }

                            }

                            if (amountApplied === initialAmount) {

                                customerRefundId = customerRefund.save();
                                log.audit('customerRefundId', customerRefundId);
                                declareStatus(returnObj.Refunds, integrationID, 'HK', '', customerRefundId, creditMemoId, customerDepositId);

                            } else {

                                log.audit('MDIMKOV', 'The total amount on transactions to apply is less than the refund amount.');
                                declareStatus(returnObj.Refunds, integrationID, 'ER',
                                    'The total amount on transactions to apply is less than the refund amount.',
                                    null, null, null);

                            }

                        } else if (raiseCreditNote && creditMemoId) {
                            // MDIMKOV 11.08.2021: scenario =2= if raiseCreditNote is set to true, create a customer refund and apply only the newly-created credit note to it
                            log.audit('MDIMKOV', 'continue creating customer refund (on top of credit memo) ...');

                            for (var j = 0; j < iApplyLinesCount; j++) {

                                const transToApplyId = customerRefund.getSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'internalid',
                                    line: j
                                });
                                log.debug('transToApplyId', transToApplyId);
                                log.debug('creditMemoId', creditMemoId);

                                // MDIMKOV 11.08.2021: apply the newly-created credit memo to the customer refund
                                if (transToApplyId == creditMemoId) {

                                    customerRefund.selectLine({
                                        sublistId: 'apply',
                                        line: j
                                    });

                                    customerRefund.setCurrentSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'apply',
                                        value: true,
                                        line: j
                                    });

                                    customerRefund.commitLine({
                                        sublistId: 'apply'
                                    });

                                    customerRefundId = customerRefund.save();
                                    log.audit('customerRefundId', customerRefundId);
                                    declareStatus(returnObj.Refunds, integrationID, 'HK', '', customerRefundId, creditMemoId, customerDepositId);

                                    break;

                                }

                            }

                            if (creditMemoId && !customerRefundId) {
                                log.error('MDIMKOV', 'created credit memo but could not apply it to customer refund, so no customer refund created');
                                declareStatus(returnObj.Refunds, integrationID, 'ER', 'created credit memo but could not apply it to customer refund, so no customer refund created', customerRefundId, creditMemoId, customerDepositId)
                            }

                        } else if (raiseCashReceipt && customerDepositId) {
                            // MDIMKOV 11.08.2021: =3= if raiseCashReceipt is set to true, create a customer refund and apply only the newly-created customer deposit to it
                            log.audit('MDIMKOV', 'continue creating customer refund (on top of customer deposit) ...');

                            for (var i = 0; i < iDepositLinesCount; i++) {

                                const transToApplyId = customerRefund.getSublistValue({
                                    sublistId: 'deposit',
                                    fieldId: 'doc',
                                    line: i
                                });
                                log.debug('transToApplyId', transToApplyId);
                                log.debug('customerDepositId', customerDepositId);

                                // MDIMKOV 11.08.2021: apply the newly-created credit memo to the customer refund
                                if (transToApplyId == customerDepositId) {

                                    customerRefund.selectLine({
                                        sublistId: 'deposit',
                                        line: i
                                    });

                                    customerRefund.setCurrentSublistValue({
                                        sublistId: 'deposit',
                                        fieldId: 'apply',
                                        value: true,
                                        line: i
                                    });

                                    customerRefund.commitLine({
                                        sublistId: 'deposit'
                                    });

                                    customerRefundId = customerRefund.save();
                                    log.audit('customerRefundId', customerRefundId);
                                    declareStatus(returnObj.Refunds, integrationID, 'HK', '', customerRefundId, creditMemoId, customerDepositId);

                                    break;

                                }

                            }

                            if (customerDepositId && !customerRefundId) {
                                log.error('MDIMKOV', 'created customer deposit but could not apply it to customer refund, so no customer refund created');
                                declareStatus(returnObj.Refunds, integrationID, 'ER', 'created customer deposit but could not apply it to customer refund, so no customer refund created', customerRefundId, creditMemoId, customerDepositId)
                            }

                        }


                    } catch (e) {

                        log.error('ERROR', e.message + ' --- ' + e.stack);

                        // MDIMKOV 09.08.2021: adding refund FAILED, add the failed entry to the return object
                        declareStatus(returnObj.Refunds, integrationID, 'ER', e.message + ' --- ' + e.stack, null, null, null);

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


        // MDIMKOV 11.08.2021: this function changes the transaction output JSON status, declaring success or failure
        function declareStatus(obj, integrId, status, message, rfNetSuiteID, cmNetSuiteID, cdNetSuiteID) {

            // MDIMKOV 16.06.2021: find the element to be updated in the output JSON
            const objIndex = obj.findIndex((obj => obj.IntegrationID === integrId));

            // MDIMKOV 24.06.2021: if the error message was due to Script Execution Usage Limit Exceeded, the entries need to be returned as not processed
            if (!message || !message.includes('Script Execution Usage Limit Exceeded')) {

                // MDIMKOV 16.06.2021: update the respective output array element with success/failure status
                obj[objIndex].Status = status;
                obj[objIndex].ProcessedDate = new Date();
                obj[objIndex].ErrorMessage = message;
                obj[objIndex].RFNetSuiteID = rfNetSuiteID;
                obj[objIndex].CMNetSuiteID = cmNetSuiteID;
                obj[objIndex].CDNetSuiteID = cdNetSuiteID;

            }

        }

        return {get, put, post, delete: doDelete}

    })
;
