/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', './lib'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{lib} lib
     */

    /* MDIMKOV 18.06.2021: integration restlet used for custom Cabin Class & Capacity records in NetSuite
    *  the list of cabins along with the cabin external IDs is being kept in an array, so that it can be sent back with pass/fail statuses
    *  the array is being returned also when an error message is raised
    * */


    (record, search, lib) => {


        function getRecIdbyTourId(tourId) {

            var internalId = 0;

            var recordSearchObj = search.create({
                type: 'customrecord_cseg_oro_tour',
                filters:
                    [
                        ['name', 'is', tourId]
                    ],
                columns:
                    [
                        'internalid'
                    ]
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });

            return internalId;

        }



        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {

        }

        /**
         * Defines the function that is executed when a PUT request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const put = (requestBody) => {

            // MDIMKOV 08.06.2021: declare the array that will hold the return data
            let returnObj = {"CabinRecord": []};

            try {

                // MDIMKOV 15.06.2021: process the requestBody input, extract the cabin array

                log.audit('MDIMKOV', '--- requestBody START ---');

                log.debug('requestBody', requestBody);

                const cabinData = requestBody.CabinRecord;

                log.debug('cabinData', cabinData);

                // MDIMKOV 16.06.2021: prepare an empty return object structure that holds all cabin IDs and set them to 'Not Processed'
                cabinData.forEach((cabin) => {
                    returnObj.CabinRecord.push(
                        {
                            "IntegrationID": cabin.IntegrationID,
                            "IntegrationType": "CabinRecord",
                            "TourID": cabin.TourID,
                            "Tour": cabin.Tour,
                            "CabinClass": cabin.CabinClass,
                            "Status": "NN",
                            "ErrorMessage": null,
                            "ProcessedDate": null,
                            "NetSuiteId": 0
                        }
                    )
                });


                // MDIMKOV 15.06.2021: iterate through cabin records from requestBody and create them in NetSuite
                cabinData.forEach((cabin) => {
                    const tourID = cabin.TourID;
                    const cabinClass = cabin.CabinClass;
                    const tour = cabin.Tour;
                    const cabinName = cabin.CabinName;
                    const cabinDeck = cabin.CabinDeck;
                    const cabinCategory = cabin.CabinCategory;
                    const capacity = cabin.Capacity;

                    // MDIMKOV 15.06.2021: try to create the cabin; if impossible, add respective message to the return array
                    try {

                        // MDIMKOV 21.06.2021: if the record exists, create it, otherwise: update it; note: External Id = tour-cabinClass
                        const recordId = lib.getRecIdbyExtId('customrecord_oro_cabin_cpcty', tour + '-' + cabinClass);
                        log.audit('recordId', recordId);

                        if (!recordId) {
                            var recCabin = record.create({
                                type: 'customrecord_oro_cabin_cpcty'
                            });
                        } else {
                            var recCabin = record.load({
                                type: 'customrecord_oro_cabin_cpcty',
                                id: recordId
                            });
                        }

                        if (cabinName && tour && cabinClass) {

                            recCabin.setValue('externalid', tour + '-' + cabinClass);
                            recCabin.setValue('name', cabinName);
                            recCabin.setValue('custrecord_oro_cabin_cpcty_tour', getRecIdbyTourId(tourID));
                            recCabin.setValue('custrecord_oro_cabin_cpcty_class', cabinClass ? lib.findListValue(cabinClass, 'customrecord_oro_cabin_class') : '');
                            recCabin.setValue('custrecord_oro_cabin_cpcty_category', cabinCategory ? lib.findListValue(cabinCategory, 'customrecord_oro_cabin_category') : '');
                            recCabin.setValue('custrecord_oro_cabin_cpcty_deck', cabinDeck ? lib.findListValue(cabinDeck, 'customrecord_oro_cabin_deck') : '');
                            recCabin.setValue('custrecord_oro_cabin_cpcty_capacity', capacity);

                            const cabinId = recCabin.save({
                                ignoreMandatoryFields: true
                            });

                            // MDIMKOV 15.06.2021: adding cabin SUCCEEDED, add the successful entry to the return object
                            declareStatus(returnObj.CabinRecord, tour + '-' + cabinClass, 'HK', '', cabinId);

                        } else {
                            // MDIMKOV 15.06.2021: a mandatory field is missing
                            declareStatus(returnObj.CabinRecord, tour + '-' + cabinClass, 'ER', 'One of the following mandatory field values is missing: name, tour, class', 0);
                        }

                    } catch (e) {

                        log.error('ERROR', e.message + ' --- ' + e.stack);

                        // MDIMKOV 15.06.2021: adding cabin FAILED, add the failed entry to the return object
                        declareStatus(returnObj.CabinRecord, tour + '-' + cabinClass, 'ER', e.message + ' --- ' + e.stack, 0);

                    }


                });

                log.audit('MDIMKOV', '--- requestBody END ---');

                return returnObj;

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);

                // MDIMKOV 15.06.2021: return the return object, which holds information about failed/succeeded entries
                return returnObj;

            }

        }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {

        }

        /**
         * Defines the function that is executed when a DELETE request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const doDelete = (requestParams) => {

        }


        function declareStatus(obj, cabinID, status, message, id) {

            // MDIMKOV 16.06.2021: find the element to be updated in the output JSON
            const objIndex = obj.findIndex((obj => obj.Tour + '-' + obj.CabinClass == cabinID));

            // MDIMKOV 24.06.2021: if the error message was due to Script Execution Usage Limit Exceeded, the entries need to be returned as not processed
            if (!message || !message.includes('Script Execution Usage Limit Exceeded')) {

                // MDIMKOV 16.06.2021: update the respective output array element with success/failure status
                obj[objIndex].Status = status;
                obj[objIndex].ErrorMessage = message;
                obj[objIndex].ProcessedDate = new Date;
                obj[objIndex].NetSuiteId = id;


            }

        }


        return {get, put, post, delete: doDelete}

    });
