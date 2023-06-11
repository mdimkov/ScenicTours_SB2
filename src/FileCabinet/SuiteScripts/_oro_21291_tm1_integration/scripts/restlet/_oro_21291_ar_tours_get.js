/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(["N/query"],

    (query) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {

            try {

                log.audit('MDIMKOV', '--- SCRIPT START ---');

                // return JSON.stringify(query.runSuiteQL({query: "SELECT Top 3 * FROM customrecord_cseg_oro_tour"}).asMappedResults());

                let tours = [];

                // MDIMKOV 22.09.2021: create the Tours query
                let tourQuery = query.create({
                    type: "customrecord_cseg_oro_tour"
                });

                let locationDetailsJoin = tourQuery.autoJoin({
                    fieldId: "custrecord_oro_tour_loc_details"
                });

                let vesselJoin = tourQuery.autoJoin({
                    fieldId: "custrecord_oro_tour_vessel"
                });

                tourQuery.columns = [
                    "externalid",
                    "id",
                    "custrecord_oro_tour_code",
                    "custrecord_oro_tour_start",
                    "custrecord_oro_tour_end",
                    "custrecord_oro_tour_brand",
                    "custrecord_oro_tour_status",
                    "custrecord_oro_tour_duration",
                    "custrecord_oro_tour_pax_budget",
                    "custrecord_oro_tour_room_cap",
                    "custrecord_oro_tour_pax_actual",
                    "custrecord_oro_tour_pax_cancel",
                    "custrecord_oro_tour_sale_type",
                    "custrecord_oro_tour_subs",
                    "custrecord_oro_tour_loc_details",
                ]
                    .map(fieldId => tourQuery.createColumn({fieldId: fieldId}));
                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "name"}));
                tourQuery.columns.push(vesselJoin.createColumn({fieldId: "name"}));

                if (requestParams.tourCode) {
                    tourQuery.condition = tourQuery.createCondition({
                        fieldId: "custrecord_oro_tour_code",
                        operator: query.Operator.IS,
                        values: requestParams.tourCode
                    });
                }

                // MDIMKOV 22.09.2021: create the Cabins query
                let cabinQuery = query.create({
                    type: "customrecord_oro_cabin_cpcty"
                });

                let classJoin = cabinQuery.autoJoin({
                    fieldId: "custrecord_oro_cabin_cpcty_class"
                });

                let categoryJoin = cabinQuery.autoJoin({
                    fieldId: "custrecord_oro_cabin_cpcty_category"
                });

                let deckJoin = cabinQuery.autoJoin({
                    fieldId: "custrecord_oro_cabin_cpcty_deck"
                });

                cabinQuery.columns.push(classJoin.createColumn({fieldId: "name"}));
                cabinQuery.columns.push(cabinQuery.createColumn({fieldId: "name"}));
                cabinQuery.columns.push(categoryJoin.createColumn({fieldId: "name"}));
                cabinQuery.columns.push(deckJoin.createColumn({fieldId: "name"}));
                cabinQuery.columns.push(cabinQuery.createColumn({fieldId: "custrecord_oro_cabin_cpcty_capacity"}));


                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "custrecord_tour_loc"}));
                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "custrecord_tour_loc_name"}));
                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "custrecord_tour_reg"}));
                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "custrecord_tour_reg_name"}));
                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "custrecord_tour_glo_reg"}));
                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "custrecord_tour_glo_reg_name"}));
                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "custrecord_tour_ops"}));
                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "custrecord_tour_journey"}));
                tourQuery.columns.push(locationDetailsJoin.createColumn({fieldId: "custrecord_tour_extension"}));


                tourQuery.run().iterator().each(result => {
                    let values = result.value.values;
                    const tourid = values[1];
                    let cabins = [];

                    log.audit('values', values);

                    // MDIMKOV 22.09.2021: prepare the cabin sub-set
                    cabinQuery.condition = cabinQuery.createCondition({
                        fieldId: "custrecord_oro_cabin_cpcty_tour",
                        operator: query.Operator.EQUAL,
                        values: tourid
                    });

                    cabinQuery.run().iterator().each(resultCabin => {
                        let values = resultCabin.value.values;
                        let j = 0;

                        cabins.push({
                            "TourID": tourid,
                            "CabinClass": values[j++],
                            "CabinName": values[j++],
                            "CabinCategory": values[j++],
                            "CabinDeck": values[j++],
                            "Capacity": values[j++]
                        })

                        return true;
                    });

                    // v2 using template
                    tours.push({
                        "IntegrationID": values[0],
                        "IntegrationType": "TourRecord",
                        "TourID": values[1],
                        "Tour": values[2],
                        "DepartureDate": values[3],
                        "ReturnDate": values[4],
                        "TourLocation": values[17],
                        "TourLocationName": values[18],
                        "TourRegion": values[20],
                        "TourRegionName": values[19],
                        "TourGlobalRegion": values[22],
                        "TourGlobalRegionName": values[21],
                        "OpsGroup": values[23],
                        "JourneyMode": values[24],
                        "TourBrand": values[5],
                        "TourStatus": values[6],
                        "TourDays": values[7],
                        "PassengerCapacity": values[8],
                        "RoomCapacity": values[9],
                        "TourPassengers": values[10],
                        "CancelPassengers": values[11],
                        "SaleType": values[12],
                        "SubsidiaryID": values[13],
                        "TourLocationDetail": values[14],
                        "Vessel": values[16],
                        "IsExtension": values[25],
                        "Cabins": cabins
                    });

                    return true;
                });

                return '{"TourRecord":' + JSON.stringify(tours) + '}';

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);
                return e.message + ' --- ' + e.stack;

            }
        }

        return {get}
    });
