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

            // return JSON.stringify(query.runSuiteQL({query: "SELECT Top 1 * FROM account Where acctnumber = '1200'"}).asMappedResults());

            let glAccounts = [];

            let accountQuery = query.create({
                type: query.Type.ACCOUNT
            });

            // return JSON.stringify(query.runSuiteQL({query: "SELECT Top 1 * FROM account"}).asMappedResults());

            accountQuery.columns = ["id", "acctnumber", "accountsearchdisplaynamecopy", "fullname", "accttype", "parent", "generalrate",
                "custrecord_oro_sageacct", "subsidiary", "custrecord_oro_tourmargacct", "custrecord_oro_tourshipcost", "department"]
                .map(fieldId => accountQuery.createColumn({ fieldId: fieldId }));

            accountQuery.condition = accountQuery.createCondition({
                fieldId: "isinactive",
                operator: query.Operator.IS,
                values: false
            });

            if(requestParams.tmaFlag) {
                accountQuery.condition = accountQuery.and(accountQuery.condition, accountQuery.createCondition({
                    fieldId: "custrecord_oro_tourmargacct",
                    operator: query.Operator.IS,
                    values: convertStringToBoolean(requestParams.tmaFlag)
                }));
            }

            if(requestParams.tscFlag) {
                accountQuery.condition = accountQuery.and(accountQuery.condition, accountQuery.createCondition({
                    fieldId: "custrecord_oro_tourshipcost",
                    operator: query.Operator.IS,
                    values: convertStringToBoolean(requestParams.tscFlag)
                }));
            }

            if(requestParams.account) {
                accountQuery.condition = accountQuery.and(accountQuery.condition, accountQuery.createCondition({
                    fieldId: "acctnumber",
                    operator: query.Operator.IS,
                    values: requestParams.account
                }));
            }

            if(requestParams.type) {
                accountQuery.condition = accountQuery.and(accountQuery.condition, accountQuery.condition = accountQuery.createCondition({
                    fieldId: "accttype",
                    operator: query.Operator.IS,
                    values: requestParams.type
                }));
            }

            if(requestParams.subsidiary) {
                accountQuery.condition = accountQuery.and(accountQuery.condition, accountQuery.createCondition({
                    fieldId: "subsidiary",
                    operator: query.Operator.INCLUDE_ANY,
                    values: requestParams.subsidiary
                }));
            }

            // MDIMKOV 28.05.2021: filter out any summary accounts, as requested by TM1
            accountQuery.condition = accountQuery.and(accountQuery.condition, accountQuery.createCondition({
                fieldId: "issummary",
                operator: query.Operator.IS,
                values: false
            }));
            
            // MDIMKOV 28.05.2021: convert account type into the type recognized by TM1
            const acctMapObj = {
                Bank: "Balance Sheet",
                AcctRec: "Balance Sheet",
                OthCurrAsset: "Balance Sheet",
                FixedAsset: "Balance Sheet",
                OthAsset: "Balance Sheet",
                AcctPay: "Balance Sheet",
                CredCard: "Balance Sheet",
                OthCurrLiab: "Balance Sheet",
                LongTermLiab: "Balance Sheet",
                Equity: "Balance Sheet",
                Income: "Income Statement",
                COGS: "Income Statement",
                Expense: "Income Statement",
                OthIncome: "Income Statement",
                OthExpense: "Income Statement",
                NonPosting: "Balance Sheet",
                DeferRevenue: "Balance Sheet",
                DeferExpense: "Balance Sheet",
                UnbilledRec: "Balance Sheet",
                Stat: "Balance Sheet"
            };

            accountQuery.run().iterator().each(result => {
                let values = result.value.values;
                let i = 0;
                glAccounts.push({
                    "id": values[i++],
                    "account": values[i++],
                    "name": values[i++],
                    "fullName": values[i++].replace(/:/g, "¦"),
                    "type": values[i++].replace(/\b(?:Bank|AcctRec|OthCurrAsset|FixedAsset|OthAsset|AcctPay|CredCard|OthCurrLiab|LongTermLiab|Equity|Income|COGS|Expense|OthIncome|OthExpense|NonPosting|DeferRevenue|DeferExpense|UnbilledRec|Stat)\b/gi, matched => acctMapObj[matched]),
                    "parent": values[i++],
                    "currencyConversionType": values[i++],
                    "sageAccount": values[i++],
                    "subsidiary": values[i++].split(",").map(entry => Number(entry.trim())),
                    "tmaFlag": values[i++] ? values[i] : false,
                    "tscFlag": values[i++] ? values[i] : false,
                    "department": values[i++],
                    "currency": values[i++]
                });
                return true;
            });

            return JSON.stringify(glAccounts);
        }

        const convertStringToBoolean = value => {
            if(value) {
                return ["1", "t", "true"].includes(value.toLowerCase());
            }
            return false;
        }

        return {get}
    });