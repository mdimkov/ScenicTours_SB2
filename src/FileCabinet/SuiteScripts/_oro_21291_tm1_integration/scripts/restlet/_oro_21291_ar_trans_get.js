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

            const convertValue = (field, value) => {
                let numberFields = ["Balance", "DepositBalance", "DocumentFXRate", "DocumentAmountHC", "DocumentAmountTC",
                    "ApplyNetSuiteID", "SubsidiaryID", "CustNetSuiteID", "DepositBalance", "NetSuiteID"];

                if (numberFields.includes(field)) {
                    return value ? Number(value) : null;
                } else if (value === "- None -") {
                    return "";
                }
                return value;
            }


            let arTrans = [];

            let arTransSearch = search.create({
                type: "transaction",
                filters:
                    [
                        [ // Deposit Balance: pick Customer Deposits and Deposit Applications
                            ["mainline", "is", "T"], "AND",
                            [
                                [
                                    ["type", "anyof", "CustDep"], "AND",
                                    ["status", "anyof", "CustDep:B"]
                                ], "OR",
                                [
                                    ["type", "anyof", "DepAppl"], "AND",
                                    ["appliedtotransaction.status", "anyof", "CustDep:B"]
                                ]
                            ]
                        ],
                        "OR",
                        [ // Overall Balance: pick Invoices
                            ["mainline", "is", "T"], "AND",
                            ["type", "anyof", "CustInvc"], "AND",
                            ["approvalstatus", "anyof", "2"], "AND",
                            ["amountremaining", "greaterthan", "0.00"]
                        ]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "formulatext",
                            formula: "{customer.entityid}",
                            label: "CustomerNumber"
                        }),
                        search.createColumn({name: "subsidiary", label: "SubsidiaryID"}),
                        search.createColumn({name: "internalid", label: "NetSuiteID"}),
                        search.createColumn({name: "tranid", label: "DocumentNumber"}),
                        search.createColumn({name: "createdfrom", label: "ApplyNetSuiteID"}),
                        search.createColumn({
                            name: "tranid",
                            join: "createdFrom",
                            label: "ApplyDocumentNumber"
                        }),
                        search.createColumn({name: "trandate", label: "DocumentDate"}),
                        search.createColumn({name: "memo", label: "DocumentDescription"}),
                        search.createColumn({name: "type", label: "DocumentType"}),
                        search.createColumn({name: "currency", label: "Currency"}),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "(CASE WHEN {type} = 'Customer Deposit' THEN {amount} WHEN {type} = 'Deposit Application' THEN {amount} ELSE {amountremaining} END ) / {exchangerate}",
                            label: "DocumentAmountTC"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "CASE WHEN {type} = 'Customer Deposit' THEN {amount} WHEN {type} = 'Deposit Application' THEN {amount} ELSE {amountremaining} END",
                            label: "DocumentAmountHC"
                        }),
                        search.createColumn({name: "exchangerate", label: "DocumentFXRate"}),
                        search.createColumn({name: "createdby", label: "CreatedUser"}),
                        search.createColumn({name: "datecreated", label: "CreatedDate"}),
                        search.createColumn({name: "lastmodifieddate", label: "UpdateDate"}),
                        search.createColumn({name: "internalid", label: "IntegrationID"})
                    ]
            });

            // return arTransSearch.runPaged().count;

            if (requestParams.DateFrom) {
                arTransSearch.filters.push(search.createFilter({
                    name: "trandate",
                    operator: search.Operator.ONORAFTER,
                    values: formatDate(requestParams.DateFrom)
                }));
            }

            if (requestParams.SubsidiaryID && Number.isInteger(parseInt(requestParams.SubsidiaryID))) {
                arTransSearch.filters.push(search.createFilter({
                    name: "subsidiary",
                    operator: search.Operator.ANYOF,
                    values: requestParams.SubsidiaryID
                }));
            } else {
                // MDIMKOV 30.07.2021: this is a required parameter, raise error message if not provided or not integer
                return {"status": "error", "error message": "SubsidiaryID is required"};
            }

            arTransSearch.run().each(result => {
                let entry = {};
                result.columns.forEach(column => {
                    let label = column.label;
                    let value = '';

                    if (label === 'Currency' || label === 'CreatedUser') {
                        value = result.getText(column);
                    } else {
                        value = result.getValue(column);
                    }

                    entry[label] = convertValue(label, value);
                });
                arTrans.push(entry);
                return true;
            });

            const arTransReduced = reduceJSON(arTrans);

            return JSON.stringify(arTransReduced);

        }

        const convertValue = (field, value) => {
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
                type: format.Type.DATE,
                timezone: format.Timezone.GMT
            });
        }

        // MDIMKOV 29.07.2021: this function groups the data by customer, as requested in the requirements document
        const reduceJSON = obj => {
            var reduceObj = obj.reduce(function (r, a) {
                r[a.CustomerNumber] = r[a.CustomerNumber] || [];
                r[a.CustomerNumber].push(a);
                return r;
            }, Object.create(null));

            var resultObject = {};
            resultObject['ARCustomerSummary'] = [];

            Object.keys(reduceObj).forEach(function (key) {
                var totalBalance = 0;
                var totalDepositBalance = 0;

                reduceObj[key].forEach(function (transaction) {
                    if (transaction.DocumentType === 'CustInvc') {
                        totalBalance += transaction.DocumentAmountTC || 0;
                    } else {
                        totalDepositBalance += transaction.DocumentAmountTC || 0;
                    }
                });

                var summaryObj = {
                    CustomerNumber: key,
                    SubsidiaryID: reduceObj[key][0].SubsidiaryID,
                    Balance: totalBalance,
                    DepositBalance: totalDepositBalance,
                    ARTransactions: reduceObj[key],
                };

                resultObject['ARCustomerSummary'].push(summaryObj);
            });

            return resultObject;
        };


        return {get}
    });
