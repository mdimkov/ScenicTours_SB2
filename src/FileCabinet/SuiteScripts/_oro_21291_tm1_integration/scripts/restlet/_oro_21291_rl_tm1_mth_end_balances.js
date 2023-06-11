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

            let mthEndBalanceSearch = search.load({
                id: "customsearch_oro_21291_tm1_mthendbal"
            });

            // MDIMKOV 07.09.2021: set the request end-date (used to filter) to be the end of the previous month (requested by Ciprian)
            const lastDayPreviousMonth = getLastDayFromPreviousMonth(new Date(requestParams.dateEnd));

            const fiscalYear = new Date(requestParams.dateEnd).getFullYear();
            const fiscalPeriod = new Date(requestParams.dateEnd).getMonth() + 1;

            mthEndBalanceSearch.filters.push(search.createFilter({
                name: "trandate",
                operator: search.Operator.ONORBEFORE,
                values: [formatDate(lastDayPreviousMonth)]
            }));

            if (requestParams.subsidiary) {
                mthEndBalanceSearch.filters.push(search.createFilter({
                    name: "subsidiary",
                    operator: search.Operator.ANYOF,
                    values: requestParams.subsidiary
                }));
            }

            if (requestParams.account) {
                mthEndBalanceSearch.filters.push(search.createFilter({
                    name: "account",
                    operator: search.Operator.ANYOF,
                    values: requestParams.account
                }));
            }

            mthEndBalanceSearch.run().each(result => {
                let entry = {};
                result.columns.forEach(column => {
                    let label = column.label;
                    let isCurrencyColumn = label == "currency";

                    let value = isCurrencyColumn ? result.getText(column) : result.getValue(column);
                    entry[label] = convertValue(label, value, fiscalYear, fiscalPeriod);
                });
                if (entry['amount'] !== '.00' && entry['amount'] !== 0) { // exclude zero amounts
                    glDetails.push(entry);
                }
                return true;
            });

            return JSON.stringify(glDetails);
        }

        const convertValue = (field, value, fiscalYear, fiscalPeriod) => {

            if (field === 'fiscalYear') {
                return fiscalYear;
            }

            if (field === 'fiscalPeriod') {
                return fiscalPeriod;
            }

            let numberFields = ["subsidiary", "account", "department", "location", "fiscalYear", "fiscalPeriod",
                "amount"];

            if (numberFields.includes(field)) {
                return value ? Number(value) : null;
            } else if (value === "- None -") {
                return "";
            }
            return value;
        }

        const formatDate = date => {
            return format.format({
                value: new Date(date),
                type: format.Type.DATE
            });
        }

        // MDIMKOV 07.09.2021: this function will return the last day of the previous month (e.g. 2021-08-15 => 2021-07-31)
        function getLastDayFromPreviousMonth(date) {
            const paramDate = date;
            const paramDateMonth = paramDate.getMonth();
            const paramDateYear = paramDate.getFullYear();
            let previousMonth = -1;
            let previousYear = -1;

            if (paramDateMonth === 0) {
                previousMonth = 11; // if param date is January, make it December
                previousYear = paramDateYear - 1; // if January, also decrease the year
            } else {
                previousMonth = paramDateMonth - 1;
                previousYear = paramDateYear;
            }

            const firstDayPreviousMonth = new Date(previousYear, previousMonth, 1, 0, 0, 0, 0);

            return lastDayPreviousMonth = new Date(firstDayPreviousMonth.getFullYear(), firstDayPreviousMonth.getMonth() + 1, 0);

        }

        return {get}
    });
