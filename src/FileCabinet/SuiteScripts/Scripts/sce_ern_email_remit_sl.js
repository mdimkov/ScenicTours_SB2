/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/cache', 'N/url', 'N/runtime', './_lib', 'N/render', 'N/task'],
    /**
     * @param{format} format
     * @param{record} record
     * @param{search} search
     * @param{ui} ui
     * @param{cache} cache
     * @param{url} url
     * @param{runtime} runtime
     * @param{_lib} _lib
     * @param{render} render
     * @param{task} task
     */
    function (format, record, search, ui, cache, url, runtime, _lib, render, task) {

        /* MDIMKOV 28.05.2023: this suitelet performs the following:
            - is being triggered by client script file [sce_ern_email_remit_cs.js]
            - triggers M/R [sce_ern_email_remit_mr.js], which sends out remittance notices
            - it lists all payment records associated to the calling [Payment File Administration] record
            - gives the user the possibility to choose which ones to be sent out to vendors
         * */


        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         * @param date
         */


        function onRequest(context) {
            if (context.request.method === 'GET') { // ##

                try {
                    log.audit('MDIMKOV', '--- GET START ---');

                    // MDIMKOV 28.05.2023: get the PFA record id
                    const tranId = context.request.parameters.tranid;
                    log.debug('MDIMKOV', 'tranId: ' + tranId);

                    log.audit('MDIMKOV', '--- STEP 1 (select payment records to send email messages for) ---');

                    // MDIMKOV 28.05.2023: cache the next step of the process; in the POST method this will redirect the user to the respective page
                    var myCache = cache.getCache({
                        name: 'emailRemitNotif' + _lib.getCurrentUserId(),
                        scope: cache.Scope.PRIVATE
                    });

                    myCache.put({key: 'step', value: 2});

                    var form = ui.createForm({
                        title: 'Select Payment Records',
                        hideNavBar: false
                    });


                    form.addFieldGroup({
                        id: 'fieldgroup_id',
                        label: 'Please select the transactions related to this mail out'
                    });


                    // MDIMKOV 28.05.2023: add a sublist that will list the applicable payment transactions lines based on a saved search
                    var sublist = form.addSublist({
                        id: 'sublist',
                        type: ui.SublistType.LIST,
                        label: 'Select Payments'
                    });


                    // MDIMKOV 28.05.2023: add all fields to the list
                    let check = sublist.addField({id: 'field_select', type: ui.FieldType.CHECKBOX, label: 'Select'});
                    check.updateDisplayType({displayType: ui.FieldDisplayType.ENTRY});

                    sublist.addField({id: 'field_pmtdate', type: ui.FieldType.TEXT, label: 'Payment Date'});
                    sublist.addField({id: 'field_docno', type: ui.FieldType.TEXT, label: 'Doc. Num.'});
                    sublist.addField({id: 'field_name', type: ui.FieldType.TEXT, label: 'Name'});

                    let emailField = sublist.addField({id: 'field_email', type: ui.FieldType.TEXT, label: 'Email'});
                    emailField.updateDisplayType({displayType: ui.FieldDisplayType.ENTRY});
                    emailField.updateDisplaySize({
                        height : 60,
                        width : 50
                    })

                    sublist.addField({id: 'field_currency', type: ui.FieldType.TEXT, label: 'Currency'});
                    sublist.addField({id: 'field_amount', type: ui.FieldType.TEXT, label: 'Amount'});
                    sublist.addField({id: 'field_internalid', type: ui.FieldType.TEXT, label: 'Id'});


                    // MDIMKOV 28.05.2023: add the results from a saved search
                    const transactionSearchObj = search.create({
                        type: 'transaction',
                        filters:
                            [
                                ['custbody_9997_pfa_record', 'anyof', tranId],
                                'AND',
                                ['mainline', 'is', 'T']
                            ],
                        columns:
                            [
                                'trandate',
                                'tranid',
                                'entity',
                                'vendor.email',
                                'currency',
                                search.createColumn({
                                    name: 'formulacurrency',
                                    formula: 'NVL({amount}, 0) * -1'
                                }),
                                'internalid'
                            ]
                    });


                    const transLineSearchCount = transactionSearchObj.runPaged().count;
                    log.debug('transLineSearchCount', transLineSearchCount);

                    let iLine = 0;

                    transactionSearchObj.run().each(function (result) {                     // select box
                        sublist.setSublistValue({
                            id: 'field_select',
                            line: iLine,
                            value: 'T'
                        });
                        !result.getValue(result.columns[0]) || sublist.setSublistValue({    // document date
                            id: 'field_pmtdate',
                            line: iLine,
                            value: result.getValue(result.columns[0])
                        });
                        !result.getValue(result.columns[1]) || sublist.setSublistValue({   // document number
                            id: 'field_docno',
                            line: iLine,
                            value: result.getValue(result.columns[1])
                        });
                        !result.getText(result.columns[2]) || sublist.setSublistValue({    // vendor name
                            id: 'field_name',
                            line: iLine,
                            value: result.getText(result.columns[2])
                        });
                        !result.getValue(result.columns[3]) || sublist.setSublistValue({    // email address
                            id: 'field_email',
                            line: iLine,
                            value: result.getValue(result.columns[3])
                        });
                        !result.getText(result.columns[4]) || sublist.setSublistValue({     // currency
                            id: 'field_currency',
                            line: iLine,
                            value: result.getText(result.columns[4])
                        });
                        !result.getValue(result.columns[5]) || sublist.setSublistValue({    // amount
                            id: 'field_amount',
                            line: iLine,
                            value: result.getValue(result.columns[5])
                        });
                        !result.getValue(result.columns[6]) || sublist.setSublistValue({   // internal id
                            id: 'field_internalid',
                            line: iLine,
                            value: result.getValue(result.columns[6])
                        });


                        iLine = iLine + 1;
                        return iLine < 1000;
                    });

                    form.addSubmitButton({label: 'Proceed'});

                    context.response.writePage(form);

                    log.audit('MDIMKOV', '--- GET END ---');

                } catch (e) {

                    log.error('ERROR (GET)', e.message + ' --- ' + e.stack);

                }

            } else { // POST operation ##

                try {

                    log.audit('MDIMKOV', '--- POST START ---');

                    // MDIMKOV 28.05.2023: get the current step (page) in the process by getting the 'step' value from the cache
                    var myCache = cache.getCache({
                        name: 'emailRemitNotif' + _lib.getCurrentUserId(),
                        scope: cache.Scope.PRIVATE
                    });

                    const postStep = myCache.get({key: 'step'});

                    if (postStep === '2') { // choose email template

                        log.audit('MDIMKOV', '--- STEP 2 (choose email template) ---');

                        // MDIMKOV 28.05.2023: create a string of payment ids selected, separated by commas; will be added to the cache and used in the last step
                        let pmtIdsString = '';
                        let emailsString = '';

                        const lines = context.request.getLineCount({group: 'sublist'});
                        log.debug('lines', lines);

                        for (let i = 0; i < lines; i++) {

                            // MDIMKOV 28.05.2023: get which lines were selected and their respective internal ids
                            const field_select = context.request.getSublistValue({
                                group: 'sublist',
                                name: 'field_select',
                                line: i
                            });
                            const field_email = context.request.getSublistValue({
                                group: 'sublist',
                                name: 'field_email',
                                line: i
                            });
                            const field_internalid = context.request.getSublistValue({
                                group: 'sublist',
                                name: 'field_internalid',
                                line: i
                            });

                            // MDIMKOV 28.05.2023: if a line was selected, add the payment id to the string that it will be passed to the cache
                            // MDIMKOV 31.05.2023: also, add the remittance email address, to which the message will be sent, on the payment record
                            if (field_select == 'T' && field_email) {
                                pmtIdsString = pmtIdsString + field_internalid + ',';
                                emailsString = emailsString + field_email + ',';
                            }

                        }
                        log.debug('pmtIdsString', pmtIdsString);
                        log.debug('emailsString', emailsString);


                        // MDIMKOV 28.05.2023: instruct the user that no lines were selected and ask them to re-initiate the process
                        if (!pmtIdsString) {

                            var form = ui.createForm({
                                title: 'Mass Email Remittance Notifications',
                                hideNavBar: false
                            });
                            form.addFieldGroup({
                                id: 'fieldgroup_id',
                                label: 'Nothing was selected.'
                            });
                            var post_sendemails = form.addField({
                                id: 'custpage_preview',
                                type: ui.FieldType.INLINEHTML,
                                label: 'Message Preview',
                                container: 'fieldgroup_id'
                            });
                            post_sendemails.defaultValue = '<br>❌️&#160;FAILURE.<br><br>Nothing was selected. Please click BACK on your browser and select some payments for processing';

                            context.response.writePage(form);

                        } else {

                            // MDIMKOV 28.05.2023: this way the user will be redirected to page 3 on the next POST event later (with page 1 being the GET)
                            myCache.put({key: 'step', value: 3});

                            // MDIMKOV 28.05.2023: add the string with payment ids to be processed to the cache; in the last step they will be converted to an array and sent to the M/R
                            myCache.put({key: 'pmtIds', value: pmtIdsString});
                            myCache.put({key: 'emailIds', value: emailsString});

                            var form = ui.createForm({
                                title: 'Mass Email Remittance Notifications',
                                hideNavBar: false
                            });

                            // MDIMKOV 28.05.2023: add fields for email template selection and rich text addition
                            form.addFieldGroup({
                                id: 'fieldgroup_id',
                                label: 'Please select an email template and the text you wish to add to the email'
                            });
                            var post_template = form.addField({
                                id: 'custpage_custmessage',
                                type: ui.FieldType.RICHTEXT,
                                label: 'Add Additional Message',
                                container: 'fieldgroup_id'
                            });

                            form.addSubmitButton({label: 'Proceed'});

                            context.response.writePage(form);

                        }

                    } else if (postStep === '3') { // confirmation before sending out the messages

                        log.audit('MDIMKOV', '--- STEP 3 (confirmation before sending out the messages) ---');

                        // MDIMKOV 28.05.2023: get the template and the customer message from the previous step
                        var additionalMessage = context.request.parameters['custpage_custmessage'];
                        additionalMessage = additionalMessage ? additionalMessage : 'None';

                        // MDIMKOV 28.05.2023: get the string with payment IDs and extract the first payment id
                        let paymentIdsArrayRaw = myCache.get({key: 'pmtIds'});
                        var firstPaymentId = parseInt(paymentIdsArrayRaw.substr(0, paymentIdsArrayRaw.indexOf(',')));
                        log.debug('firstPaymentId', firstPaymentId);

                        // MDIMKOV 28.05.2023: this way the user will be redirected to page 4 on the next POST event later (with page 1 being the GET)
                        myCache.put({key: 'step', value: 4});

                        var form = ui.createForm({
                            title: 'Mass Email Remittance Notifications',
                            hideNavBar: false
                        });


                        // MDIMKOV 28.05.2023: add last confirmation message before sending out the email messages
                        form.addFieldGroup({
                            id: 'fieldgroup_id',
                            label: 'Proceed with sending out the emails by clicking the Send Emails button above'
                        });


                        // MDIMKOV 28.05.2023: add the template ID and the customer message to the cache, so they can be used in the next step when sent to the M/R scripts to be processed to the cache
                        myCache.put({key: 'additionalMessage', value: additionalMessage});

                        form.addSubmitButton({label: 'Send Emails'});

                        context.response.writePage(form);

                    } else if (postStep === '4') { // run through lines and send email messages by calling a M/R script

                        log.audit('MDIMKOV', '--- STEP 4 (send messages by invoking a M/R script) ---');

                        // MDIMKOV 28.05.2023: get the template id and the customer message, so can be sent to the M/R script
                        const additionalMessage = myCache.get({key: 'additionalMessage'});

                        // MDIMKOV 28.05.2023: get the string with payment IDs; create an array of them, to be sent as input to the M/R script
                        let paymentIdsArrayRaw = myCache.get({key: 'pmtIds'}).split(',');
                        let paymentIdsArray = [];
                        paymentIdsArrayRaw.forEach(function (element) {
                            // ignore the last empty element and convert all IDs to integers
                            !element || paymentIdsArray.push(Number(element));
                        });
                        log.debug('paymentIdsArray', paymentIdsArray);


                        // MDIMKOV 28.05.2023: get the string with email addresses; create an array of them, to be sent as input to the M/R script
                        let emailsArrayRaw = myCache.get({key: 'emailIds'}).split(',');
                        let emailsArray = [];
                        emailsArrayRaw.forEach(function (element) {
                            // ignore the last empty element and convert all IDs to integers
                            !element || emailsArray.push(element);
                        });
                        log.debug('emailsArray', emailsArray);


                        // MDIMKOV 31.05.2023: merge payment IDs and emails into one object
                        const inputObject = [];

                        paymentIdsArray.forEach((paymentId, index) => {
                            const emailAddress = emailsArray[index];
                            const obj = {
                                paymentId: paymentId,
                                emailAddress: emailAddress
                            };
                            inputObject.push(obj);
                        });
                        log.debug('MDIMKOV', 'inputObject: ' + JSON.stringify(inputObject));


                        // MDIMKOV 28.05.2023: start creating the UI part of the last step
                        var form = ui.createForm({
                            title: 'Mass Email Remittance Notifications',
                            hideNavBar: false
                        });

                        // MDIMKOV 28.05.2023: add final confirmation message saying that the emails will be sent out in the background
                        form.addFieldGroup({
                            id: 'fieldgroup_id',
                            label: 'Email messages are being sent out in the background.'
                        });

                        // MDIMKOV 28.05.2023: send the JSON object to a map reduce script to preform the email send out (several deployments)
                        try {
                            var mrTask = task.create({taskType: task.TaskType.MAP_REDUCE});
                            mrTask.scriptId = 'customscript_sce_ern_email_remit_mr';
                            mrTask.deploymentId = 'customdeploy_sce_ern_email_remit_mr_1';
                            mrTask.params = {
                                'custscript_sce_inputobj': inputObject,
                                'custscript_sce_custmsg': additionalMessage
                            };
                            mrTask.submit();
                            log.audit('MDIMKOV', 'M/R deployment #1 will handle the request');
                        } catch (e) {
                            log.error('Could not trigger MR script 1: ' + e.name, e.message);
                            try {
                                var mrTask2 = task.create({taskType: task.TaskType.MAP_REDUCE});
                                mrTask2.scriptId = 'customscript_sce_ern_email_remit_mr';
                                mrTask2.deploymentId = 'customdeploy_sce_ern_email_remit_mr_2';
                                mrTask2.params = {
                                    'custscript_sce_inputobj': inputObject,
                                    'custscript_sce_custmsg': additionalMessage
                                };
                                mrTask2.submit();
                                log.audit('MDIMKOV', 'M/R deployment #2 will handle the request');
                            } catch (e) {
                                log.error('Could not trigger MR script 2: ' + e.name, e.message);
                                try {
                                    var mrTask3 = task.create({taskType: task.TaskType.MAP_REDUCE});
                                    mrTask3.scriptId = 'customscript_sce_ern_email_remit_mr';
                                    mrTask3.deploymentId = 'customdeploy_sce_ern_email_remit_mr_3';
                                    mrTask3.params = {
                                        'custscript_sce_inputobj': inputObject,
                                        'custscript_sce_custmsg': additionalMessage
                                    };
                                    mrTask3.submit();
                                    log.audit('MDIMKOV', 'M/R deployment #3 will handle the request');
                                } catch (e) {
                                    log.error('Could not trigger MR script 3: ' + e.name, e.message);
                                } // catch3
                            } // catch2
                        } // catch1


                        const post_sendemails = form.addField({
                            id: 'custpage_sendmails',
                            type: ui.FieldType.INLINEHTML,
                            label: 'Sending Email Messages',
                            container: 'fieldgroup_id'
                        });
                        post_sendemails.defaultValue = '<br>✔️&#160;SUCCESS.<br><br>Email messages are being sent out in the background.<br>You may close this page';

                        context.response.writePage(form);

                    }

                    log.audit('MDIMKOV', '--- POST END ---');

                } catch
                    (e) {

                    log.error('ERROR (POST)', e.message + ' --- ' + e.stack);

                }

            }

        }

        return {
            onRequest: onRequest
        };

    }
);
