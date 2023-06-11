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

    /* MDIMKOV 18.06.2021: integration restlet used for custom tour records in NetSuite
    *  the list of tour external IDs is being kept in an array, so that it can be sent back with pass/fail statuses
    *  the array is being returned also when an error message is raised
    * */

    (record, search, lib) => {
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
            let returnObj = {"TourRecord": []};

            try {

                // MDIMKOV 15.06.2021: process the requestBody input, extract the tour array

                log.audit('MDIMKOV', '--- requestBody START ---');

                log.debug('requestBody', requestBody);

                const tourData = requestBody.TourRecord;

                log.debug('tourData', tourData);

                // MDIMKOV 16.06.2021: prepare an empty return object structure that holds all tour IDs and set them to 'Not Processed'
                tourData.forEach((tour) => {
                    returnObj.TourRecord.push(
                        {
                            "IntegrationID": tour.IntegrationID,
                            "IntegrationType": "TourRecord",
                            "TourID": tour.TourID,
                            "Status": 'NN',
                            "ErrorMessage": null,
                            "ProcessedDate": null,
                            "NetSuiteId": null
                        }
                    )
                });


                // MDIMKOV 15.06.2021: iterate through tour records from requestBody and create them in NetSuite
                tourData.forEach((tour) => {
                    const integrationID = tour.IntegrationID;
                    const TourID = tour.TourID;

                    // MDIMKOV 15.06.2021: try to create the tour; if impossible, add respective message to the return array
                    try {

                        // MDIMKOV 21.06.2021: if the record exists, create it, otherwise: update it
                        const recordId = lib.getRecIdbyExtId('customrecord_cseg_oro_tour', TourID);
                        log.audit('recordId', recordId);

                        if (!recordId) {
                            var recTour = record.create({
                                type: 'customrecord_cseg_oro_tour'
                            });
                        } else {
                            var recTour = record.load({
                                type: 'customrecord_cseg_oro_tour',
                                id: recordId
                            });
                        }

                        if (tour.DepartureDate && tour.ReturnDate) {

                            recTour.setValue('externalid', integrationID);
                            recTour.setValue('name', tour.TourID);
                            recTour.setValue('custrecord_oro_tour_code', tour.Tour);
                            recTour.setValue('custrecord_oro_tour_start', tour.DepartureDate ? new Date(tour.DepartureDate) : '');
                            recTour.setValue('custrecord_oro_tour_end', tour.ReturnDate ? new Date(tour.ReturnDate) : '');
                            recTour.setValue('custrecord_oro_tour_loc', tour.TourLocation ? lib.findListValue(tour.TourLocation, 'customrecord_oro_tour_loc_details') : '', true);
                            recTour.setValue('custrecord_oro_tour_brand', tour.TourBrandID);
                            recTour.setValue('custrecord_oro_tour_status', tour.TourStatusName ? lib.findListValueCached(tour.TourStatusName, 'customrecord_oro_21k_tourstatus') : '', true);
                            recTour.setValue('custrecord_oro_tour_duration', tour.TourDays);
                            recTour.setValue('custrecord_oro_tour_pax_budget', tour.PassengerCapacity);
                            recTour.setValue('custrecord_oro_tour_room_cap', tour.RoomCapacity);
                            recTour.setValue('custrecord_oro_tour_pax_actual', tour.TourPassengers);
                            recTour.setValue('custrecord_oro_tour_pax_cancel', tour.CancelPassengers);
                            recTour.setValue('custrecord_oro_tour_sale_type', tour.SaleTypeID);
                            // recTour.setValue('custrecord_oro_tour_vessel', tour.ShipName ? lib.findListValueCached(tour.ShipName, 'customrecord_oro_tour_vessel') : '', true);
                            recTour.setValue('custrecord_oro_tour_subs', tour.OperatorSubsidiaryID);
                            recTour.setValue('custrecord_oro_tour_integ_type', tour.IntegrationType);

                            const tourId = recTour.save({
                                ignoreMandatoryFields: true
                            });

                            // MDIMKOV 15.06.2021: adding tour SUCCEEDED, add the entry to the return object
                            declareStatus(returnObj.TourRecord, TourID, 'HK', null, tourId);


                        } else {
                            // MDIMKOV 15.06.2021: a mandatory field is missing
                            declareStatus(returnObj.TourRecord, TourID, 'ER', 'One of the following mandatory field values is missing: tourStartDate, tourEndDate', 0);
                        }

                    } catch (e) {

                        log.error('ERROR', e.message + ' --- ' + e.stack);

                        // MDIMKOV 15.06.2021: adding tour FAILED, add the failed entry to the return object
                        declareStatus(returnObj.TourRecord, TourID, 'ER', e.message + ' --- ' + e.stack, 0);

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


        function declareStatus(obj, TourID, status, message, id) {

            // MDIMKOV 16.06.2021: find the element to be updated in the output JSON
            const objIndex = obj.findIndex((obj => obj.TourID == TourID));

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
