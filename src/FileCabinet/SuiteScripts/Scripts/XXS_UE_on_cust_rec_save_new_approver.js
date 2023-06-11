/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record'],
    function(record) {

        function afterSubmit(context) {
            var currentRecord = context.newRecord;
            var billId = currentRecord.getValue({ fieldId: 'custrecord_xxs_genehmigerbill' });
            log.debug({ details: "vendor Bill Id = " + billId });
            var newApprover = currentRecord.getValue({ fieldId: 'custrecord_xxs_genehmigerneu' });
            log.debug({ details: "New Approver Id = " + newApprover });
            // var comment = currentRecord.getValue({ fieldId: 'custrecord_xxr_app_comment' });
            // log.debug({ details: "Comment= " + comment });
            var recordType = record.Type.VENDOR_BILL;

            var parentBill = record.load({
                type: recordType,
                id: billId,
                isDynamic: true
            });

            parentBill.setValue({
                fieldId: "nextapprover",
                value: newApprover
            });

            // var oldComment = parentBill.getValue({ fieldId: 'custbody_xxr_approval_comment' });
            // parentBill.setValue({
            //     fieldId: "custbody_xxr_approval_comment",
            //     value: oldComment + "\n" + comment
            // });

            try {
                var parentBillId = parentBill.save();
                log.debug('record created successfully', 'Id: ' + parentBillId);
            } catch (e) {
                log.error(e.name);
            }
        }

        return {
            afterSubmit: afterSubmit
        }
    });