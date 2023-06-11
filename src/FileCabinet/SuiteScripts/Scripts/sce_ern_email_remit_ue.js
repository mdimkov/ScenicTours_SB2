/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/log', 'N/error', 'N/https', 'N/url', 'N/runtime', 'N/record', 'N/search', 'SuiteScripts/_Libraries/_lib.js'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{_lib} _lib
     */
    (serverwidget, log, error, https, url, runtime, record, search, _lib) => {

        /* MDIMKOV 28.05.2023: This UE script, deployed on [Payment File Administration] record, triggering on [beforeLoad]:
         - displays a button for sending out remittance notices
         - calls the undeployed client script file [sce_ern_email_remit_cl.js], which then calls a SL+MR for sending out remittance notices
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
            try {
                log.audit('MDIMKOV', '--- SCRIPT START ---');

                if (context.type === 'view') {
                    const ifform = context.form;

                    var tranid = context.newRecord.id;
                    log.debug('tranid', tranid);

                    ifform.clientScriptModulePath = './sce_ern_email_remit_cs.js';

                    ifform.addButton({
                        id: 'custpage_send_remittance',
                        label: 'Remittance Notices',
                        functionName: "transactionButton('" + tranid + "', '" + 'print' + "')"
                    });


                    log.debug({title: 'status', detail: 'success'})
                }

                _lib.logGovernanceUsageRemaining('script end');
                log.audit('MDIMKOV', '--- SCRIPT END ---');
            } catch (e) {
                log.error('ERROR', e.message + ' --- ' + e.stack);
            }
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

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
