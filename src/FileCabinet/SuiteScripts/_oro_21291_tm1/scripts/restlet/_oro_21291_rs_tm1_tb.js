/**
 * @NModuleScope Public
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NAmdConfig /SuiteBundles/Bundle 372579/_oro_1010_library.json
 */

define(["ORO/mavenchecks", "N/query", "N/runtime", "./date_util"],

    (mavenchecks, query, runtime, dateUtil) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         * content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         * Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParameters) => {
            log.debug("requestParameters in review", JSON.stringify(requestParameters));
            let scriptParameters = {
                test: runtime.getCurrentScript().getParameter({
                    name: "custscript_oro_21291_rs_tm1_tb_trn"
                }),
                logLevel: runtime.getCurrentScript().logLevel
            }
            log.debug("scriptParameters in review", JSON.stringify(scriptParameters));

            // Step 1: Enhance request parameters
            let request = validateParameters(requestParameters, scriptParameters);
            log.debug("request validated", JSON.stringify(request));

            return runQuery(request, scriptParameters);
        }

        const runQuery = (request, scriptParameters) => {
            let sqlQuery, sqlResult;
            if (!request.query) {
                sqlQuery = getSQL("trialbalance", request, scriptParameters);
                log.debug("In runQuery: no query parameter found, sqlQuery = ", sqlQuery);
            } else if (request.query.includes("SELECT")) {
                sqlQuery = request.query
            } else {
                log.debug("In runQuery: predefined query to be sourced, request.query = ", request.query);
                switch (request.query) {
                    case "mov":
                    case "tb_movements":
                    case "trialbalance":
                        sqlQuery = getSQL("tb_movements", request, scriptParameters);
                        break;
                    case "bal":
                    case "tb_balances":
                        sqlQuery = getSQL("tb_balances", request, scriptParameters);
                        break;
                    default:
                        throw "The query type is not listed. Please specify a valid query type.";
                }
            }
            log.debug("In runQuery: sqlQuery sourced", sqlQuery);
            sqlResult = query.runSuiteQL({
                query: sqlQuery
            }).asMappedResults().map(e => {
                // log.debug("runQuery e",e);
                return {
                    subsidiary: e.subsidiary,
                    account: e.account,
                    department: e.department,
                    location: e.location,
                    fiscalYear: e.fiscalyear,
                    fiscalPeriod: e.fiscalperiod,
                    amount: e.amount,
                    currency: e.currency,
                    account_number: e.account_number,
                    entity: e.entity,
                    isAdjust: e.isAdjust
                }
            });

            log.debug("sqlResult generated", JSON.stringify(sqlResult))
            return sqlResult;
        }

        const validateParameters = (requestParameters, scriptParameters) => {
            log.debug("Inside the validateParameters function, requestParameters", JSON.stringify(requestParameters));
            if (scriptParameters.logLevel === "DEBUG") {
                log.debug("Test 1: validateDate", validateDate(requestParameters.start || requestParameters.dateStart));
                log.debug("Test 2: validateSubs", validateSubs(requestParameters));
                log.debug("Test 3: validateAccts", validateGenericParameter(requestParameters, "account"));
                log.debug("Test 4: validateDpts", validateGenericParameter(requestParameters, "department"));
                log.debug("Test 5: validateLocs", validateGenericParameter(requestParameters, "location"));
            }

            let queryParameters = {
                legacy: requestParameters.legacy,
                query: requestParameters.query,
                start: validateDate(requestParameters.start || requestParameters.dateStart), // || throw "No period start date has been specified. Please use the parameter 'start' to specify a period start date in the format 'YYYY-MM-DDTHH:MM:SS' or 'YYYY-MM' or 'DD/MM/YYYY'.",
                end: validateDate(requestParameters.end || requestParameters.dateEnd), // || throw "No period end date has been specified.. Please use the parameter 'end' to specify a period end date in the format 'YYYY-MM-DDTHH:MM:SS' or 'YYYY-MM' or 'DD/MM/YYYY'.",
                sub: validateSubs(requestParameters),
                acct: validateGenericParameter(requestParameters, "account"),
                dpt: validateGenericParameter(requestParameters, "department"),
                loc: validateGenericParameter(requestParameters, "location"),
                isadjust: requestParameters.includeAdj==1 ? 'T' : 'F' // MDIMKOV 13.03.2023: if includeAdj=1, add data from the adjustment period (isadjust='T'); if includeAdj=0 (or if it is omitted), just return the normal query
            };
            log.debug("queryParameters validated", JSON.stringify(queryParameters));

            return queryParameters;
        }

        const validateDate = date => {
            if (!date) return "2000-01";
            let utcDate = dateUtil.getUtcDate(new Date(date));
            return utcDate.getFullYear() + "-" + (utcDate.getMonth() + 1);
        }

        const validateSubs = requestParameters => {
            log.debug("Inside the validateSubs function", JSON.stringify(requestParameters));
            if (!mavenchecks.isNullOrEmpty(requestParameters.entity)) {
                let entityString = transformArrayToSqlFilter(requestParameters.entity);
                return query.runSuiteQL({
                    query: `SELECT id FROM subsidiary WHERE subsidiary.custrecord_oro_sagecompany IN (${entityString})`
                }).asMappedResults().map(e => {
                    log.debug("e", e);
                    return e.id;
                });
            }
            if (requestParameters.hasOwnProperty("subsidiary") && requestParameters.subsidiary.length > 0) {
                let subsidiaries = requestParameters.subsidiary.split(",").toString();
                log.debug("validateSubs found subsidiaries", subsidiaries);
                return subsidiaries;
            }
            return null;
        }

        const validateGenericParameter = (requestParameters, parameter) => {
            if (!requestParameters[parameter]) return null;
            parameter = requestParameters[parameter].split(",").reduce((concat, element) => {
                return concat += `'${element}',`
            }, "").slice(0, -1);
            log.debug("validateAccts found parameter2", parameter);
            return parameter;
        }

        const getSQL = (query, request, parameters) => {
            log.debug("Inside getSQL", `query = ${query}, request = ${request}, parameters = ${parameters}`);
            let sql;
            switch (query) {
                case "tb":
                    return "SELECT " +
                        "sub.id as subsidiary, " +
                        "acct.id as account, " +
                        "dpt.id as department, " +
                        "loc.id as location, " +
                        "TO_CHAR(prd.startdate,'YYYY') as fiscalYear, " +
                        "TO_CHAR(prd.startdate,'MM') as fiscalPeriod, " +
                        "gl.amount as amount, " +
                        "currency.symbol as currency, " +
                        "gl.amount, " +
                        "trn.id, " +
                        "REPLACE(sub.tranprefix,'-','') " +
                        "FROM transaction AS trn " +
                        "JOIN transactionLine AS line ON line.transaction = trn.id " +
                        "JOIN transactionAccountingLine as gl ON line.transaction = gl.transaction AND line.id= gl.transactionline " +
                        "JOIN accountingPeriod AS prd ON trn.postingPeriod = prd.id " +
                        "JOIN subsidiary AS sub ON line.subsidiary = sub.id " +
                        "JOIN department AS dpt ON line.department = dpt.id " +
                        "JOIN location AS loc ON line.location = loc.id " +
                        "JOIN account AS acct ON gl.account = acct.id " +
                        "JOIN currency ON trn.currency = currency.id " +
                        "FETCH FIRST 10 ROWS ONLY;"
                case "bal":
                case "tb_balances":
                    sql = "SELECT " +
                        "sub.id as subsidiary, " +
                        "acct.id as account, " +
                        "dpt.id as department, " +
                        "loc.id as location, " +
                        "currency.symbol as currency, " +
                        "EXTRACT(year FROM TO_DATE('" + request.end + "','YYYY-MM')) as fiscalYear, " +
                        "EXTRACT(month FROM TO_DATE('" + request.end + "','YYYY-MM')) as fiscalPeriod, " +
                        "SUM(TO_NUMBER(gl.amount)) as amount, " +
                        "acct.acctnumber as account_number, " +
                        "sub.custrecord_oro_sagecompany as entity " +
                        "FROM transaction AS trn " +
                        "JOIN transactionLine AS line ON line.transaction = trn.id " +
                        "JOIN transactionAccountingLine as gl ON line.transaction = gl.transaction AND line.id= gl.transactionline " +
                        "JOIN subsidiary AS sub ON line.subsidiary = sub.id " +
                        "JOIN account AS acct ON gl.account = acct.id  " +
                        "JOIN accountingPeriod AS prd ON trn.postingPeriod = prd.id " +
                        "LEFT JOIN currency ON sub.currency = currency.id " +
                        "LEFT JOIN department AS dpt ON line.department = dpt.id " +
                        "LEFT JOIN location AS loc ON line.location = loc.id " +
                        "WHERE trn.posting = 'T' " +
                        "AND TO_NUMBER(TO_CHAR(prd.enddate,'J')) <= TO_NUMBER(TO_CHAR(TO_DATE('" + request.end + "','YYYY-MM'),'J'))";
                    log.debug("trialbalance sql stage 1", sql);
                    if (!mavenchecks.isNullOrEmpty(request.sub)) sql += " AND sub.id IN (" + request.sub + ")";
                    log.debug("trialbalance sql stage 2", sql);
                    if (!mavenchecks.isNullOrEmpty(request.acct)) sql += " AND acct.id IN (" + request.acct + ")";
                    log.debug("trialbalance sql stage 3", sql);
                    if (!mavenchecks.isNullOrEmpty(request.dpt)) sql += " AND dpt.id IN (" + request.dpt + ")";
                    log.debug("trialbalance sql stage 4", sql);
                    if (request.loc) sql += " AND loc.id IN (" + request.loc + ")";
                    log.debug("trialbalance sql stage 5", sql);
                    sql += " GROUP BY " +
                        "sub.id, " +
                        "acct.id, " +
                        "acct.acctnumber, " +
                        "dpt.id, " +
                        "loc.id, " +
                        "currency.symbol, " +
                        "prd.isadjust, " +
                        "sub.custrecord_oro_sagecompany "   // TODO: Why is "+" missing?
                    "HAVING SUM(TO_NUMBER(gl.amount)) != 0 " +
                    "ORDER BY subsidiary, account_number, department, location;";
                    return sql;
                    break;
                case "mov":
                case "tb_movements":
                case "trialbalance":
                    sql = "SELECT " +
                        "sub.id as subsidiary, " +
                        "acct.id as account, " +
                        "dpt.id as department, " +
                        "loc.id as location, " +
                        "currency.symbol as currency, " +
                        "MAX(TO_CHAR(prd.startdate,'YYYY')) as fiscalYear, " +
                        // "MAX(TO_CHAR(prd.startdate,'fMMM')) as fiscalPeriod, " +
                        "CASE WHEN prd.isadjust = 'T' THEN '13' ELSE MAX(TO_CHAR(prd.startdate,'fMMM')) END as fiscalPeriod, " + // MDIMKOV 15.03.2023: added
                        "SUM(TO_NUMBER(gl.amount)) as amount, " +
                        "acct.acctnumber as account_number, " +
                        "sub.custrecord_oro_sagecompany as entity, " +
                        "prd.isadjust as isAdjust " +
                        "FROM transaction AS trn " +
                        "JOIN transactionLine AS line ON line.transaction = trn.id " +
                        "JOIN transactionAccountingLine as gl ON line.transaction = gl.transaction AND line.id= gl.transactionline " +
                        "JOIN subsidiary AS sub ON line.subsidiary = sub.id " +
                        "JOIN account AS acct ON gl.account = acct.id  " +
                        "JOIN accountingPeriod AS prd ON trn.postingPeriod = prd.id " +
                        "LEFT JOIN currency ON sub.currency = currency.id " +
                        "LEFT JOIN department AS dpt ON line.department = dpt.id " +
                        "LEFT JOIN location AS loc ON line.location = loc.id " +
                        "WHERE trn.posting = 'T' " +
                        "AND TO_NUMBER(TO_CHAR(prd.startdate,'J')) >= TO_NUMBER(TO_CHAR(TO_DATE('" + request.start + "','YYYY-MM'),'J')) " +
                        "AND TO_NUMBER(TO_CHAR(prd.enddate,'J')) <= TO_NUMBER(TO_CHAR(ADD_MONTHS(TO_DATE('" + request.end + "','YYYY-MM'),1),'J')) " +
                        "AND (prd.isadjust = 'F' OR prd.isadjust = '" + request.isadjust + "')"; // MDIMKOV 13.03.2023: added: all non adjustments will be returned, and if isadjust is 'T', also the adjustment periods
                    log.debug("trialbalance sql stage 1", sql);
                    if (!mavenchecks.isNullOrEmpty(request.sub)) sql += " AND sub.id IN (" + request.sub + ")";
                    log.debug("trialbalance sql stage 2", sql);
                    if (!mavenchecks.isNullOrEmpty(request.acct)) sql += " AND acct.id IN (" + request.acct + ")";
                    log.debug("trialbalance sql stage 3", sql);
                    if (!mavenchecks.isNullOrEmpty(request.dpt)) sql += " AND dpt.id IN (" + request.dpt + ")";
                    log.debug("trialbalance sql stage 4", sql);
                    if (request.loc) sql += " AND loc.id IN (" + request.loc + ")";
                    log.debug("trialbalance sql stage 5", sql);
                    sql += " GROUP BY " +
                        "sub.id, " +
                        "prd.startdate, " +
                        "acct.id, " +
                        "acct.acctnumber, " +
                        "dpt.id, " +
                        "loc.id, " +
                        "currency.symbol, " +
                        "prd.isadjust, " +
                        "sub.custrecord_oro_sagecompany "   // TODO: Why is "+" missing?
                    "HAVING SUM(TO_NUMBER(gl.amount)) != 0 " +
                    "ORDER BY entity, fiscalYear, fiscalPeriod, account, department, location;";
                    return sql;
                    break;
                default:
                    return "No respective query was found.";
            }
        }

        const transformArrayToSqlFilter = arrayOfValues => {
            log.debug("transformArrayToSqlFilter 1", arrayOfValues);
            let string = arrayOfValues.split(",").reduce((concat, element) => {
                return concat += `'${element}',`
            }, "").slice(0, -1);
            log.debug("transformArrayToSqlFilter 2, arrayOfValues", arrayOfValues);
            log.debug("transformArrayToSqlFilter 2, string", arrayOfValues);
            /*let string = `'${arrayOfValues.join("','")}'`;
            log.debug("transformArrayToSqlFilter 2",arrayOfValues);*/
            return string;
        }

        return {get}
    })

/*[26 Nov 2021 07:55] Ciprian Popa
Hi, the transactions should be grouped by following:
"subsidiary":47,"account":3179,"department":null,"location":null,"fiscalYear":2021,"fiscalPeriod":8,"amount":-319.76,"currency":"EUR"
and filtered by: subsidiary, period (start day, end day); additionally, it would be great to add the filter by account (ID and/or account number)
the similar should apply also for OB (=prev month Closing Balance which is implemented already in script as agreed with Milcho), except the start date which should be the first start date/unspecified
*/