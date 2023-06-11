/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/render', 'N/email', 'SuiteScripts/_Libraries/_lib.js'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     * @param{render} render
     * @param{email} email
     * @param{_lib} _lib
     */
    (record, search, runtime, render, email, _lib) => {

        /* MDIMKOV 28.05.2023: This MR script performs the following:
            - is being called by suitelt [sce_ern_email_remit_sl.js]
            - sends out remittance notices for each payment record id
        * */


        // MDIMKOV 31.05.2023: this function removes the hierarchy for the subsidiary name:
        function getTextAfterLastColon(text) {
            const lastIndex = text.lastIndexOf(" : ");
            if (lastIndex !== -1) {
                return text.substring(lastIndex + 3);
            }
            return "";
        }


        // MDIMKOV 31.05.2023: this function constructs the email body based on payment ID and additional message
        function constructEmailBody(paymentId) {

            // MDIMKOV 31.05.2023: load the payment record
            const rec = record.load({
                type: record.Type.VENDOR_PAYMENT,
                id: paymentId,
                isDynamic: true
            });

            const subsidiaryId = rec.getValue('subsidiary');

            const recSubsidiary = record.load({
                type : record.Type.SUBSIDIARY,
                id : subsidiaryId,
                isDynamic : true
            });

            const subsidiary = getTextAfterLastColon(_lib.getFieldValue('name', 'subsidiary', subsidiaryId));
            const subsidiaryAddress = recSubsidiary.getValue('mainaddress_text');
            const totalAmount = rec.getValue('total');
            const currency = rec.getText('currency');
            const supplier = rec.getText('entity');
            let date = rec.getValue('trandate');
            date = _lib.convertDateToFormat(date, 'dd/mm/yyyy');


            let xmlStr = '';
            xmlStr += '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            xmlStr += '<pdf>';
            xmlStr += '<head>';
            xmlStr += '<macrolist>';
            xmlStr += '<macro id="nlheader">';
            xmlStr += '<table class="header" style="width: 100%;"><tr>';
            xmlStr += '<td align="lefnt"></td>';
            xmlStr += '</tr></table>';
            xmlStr += '</macro>';
            xmlStr += '</macrolist>';
            xmlStr += '</head>';
            xmlStr += '<body header="nlheader" header-height="10%" padding="0.5in 0.5in 0.5in 0.5in" size="A4">';
            xmlStr += '<table style="width: 100%;">';

            xmlStr += '<tr>';
            xmlStr += '<td style="font-size: 16px;"><b>' + subsidiary + '</b></td>';
            xmlStr += '<td style="font-size: 16px;"><b>EFT Remittance Advice</b></td>';
            xmlStr += '</tr>';

            xmlStr += '<tr>';
            xmlStr += '<td style="font-size: 12px;">' + subsidiaryAddress + '</td>';
            xmlStr += '<td></td>';
            xmlStr += '</tr>';

            xmlStr += '<tr>';
            xmlStr += '<td><br/><br/><br/></td>';
            xmlStr += '<td><br/><br/><br/></td>';
            xmlStr += '</tr>';

            xmlStr += '<tr>';
            xmlStr += '<td style="font-size: 11px;">A payment has been remitted to your account as follows:</td>';
            xmlStr += '<td style="font-size: 11px;"><b>' + currency + ' ' + totalAmount + '</b></td>';
            xmlStr += '</tr>';

            xmlStr += '<tr>';
            xmlStr += '<td><br/></td>';
            xmlStr += '<td><br/></td>';
            xmlStr += '</tr>';

            xmlStr += '<tr>';
            xmlStr += '<td style="font-size: 11px;">Supplier: <b>' + supplier + '</b></td>';
            xmlStr += '<td></td>';
            xmlStr += '</tr>';

            xmlStr += '<tr>';
            xmlStr += '<td style="font-size: 11px;">Payment Date: ' + date + '</td>';
            xmlStr += '<td></td>';
            xmlStr += '</tr>';

            xmlStr += '<tr>';
            xmlStr += '<td><br/></td>';
            xmlStr += '<td><br/></td>';
            xmlStr += '</tr>';

            xmlStr += '</table>';


            xmlStr += '<table>';
            xmlStr += '<tr>';
            xmlStr += '<td style="font-size: 11px;"><b>Details: --------------------------------------------- </b></td>';
            xmlStr += '<td></td>';
            xmlStr += '<td></td>';
            xmlStr += '<td></td>';
            xmlStr += '</tr>';

            xmlStr += '<tr>';
            xmlStr += '<td><br/></td>';
            xmlStr += '<td><br/></td>';
            xmlStr += '<td><br/></td>';
            xmlStr += '<td><br/></td>';
            xmlStr += '</tr>';

            xmlStr += '<tr>';
            xmlStr += '<td style="font-size: 11px; width: 100px;">Document Number</td>';
            xmlStr += '<td style="font-size: 11px; width: 100px;">Document Date</td>';
            xmlStr += '<td style="font-size: 11px; width: 50px;">Currency</td>';
            xmlStr += '<td style="font-size: 11px; width: 100px;">Amount</td>';
            xmlStr += '</tr>';

            const iLineCount = rec.getLineCount({sublistId: 'apply'});
            for (let i = 0; i < iLineCount; i++) {

                rec.selectLine({
                    sublistId: 'apply',
                    line: i
                });

                const apply = rec.getCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'apply'
                });

                const refNo = rec.getCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'refnum'
                });

                let billDate = rec.getCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'applydate'
                });
                billDate = _lib.convertDateToFormat(billDate, 'dd/mm/yyyy');

                const pmtAmount = rec.getCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'amount'
                });

                if (apply) {
                    xmlStr += '<tr>';
                    xmlStr += '<td style="font-size: 11px;">' + refNo + '</td>';
                    xmlStr += '<td style="font-size: 11px;">' + billDate + '</td>';
                    xmlStr += '<td style="font-size: 11px;">' + currency + '</td>';
                    xmlStr += '<td style="font-size: 11px;">' + pmtAmount + '</td>';
                    xmlStr += '</tr>';
                }
            }

            xmlStr += '</table>';





            xmlStr += '</body>';
            xmlStr += '</pdf>';

            return xmlStr;
        }

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            try {

                log.audit('MDIMKOV', '--- getInputData START ---');

                // MDIMKOV 31.05.2023: get the input object from the script parameter (the suitelet sent it during M/R invokation)
                const scriptObj = runtime.getCurrentScript();
                const inputObj = JSON.parse(scriptObj.getParameter('custscript_sce_inputobj'));

                log.debug('inputObj', inputObj);

                return inputObj;

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);

            }
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            try {

                log.debug('MDIMKOV', '--- map START ---');
                log.debug('mapContext', mapContext);


                // MDIMKOV 31.05.2023: get the XML message input object from the script parameter (the suitelet sent it during M/R invokation)
                const scriptObj = runtime.getCurrentScript();
                const additionalMessage = scriptObj.getParameter('custscript_sce_custmsg');
                log.debug('additionalMessage', additionalMessage);


                // MDIMKOV 31.05.2023: get the payment ID and the email address
                const mapContextValue = JSON.parse(mapContext.value);
                const paymentId = mapContextValue.paymentId;
                const emailAddr = mapContextValue.emailAddress;
                log.debug('paymentId', 'paymentId: ' + paymentId);
                log.debug('emailAddr', 'emailAddr: ' + emailAddr);


                // MDIMKOV 31.05.2023: construct the PDF file
                const xmlContent = constructEmailBody(paymentId);
                var renderer = render.create();
                renderer.templateContent = xmlContent;
                const pdfFile = renderer.renderAsPdf();
                pdfFile.name = 'Remittance Notice.pdf';


                // MDIMKOV 31.05.2023: construct the email body
                let emailBody = '';
                emailBody += 'Please find enclosed your remittance advice.'

                if (additionalMessage !== 'None') {
                    emailBody += '\n\n';
                    emailBody += additionalMessage;
                }


                // MDIMKOV 31.05.2023: send the email message
                if (paymentId && emailAddr) {
                    const senderId = 9497; // Milcho
                    email.send({
                        author: senderId,
                        recipients: emailAddr,
                        subject: 'Remittance Notification',
                        body: emailBody,
                        attachments: [pdfFile]
                    });
                }

                log.debug('MDIMKOV', '--- map END ---');

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);

            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

            log.audit('MDIMKOV', '--- SCRIPT END ---');

        }

        return {getInputData, map, /*reduce,*/ summarize}

    });
