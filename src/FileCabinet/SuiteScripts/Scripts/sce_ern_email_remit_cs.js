/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/url', 'N/error'],
    /**
     * @param{https} https
     * @param{url} url
     * @param{error} error
     */
    (https, url, error) => {

        /* MDIMKOV 02.03.2023: This client script, undeployed:
            - is being called by [sce_ern_email_remit_ue.js] UE script on button click
            - triggers suitelet [sce_ern_email_remit_sl.js], which in turn, starts an M/R script for sending out remittance notices
        * */

        function transactionButton(tranid, button) {

            log.debug({title: 'CS-transactionButton: Status', details: 'Started'});
            var buttonParams = {'tranid': tranid};
            log.debug({title: 'CS-transactionButton: params', details: JSON.stringify(buttonParams)});

            var getUrl = url.resolveScript({
                scriptId: 'customscript_ern_email_remit_sl',
                deploymentId: 'customdeploy_ern_email_remit_sl',
                returnExternalUrl: true,
                params: buttonParams
            });

            log.debug({title: 'CS-transactionButton: URL', details: getUrl});
            try {
                if (button === 'print') {
                    window.open(getUrl);
                } else {
                    var response = https.get({url: getUrl});
                }
            } catch (e) {
                log.debug({title: 'CS-transactionButton: try error', details: e});
            }

            log.debug({title: 'CS-transactionButton: URL', details: 'Response Done'});
            window.location.reload(false);
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

        return {
            pageInit: pageInit,
            transactionButton: transactionButton
        };

    });
