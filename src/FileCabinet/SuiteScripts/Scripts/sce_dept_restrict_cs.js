/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/dialog', 'N/currentRecord'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{dialog} dialog
     * @param{currentRecord} currentRecord
     */
    (record, search, dialog, currentRecord) => {

        /* MDIMKOV 01.02.2023: this client script, firing on fieldChanged, deployed on several transaction types, performs the following:
        *   - triggers when any department field (on header or on a line) is changed
        *   - prevents the user from changing the field, if the department used does not have a parent department
        * */

        // MDIMKOV 02.02.2023: this function checks if the respective department has a parent department and raises the error message
        function checkParentDepartment(departmentId) {

            // MDIMKOV 08.02.2023: handle a case when the department is blank
            if (!departmentId) {
                return true;
            }

            const fullDepartmentName = search.lookupFields({
                type: 'department',
                id: departmentId,
                columns: ['name']
            }).name;

            log.debug('MDIMKOV', 'fullDepartmentName: ' + fullDepartmentName);

            if (!fullDepartmentName.includes(' : ')) {
                dialog.alert({
                    title: 'Error',
                    message: 'You should not use header departments. Please select a different department.'
                });

                // MDIMKOV 07.02.2023: prevent user from leaving
                return false;
            } else {
                return true;
            }
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
        function pageInit(context) {

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
                log.debug('MDIMKOV', '');
                log.debug('MDIMKOV', '--- fieldChanged START ---');

                // MDIMKOV 01.02.2023: initialize main variables
                const rec = currentRecord.get();
                const fieldId = context.fieldId;
                const sublistName = context.sublistId;

                // MDIMKOV 01.02.2023: check if this is the department field on the lines
                if (sublistName && fieldId == 'department') {
                    const lineDepartmentId = rec.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'department'
                    })
                    log.debug('MDIMKOV', 'lineDepartmentId: ' + lineDepartmentId);

                    // MDIMKOV 07.02.2023: only display message, do not prevent user, this will be done in the preSave function
                    checkParentDepartment(lineDepartmentId);

                    // MDIMKOV 02.02.2023: check if this is the department field on the body
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
            try {
                log.debug('MDIMKOV', '');
                log.debug('MDIMKOV', '--- validateField START ---');

                // MDIMKOV 01.02.2023: initialize main variables
                const rec = currentRecord.get();
                const fieldId = context.fieldId;
                const sublistName = context.sublistId;

                // MDIMKOV 01.02.2023: check if this is the department field on the header
                if (fieldId == 'department' && !sublistName) {
                    const headerDepartmentId = rec.getValue('department');
                    log.debug('MDIMKOV', 'headerDepartmentId: ' + headerDepartmentId);

                    // MDIMKOV 07.02.2023: display message AND prevent user from switching to another field
                    return checkParentDepartment(headerDepartmentId);
                } else {
                    return true;
                }

                log.debug('MDIMKOV', '--- validateField END ---');
            } catch (e) {
                log.error('ERROR', e.message + ' --- ' + e.stack);
            }
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
            try {
                log.debug('MDIMKOV', '--- saveRecord START ---');

                // MDIMKOV 07.02.2023: since validateField doesn't always work on sublist fields, prevent the user from navigating on saveRecord
                const rec = currentRecord.get();
                const iLineCount = rec.getLineCount({sublistId: 'item'});
                let returnVal = true;

                for (let i = 0; i < iLineCount; i++) {

                    rec.selectLine({
                        sublistId: 'item',
                        line: i
                    });

                    const lineDepartmentId = rec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'department'
                    });
                    log.debug('MDIMKOV', 'lineDepartmentId: ' + lineDepartmentId);

                    if (!checkParentDepartment(lineDepartmentId)) {
                        log.debug('MDIMKOV', '... line ' + i + ' has wrong department');
                        returnVal = false;
                    }
                }

                log.debug('MDIMKOV', 'returnVal is ' + returnVal);
                return returnVal;

                log.debug('MDIMKOV', '--- saveRecord END ---');
            } catch (e) {
                log.error('ERROR', e.message + ' --- ' + e.stack);
                return true; // if there's a problem, for example a permission violation, return true
            }

        }

        return {
            // pageInit: pageInit,
            fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            saveRecord: saveRecord
        };

    });
