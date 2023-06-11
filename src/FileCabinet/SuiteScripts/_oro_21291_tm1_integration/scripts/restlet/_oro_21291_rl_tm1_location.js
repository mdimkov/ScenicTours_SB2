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

            // return JSON.stringify(query.runSuiteQL({query: "SELECT Top 3 * FROM location"}).asMappedResults());

            let locations = [];

            let locationQuery = query.create({
                type: query.Type.LOCATION
            });
            locationQuery.columns = ["id", "name", "custrecord_oro_loctype"]
                .map(fieldId => locationQuery.createColumn({ fieldId: fieldId }));

            locationQuery.condition = locationQuery.createCondition({
                fieldId: "custrecord_oro_loctype",
                operator: query.Operator.ANY_OF,
                values: 3
            });

            locationQuery.run().iterator().each(result => {
                let values = result.value.values;
                locations.push({
                    "id": values[0],
                    "name": values[1]
                });
                return true;
            });

            return JSON.stringify(locations);
        }

        return {get}
    });