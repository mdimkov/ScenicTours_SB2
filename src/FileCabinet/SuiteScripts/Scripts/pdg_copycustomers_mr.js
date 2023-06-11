/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search) => {

        /* MDIMKOV 23.12.2021: this script is used one-time only to copy all existing customers and vendors in the account
        *   - copy all customers (assign new subsidiary)
        *   - copy all vendors (assign new subsidiary)
        *   - set the external ID of the old record to xxx_old
        *   - to toggle between customers and vendors, just change the record_type to either 'customer' or 'vendor'
        * */

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

        const record_type = 'customer'; // either 'customer' or 'vendor'
        let subsidiary = 9; // new general subsidiary id
        const mktngSubsidiary = 8; // new MKTNG subsidiary id

        const getInputData = (inputContext) => {

            try {
                log.audit('MDIMKOV', '--- getInputData START ---');

                var mySearch = search.create({

                    type: record_type,

                    filters:
                        [
                            ['subsidiary', 'anyof', '2'],
                            'AND', ['custentity_pdg_copiedcustomer', 'anyof', '@NONE@'],
                            'AND', ['externalidstring','startswith','APP_SHOP_CUSTOMER'],
                            // 'AND', ['companyname', 'startswith', 'Ackermann'],
                            // 'AND', ['internalid', 'anyof', [204910]],
                        ],
                    columns:
                        [
                            'internalid'
                        ]

                });

                return mySearch;

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

                var id = JSON.parse(mapContext.key);

                // MDIMKOV 23.12.2021: get the entityid and the external id from the original record
                var fieldLookUp = search.lookupFields({
                    type: record_type,
                    id: id,
                    columns: ['entityid', 'externalid']
                });

                let entityid = fieldLookUp.entityid;
                let externalid = '';
                if (fieldLookUp.externalid[0]) {
                    externalid = fieldLookUp.externalid[0].value;
                }

                // MDIMKOV 30.12.202 if no external id found, create it by concatenating the entityid with a hard-coded string
                if (!externalid) {
                    if (record_type == 'customer') {
                        externalid = 'APP_SHOP_CUSTOMER_' + fieldLookUp.entityid;
                    } else if (record_type == 'vendor') {
                        externalid = 'APP_SHOP_VENDOR_' + fieldLookUp.entityid;
                    }
                }

                // MDIMKOV 23.12.2021: if the entityid or externalid have the suffix [_old], remove it;
                // this is only if last time the script stamped them as _old but couldn't copy the record and the old record needs to be re-processed now
                entityid = entityid.includes('_old') ? entityid.replace('_old', '') : entityid;
                externalid = externalid.includes('_old') ? externalid.replace('_old', '') : externalid;

                // MDIMKOV 27.01.2022: if the external id starts with [APP_SHOP], set it to the marketing subsidiary
                if (externalid.includes('APP_SHOP_')) {
                    subsidiary = mktngSubsidiary;
                }

                // MDIMKOV 23.12.2021: before copying the record, suffix the entityid with [_old] and clear the external id
                record.submitFields({
                    type: record_type,
                    id: id,
                    values: {
                        entityid: entityid + '_old',
                        externalid: externalid + '_old'
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                // MDIMKOV 23.12.2021: copy the record; set only the new subsidiary, the entityid and the externalid
                var objRecord = record.copy({
                    type: record_type,
                    id: id
                });
                objRecord.setValue('entityid', entityid)
                objRecord.setValue('externalid', externalid)
                objRecord.setValue('custentity_externalid', externalid)
                objRecord.setValue('subsidiary', subsidiary)
                var objRecordSavedId = objRecord.save();

                // MDIMKOV 23.12.2021: if everything went well, add a cross-link between the old and the new customer/vendor
                if (objRecordSavedId) {
                    if (record_type == 'customer') {
                        record.submitFields({
                            type: record_type,
                            id: id,
                            values: {
                                custentity_pdg_copiedcustomer: objRecordSavedId
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                        record.submitFields({
                            type: record_type,
                            id: objRecordSavedId,
                            values: {
                                custentity_pdg_copiedcustomer: id
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    } else if (record_type == 'vendor') {
                        record.submitFields({
                            type: record_type,
                            id: id,
                            values: {
                                custentity_pdg_copiedvendor: objRecordSavedId
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                        record.submitFields({
                            type: record_type,
                            id: objRecordSavedId,
                            values: {
                                custentity_pdg_copiedvendor: id
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }
                    log.audit('MDIMKOV', record_type + ' with id ' + id + ' was copied as a new ' + record_type + ' with id ' + objRecordSavedId);
                }

                log.debug('MDIMKOV', '--- map END ---');

            } catch (e) {
                log.error('ERROR', 'problem with ' + record_type + ' with id ' + id + ' --- ' + e.message + ' --- ' + e.stack);
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
            log.audit('MDIMKOV', '--- summarize END ---');
        }

        return {getInputData, map, reduce, summarize}

    });