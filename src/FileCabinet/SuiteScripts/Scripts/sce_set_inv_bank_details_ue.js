/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'SuiteScripts/_Libraries/_lib.js'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{_lib} _lib
     */
    (record, search, _lib) => {

        /* MDIMKOV 26.04.2023: this UE script, deployed on invoice, triggering on afterSubmit, performs the following:
             - checks for the subsidary and currency on the invoice
             - checks for an existing record in the [SCE Invoice Bank Details] record type for this subsidiary-currency combination
             - stamps the values for IBAN, BIC etc. (bank details) from the custom record type on the sales invoice
        * */


        // MDIMKOV 26.04.2023: this function gets the bank details from the custom record type
        function getBankDetails(subsidiaryId, currencyId) {
            const bankDetailsId = _lib.singleRecordSearch('customrecord_sce_inv_bank_details',
                [['custrecord_sce_ibd_subsidiary', 'anyof', subsidiaryId], 'AND', ['custrecord_sce_ibd_currency', 'anyof', currencyId]], 'internalid')

            log.debug('MDIMKOV', 'bankDetailsId: ' + bankDetailsId);

            let bankDetailsObj = null;

            // MDIMKOV 26.04.2023: construct the object to be returned
            if (bankDetailsId) {
                const recBankDetails = record.load({
                    type: 'customrecord_sce_inv_bank_details',
                    id: bankDetailsId
                });

                const iban = recBankDetails.getValue('custrecord_sce_ibd_iban');
                const bic = recBankDetails.getValue('custrecord_sce_ibd_bic');
                const sortcode = recBankDetails.getValue('custrecord_sce_ibd_sortcode');
                const bsb = recBankDetails.getValue('custrecord_sce_ibd_bsb');
                const bankname = recBankDetails.getValue('custrecord_sce_ibd_bankname');
                const bankaddr = recBankDetails.getValue('custrecord_sce_ibd_bankaddress');

                bankDetailsObj = {
                    'iban': iban,
                    'bic': bic,
                    'sortcode': sortcode,
                    'bsb': bsb,
                    'bankname': bankname,
                    'bankaddr': bankaddr
                }
                log.debug('MDIMKOV', 'bankDetailsObj: ' + bankDetailsObj);

            }

            return bankDetailsObj;
        }

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
            try {
                log.audit('MDIMKOV', '--- SCRIPT START ---');

                // MDIMKOV 26.04.2023: load the record again
                const rec = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id,
                    isDynamic: false
                });


                // MDIMKOV 02.05.2023: do not proceed if the [OVERRIDE BANK DETAILS] is clicked on the invoice record
                const isOverride = rec.getValue('custbody_sce_bd_overridebd');
                if (isOverride) {
                    return;
                }

                log.debug('MDIMKOV', 'rec: ' + rec);

                // MDIMKOV 26.04.2023: get the subsidiary and currency for the current record
                const subsidiaryId = rec.getValue('subsidiary');
                const currencyId = rec.getValue('currency');

                log.debug('MDIMKOV', 'subsidiaryId: ' + subsidiaryId);
                log.debug('MDIMKOV', 'currencyId: ' + currencyId);


                // MDIMKOV 26.04.2023: find if a record for this subsidiary and currency exists in the [SCE Invoice Bank Details] record type
                if (subsidiaryId && currencyId) {
                    const bankDetailsObject = getBankDetails(subsidiaryId, currencyId);

                    if (bankDetailsObject) {

                        // MDIMKOV 26.04.2023: set the bank details on the sales invoice
                        rec.setValue('custbody_sce_bd_iban', bankDetailsObject.iban);
                        rec.setValue('custbody_sce_bd_bic', bankDetailsObject.bic);
                        rec.setValue('custbody_sce_bd_sortcode', bankDetailsObject.sortcode);
                        rec.setValue('custbody_sce_bd_bsb', bankDetailsObject.bsb);
                        rec.setValue('custbody_sce_bd_bankname', bankDetailsObject.bankname);
                        rec.setValue('custbody_sce_bd_bankaddr', bankDetailsObject.bankaddr);

                        // MDIMKOV 26.04.2023: save the record
                        rec.save();
                    }
                }


                _lib.logGovernanceUsageRemaining('script end');
                log.audit('MDIMKOV', '--- SCRIPT END ---');
            } catch (e) {
                log.error('ERROR', e.message + ' --- ' + e.stack);
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
