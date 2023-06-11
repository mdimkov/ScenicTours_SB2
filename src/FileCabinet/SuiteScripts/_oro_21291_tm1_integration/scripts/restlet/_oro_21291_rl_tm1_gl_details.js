/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(["N/search", "N/format"],
    
    (search, format) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {
            let glDetails = [];

            let glDetailsSearch = search.load({
                id: "customsearch_oro_21291_tm1_gl_details"
            });

            glDetailsSearch.filters.push(search.createFilter({
                name: "trandate",
                operator: search.Operator.WITHIN,
                values: [formatDate(requestParams.dateStart), formatDate(requestParams.dateEnd)]
            }));

            if(requestParams.subsidiary) {
                glDetailsSearch.filters.push(search.createFilter({
                    name: "subsidiary",
                    operator: search.Operator.ANYOF,
                    values: requestParams.subsidiary
                }));
            }

            if(requestParams.account) {
                glDetailsSearch.filters.push(search.createFilter({
                    name: "account",
                    operator: search.Operator.ANYOF,
                    values: requestParams.account
                }));
            }

            if(requestParams.department) {
                glDetailsSearch.filters.push(search.createFilter({
                    name: "department",
                    operator: search.Operator.ANYOF,
                    values: requestParams.department
                }));
            }

            glDetailsSearch.run().each(result => {
                let entry = {};
                result.columns.forEach(column => {
                    let label = column.label;
                    let isCurrencyColumn = label == "currency";

                    let value = isCurrencyColumn ? result.getText(column) : result.getValue(column);
                    entry[label] = convertValue(label, value);
                });
                glDetails.push(entry);
                return true;
            });

            return JSON.stringify(glDetails);
        }

        const convertValue = (field, value) => {
            let numberFields = ["subsidiary", "account", "department", "location", "fiscalYear", "fiscalPeriod",
                "amount"];

            if(numberFields.includes(field)) {
                return value ? Number(value) : null;
            } else if(value === "- None -") {
                return "";
            }
            return value;
        }

        const formatDate = date => {
            return format.format({
                value: new Date(date),
                type: format.Type.DATE,
                timezone: format.Timezone.GMT
            });
        }

        return {get}
    });
