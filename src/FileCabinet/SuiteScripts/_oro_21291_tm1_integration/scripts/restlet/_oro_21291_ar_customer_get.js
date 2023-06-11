/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(["N/query", "N/search", "./lib"],

    (query, search, lib) => {
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

                // return JSON.stringify(query.runSuiteQL({query: "SELECT Top 3 * FROM customer"}).asMappedResults());

                let customers = [];

                // MDIMKOV 24.09.2021: load the customers search
                let arCustomersSearch = search.create({
                    type: "customer",
                    filters:
                        [
                        ],
                    columns:
                        [
                            search.createColumn({name: 'externalid', label: 'IntegrationID'}),
                            search.createColumn({name: 'isperson', label: 'IsIndividual'}),
                            search.createColumn({name: 'firstname', label: 'FirstName'}),
                            search.createColumn({name: 'lastname', label: 'LastName'}),
                            search.createColumn({name: 'companyname', label: 'CompanyName'}),
                            search.createColumn({name: 'entitystatus', label: 'Status'}),
                            search.createColumn({name: 'currency', label: 'Currency'}),
                            search.createColumn({name: 'subsidiary', label: 'SubsidiaryId'}),
                            search.createColumn({name: 'phone', label: 'Phone'}),
                            search.createColumn({name: 'fax', label: 'Fax'}),
                            search.createColumn({name: 'email', label: 'Email'}),
                            search.createColumn({name: 'defaulttaxreg', label: 'DefaultTaxRegNum'}),
                            search.createColumn({name: 'emailpreference', label: 'EmailPreference'}),
                            search.createColumn({name: 'receivablesaccount', label: 'DefaultARAccount'}),
                            search.createColumn({name: 'isinactive', label: 'Inactive'}),
                            search.createColumn({name: 'custentity_oro_21_book_agent_code', label: 'AgentCode'}),
                            search.createColumn({name: 'custentity_oro_21_book_firstdepdt', label: 'FirstDepartureDate'}),
                            search.createColumn({name: 'custentity_oro_21_book_firstretdt', label: 'FirstReturnDate'}),
                            search.createColumn({name: 'custentity_oro_21_book_lastdepdt', label: 'LastDepartureDate'}),
                            search.createColumn({name: 'custentity_oro_21_book_lastretdt', label: 'LastReturnDate'}),
                            search.createColumn({name: 'custentity_oro_21_book_debtor', label: 'DebtorMode'}),
                            search.createColumn({name: 'custentity_oro_21_book_date', label: 'BookingDate'}),
                            search.createColumn({name: 'custentity_oro_21_book_cancel', label: 'CancelledDate'}),
                            search.createColumn({name: 'custentity_oro_21_book_sale_type', label: 'SaleType'}),
                            search.createColumn({name: 'custentity_oro_21_book_compnumb', label: 'CompanyNumber'}),
                            search.createColumn({name: "custrecord_agent_code",join: "custentity_oro_21_book_agent_code",label: "AgentCode"}),
                            search.createColumn({name: "name",join: "custentity_oro_21_book_agent_code",label: "AgentName"}),
                            search.createColumn({name: "custrecord_agent_type",join: "custentity_oro_21_book_agent_code",label: "AgentType"}),
                            search.createColumn({name: "custrecord_agent_consortia",join: "custentity_oro_21_book_agent_code",label: "AgentConsortia"}),
                            search.createColumn({name: "custrecord_agent_addr1",join: "custentity_oro_21_book_agent_code",label: "AgentAddr1"}),
                            search.createColumn({name: "custrecord_agent_addr2",join: "custentity_oro_21_book_agent_code",label: "AgentAddr2"}),
                            search.createColumn({name: "custrecord_agent_city",join: "custentity_oro_21_book_agent_code",label: "AgentCity"}),
                            search.createColumn({name: "custrecord_agent_state",join: "custentity_oro_21_book_agent_code",label: "AgentState"}),
                            search.createColumn({name: "custrecord_agent_zip",join: "custentity_oro_21_book_agent_code",label: "AgentZip"}),
                            search.createColumn({name: "custrecord_agent_country",join: "custentity_oro_21_book_agent_code",label: "AgentCountry"}),
                            search.createColumn({name: "custrecord_agent_phone",join: "custentity_oro_21_book_agent_code",label: "AgentPhone"}),
                            search.createColumn({name: "custrecord_agent_fax",join: "custentity_oro_21_book_agent_code",label: "AgentFax"}),
                            search.createColumn({name: "custrecord_agent_email",join: "custentity_oro_21_book_agent_code",label: "AgentEmail"})
                        ]
                });

                if (requestParams.CustomerID) {
                    arCustomersSearch.filters.push(search.createFilter({
                        name: "entityid",
                        operator: query.Operator.IS,
                        values: requestParams.CustomerID
                    }));
                }

                arCustomersSearch.run().each(result => {
                    let entry = {};
                    result.columns.forEach(column => {

                        // log.audit('column', column);

                        let label = column.label;
                        let value = result.getText(column);

                        switch (label) {

                            case 'Subsidiary':
                                value = result.getValue(column);
                                break;

                            case 'BookingBrand':
                                value = result.getValue(column);
                                break;

                            case 'AgentCountry':
                                value = lib.countryByText(result.getText(column))[0].code;
                                break;

                            case 'DefaultARAccount':
                                let flAcc = search.lookupFields({
                                    type: search.Type.ACCOUNT,
                                    id: 119,
                                    columns: ['number']
                                });

                                value = flAcc.number;
                                break;
                        }

                        if (value == null) {
                            value = result.getValue(column)
                        }

                        entry[label] = value;
                    });

                    customers.push(entry);

                    return true;
                });

                return '{"ARCustomers":' + JSON.stringify(customers) + '}';

            } catch (e) {

                log.error('ERROR', e.message + ' --- ' + e.stack);
                return e.message + ' --- ' + e.stack;

            }
        }

        return {get}
    });
