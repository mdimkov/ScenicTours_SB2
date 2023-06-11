/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', './_lib', 'N/ui/message'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{_lib} _lib
     * @param{message} message
     */
    (record, search, _lib, message) => {

        /* MDIMKOV 21.04.2022: this client script, deployed on [customrecord_xxs_kostenaufteilung], firing on pageInit and fieldChanged, performs the following:
         - checks the related parent record (bill) and the respective bill line (1-index based)
         - then, gets the amount from the respective bill line and inserts it into the [custrecord_xxs_kostenaufteilung_total] field
         - gets the amount split so far (entered so far by the user) and enters it in the [custrecord_xxs_kostenaufteilung_assigned] field
         - on [saveRecord] prevents the user from saving the record if the assigned amount is more than the total
        * */

        // MDIMKOV 06.05.2022: this function raises an error message (used during [saveRecord])
        function showMessage(msgText) {
            var myMsg = message.create({
                title: "Assigned Amount Higher Than Total",
                message: msgText,
                type: message.Type.ERROR //or any other type: such as .INFORMATION, .CONFIRMATION, .WARNING
            });

            myMsg.show({
                duration: 8000
            });
        }

        // MDIMKOV 06.05.2022: this function does most of the job
        function calcAndSetAssignedAmount(context) {

            const rec = context.currentRecord;

            // MDIMKOV 21.04.2022: calculate the sum of all amount fileds (1 through 10)
            let amountAssigned = 0;
            for (let i = 1; i <= 10; i++) {

                // MDIMKOV 21.04.2022: each amount field is suffixed with 1, 2, 3 -- this is achieved with the +i below
                amountAssigned += rec.getValue('custrecord_xxs_kostenaufteilung_amount' + i);

            }

            rec.setValue('custrecord_xxs_kostenaufteilung_assigned', amountAssigned);

        }

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(context) { // ##
            try {
                log.audit('MDIMKOV', '--- pageInit START ---');

                // MDIMKOV 21.04.2022: declare main variables
                const rec = context.currentRecord;
                const parentTransId = rec.getValue('custrecord_xxs_kostenaufteilung_vendbill');
                const parentTransLineNum = rec.getValue('custrecord_xxs_kostenaufteilung_position');
                let totalAmount = 0;

                log.debug('MDIMKOV', 'parentTransId: ' + parentTransId);
                log.debug('MDIMKOV', 'parentTransLineNum: ' + parentTransLineNum);

                // MDIMKOV 21.04.2022: get the line amount from the source transaction line (Note: line number in field [custrecord_xxs_kostenaufteilung_position] is 1-index based)
                if (parentTransId && parentTransLineNum > 0) {
                    const transRec = record.load({
                        type: record.Type.VENDOR_BILL,
                        id: parentTransId,
                        isDynamic: true
                    });

                    totalAmount = transRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: parentTransLineNum - 1
                    });

                    // MDIMKOV 21.04.2022: stamp the amount in the [Total] field
                    rec.setValue('custrecord_xxs_kostenaufteilung_total', totalAmount);
                }

                // MDIMKOV 21.04.2022: finally, calculate the assigned amount on pageInit; it will be re-calculated on fieldChanged again later
                calcAndSetAssignedAmount(context);

                log.debug('MDIMKOV', '--- pageInit END ---');
            } catch (e) {
                log.error('ERROR', e.message + ' --- ' + e.stack);
            }
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.sublistId - Sublist name
         * @param {string} context.fieldId - Field name
         * @param {number} context.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} context.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(context) {
            try {
                log.debug('MDIMKOV', '--- fieldChanged START ---');

                const fieldId = context.fieldId;

                log.debug('fieldId', fieldId);

                if (fieldId.startsWith('custrecord_xxs_kostenaufteilung_amount') || fieldId == 'custrecord_xxs_kostenaufteilung_position') { // triggers on any of the 10 amount fields

                    log.audit('MDIMKOV', 'Proceed with fieldChanged logic...');

                    calcAndSetAssignedAmount(context);

                    const rec = context.currentRecord;
                    const parentTransId = rec.getValue('custrecord_xxs_kostenaufteilung_vendbill');
                    const parentTransLineNum = rec.getValue('custrecord_xxs_kostenaufteilung_position');


                    let totalAmount = 0;

                    if (parentTransId && parentTransLineNum > 0) {

                        const transRec = record.load({
                            type: record.Type.VENDOR_BILL,
                            id: parentTransId,
                            isDynamic: true
                        });

                        totalAmount = transRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: parentTransLineNum - 1
                        });

                        // MDIMKOV 21.04.2022: stamp the amount in the [Total] field
                        rec.setValue('custrecord_xxs_kostenaufteilung_total', totalAmount);
                    }
                }

                log.debug('MDIMKOV', '--- fieldChanged END ---');
            } catch (e) {
                log.error('ERROR', e.message + ' --- ' + e.stack);
            }
        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.sublistId - Sublist name
         * @param {string} context.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(context) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(context) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(context) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.sublistId - Sublist name
         * @param {string} context.fieldId - Field name
         * @param {number} context.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} context.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(context) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(context) {

        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(context) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(context) {

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(context) {

            // MDIMKOV 06.05.2022: check if assigned amount is more than total, raise message and prevent the user from saving the record
            const rec = context.currentRecord;
            const total = rec.getValue('custrecord_xxs_kostenaufteilung_total');
            const assigned = rec.getValue('custrecord_xxs_kostenaufteilung_assigned');
            if (assigned > total) {
                showMessage('Assigned amount should not be more than the total amount.');
                return false;
            } else {
                return true;
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            saveRecord: saveRecord
        };

    });
