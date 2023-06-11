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
            let departments = [];

            let departmentQuery = query.create({
               type: query.Type.DEPARTMENT
            });
            departmentQuery.columns = ["id", "name", "fullname", "parent", "subsidiary", "isinactive"]
                .map(fieldId => departmentQuery.createColumn({ fieldId: fieldId }));

            if(requestParams.subsidiary) {
                departmentQuery.condition = departmentQuery.createCondition({
                    fieldId: "subsidiary",
                    operator: query.Operator.INCLUDE_ANY,
                    values: requestParams.subsidiary
                });
            }

            departmentQuery.run().iterator().each(result => {
                let values = result.value.values;
                let i = 0;
                departments.push({
                    "id": values[i++],
                    "name": values[i++],
                    "fullName": values[i++].replace(/:/g, "¦"),
                    "parent": values[i++],
                    "subsidiary": values[i++].split(",").map(entry => Number(entry.trim())),
                    "inactive": values[i++] === "F"
                });
                return true;
            });

            return JSON.stringify(departments);
        }

        return {get}
    });