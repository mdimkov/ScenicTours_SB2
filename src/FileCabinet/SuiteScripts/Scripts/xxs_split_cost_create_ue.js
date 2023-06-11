/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', './_lib'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{_lib} _lib
     */
    (record, search, _lib) => {

        /* MDIMKOV 06.05.2022: this UE script, deployed on [Vendor Bill], triggering on [afterSubmit] does the following:
             - only triggers if the respective field checkbox (custbody_xxs_takreate_flag) is set
             - this flag is being set by a workflow [Advanced Vendor Bill Approval] when button [Kosten Aufteilen] is clicked
             - when this is done, the script will create a new empty record from custom record type [Kostenaufteilung] for each line in the vendor bill
        * */

        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} context
         * @param {Record} context.newRecord - New record
         * @param {string} context.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} context.form - Current form
         * @param {ServletRequest} context.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (context) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} context
         * @param {Record} context.newRecord - New record
         * @param {Record} context.oldRecord - Old record
         * @param {string} context.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (context) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} context
         * @param {Record} context.newRecord - New record
         * @param {Record} context.oldRecord - Old record
         * @param {string} context.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (context) => {
            if (context.type != context.UserEventType.DELETE) {

                try {
                    log.audit('MDIMKOV', '--- SCRIPT START ---');

                    // MDIMKOV 08.05.2022: initialize main variables
                    const oldRec = context.oldRecord;
                    const newRec = context.newRecord;
                    const isOldFlag = oldRec ? oldRec.getValue('custbody_xxs_takreate_flag') : false; // in create context no old record
                    const isNewFlag = newRec.getValue('custbody_xxs_takreate_flag');
                    const lineSeqNum = newRec.getValue('linesequencenumber');
                    let k = 0;

                    if (isNewFlag && !isOldFlag) {
                        // MDIMKOV 08.05.2022: create a new [Kontenplan] empty record for each line on the vendor bill - ITEMS
                        const iLineCount = newRec.getLineCount({sublistId: 'item'});
                        for (let i = 0; i < iLineCount; i++) {
                            var recKA = record.create({
                                type: 'customrecord_xxs_kostenaufteilung'
                            });

                            recKA.setValue('custrecord_xxs_kostenaufteilung_vendbill', newRec.id);
                            recKA.setValue('custrecord_xxs_kostenaufteilung_position', i + 1);

                            totalAmount = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i
                            });

                            k = i + 1; // so that the expenses start from the next number

                            recKA.setValue('custrecord_xxs_kostenaufteilung_total', totalAmount ? totalAmount : 0);

                            recKA.save();
                        }

                        // MDIMKOV 08.05.2022: create a new [Kontenplan] empty record for each line on the vendor bill - EXPENSES
                        const iLineCountExp = newRec.getLineCount({sublistId: 'expense'});
                        for (let j = 0; j < iLineCountExp; j++) {
                            var recKA = record.create({
                                type: 'customrecord_xxs_kostenaufteilung'
                            });

                            recKA.setValue('custrecord_xxs_kostenaufteilung_vendbill', newRec.id);
                            recKA.setValue('custrecord_xxs_kostenaufteilung_position', j + k + 1);

                            totalAmount = newRec.getSublistValue({
                                sublistId: 'expense',
                                fieldId: 'amount',
                                line: j
                            });

                            recKA.setValue('custrecord_xxs_kostenaufteilung_total', totalAmount ? totalAmount : 0);

                            recKA.save();
                        }
                    }

                    log.audit('MDIMKOV', '--- SCRIPT END ---');
                } catch (e) {
                    log.error('ERROR', e.message + ' --- ' + e.stack);
                }
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
