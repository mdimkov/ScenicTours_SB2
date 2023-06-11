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

            // return JSON.stringify(query.runSuiteQL({query: "SELECT Top 3 * FROM customrecord_cseg_oro_tour"}).asMappedResults());

            let tours = [];

            let tourQuery = query.create({
                type: "customrecord_cseg_oro_tour"
            });

            let locationJoin = tourQuery.autoJoin({
                fieldId: "custrecord_oro_tour_loc"
            });

            let tourRegionJoin = tourQuery.autoJoin({
                fieldId: "custrecord_oro_tour_reg_name"
            });

            let globalRegionJoin = tourQuery.autoJoin({
                fieldId: "custrecord_oro_tour_glo_reg_name"
            });

            tourQuery.columns = ["id", "custrecord_oro_tour_code", "custrecord_oro_tour_subs", "custrecord_oro_tour_loc", "custrecord_oro_tour_reg",
                "custrecord_oro_tour_glo_reg", "custrecord_oro_tour_ops", "custrecord_oro_tour_journey", "custrecord_oro_tour_duration",
                "custrecord_oro_tour_start", "custrecord_oro_tour_end", "custrecord_oro_tour_pax_budget", "custrecord_oro_tour_room_cap", "custrecord_oro_tour_pax_actual",
                "custrecord_oro_tour_pax_cancel", "custrecord_oro_tour_brand", "custrecord_oro_tour_brand_name", "custrecord_oro_tour_extension", "custrecord_oro_tour_module"]
                .map(fieldId => tourQuery.createColumn({ fieldId: fieldId }));
            tourQuery.columns.push(locationJoin.createColumn({ fieldId: "name" }));
            tourQuery.columns.push(tourRegionJoin.createColumn({ fieldId: "name" }));
            tourQuery.columns.push(globalRegionJoin.createColumn({ fieldId: "name" }));

            if(requestParams.tourCode) {
                tourQuery.condition = tourQuery.createCondition({
                    fieldId: "custrecord_oro_tour_code",
                    operator: query.Operator.IS,
                    values: requestParams.tourCode
                });
            }

            tourQuery.run().iterator().each(result => {
                let values = result.value.values;
                let i = 0;

                tours.push({
                    "id": values[i++],
                    "code": values[i++],
                    "subsidiary": values[i++],
                    "locationId": values[i++],
                    "tourRegionId": values[i++],
                    "globalRegionId": values[i++],
                    "opsGroup": values[i++],
                    "journeyMode": values[i++],
                    "days": values[i++],
                    "departureDate": values[i++],
                    "returnDate": values[i++],
                    "paxCapacity": values[i++],
                    "roomCapacity": values[i++],
                    "tourPax": values[i++],
                    "cancelPax": values[i++],
                    "brandId": values[i++],
                    "brandName": values[i++],
                    "isExtension": values[i++],
                    "module": values[i++],
                    "locationName": values[i++],
                    "tourRegionName": values[i++],
                    "globalRegionName": values[i++]
                });
                return true;
            });

            return JSON.stringify(tours);
        }

        const stripEmoji = stringValue => {
            let regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
            return stringValue.replace(regex, "").trim();
        }

        return {get}
    });