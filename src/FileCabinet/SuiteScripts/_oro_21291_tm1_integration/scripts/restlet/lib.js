/**
 * travizer.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/record', 'N/search', 'N/cache'],

    function (record, search, cache) {
        /**
         * @param {record} record
         * @param {search} search
         * @param {cache} cache
         */


        /* =============== LOAD ITEM IRRESPECTIVE OF ITEM TYPE =============== */

        /*
     * MDIMKOV 28.03.2020: this function loads an item record, irrespective of each type, as otherwise the type needs to be known and set respectively
     *
     * RETURNS: item record instance
     *
     * USAGE:
     *
     * var recItem = loadItemRec(itemId);
     *
     * */

        function loadItemRec(theId) {

            var itemTypes = [record.Type.SERVICE_ITEM,
                record.Type.INVENTORY_ITEM, record.Type.NON_INVENTORY_ITEM, record.Type.OTHER_CHARGE_ITEM, record.Type.ASSEMBLY_ITEM,
                record.Type.DESCRIPTION_ITEM, record.Type.DISCOUNT_ITEM, record.Type.DOWNLOAD_ITEM, record.Type.GIFT_CERTIFICATE_ITEM,
                record.Type.KIT_ITEM, record.Type.LOT_NUMBERED_ASSEMBLY_ITEM, record.Type.LOT_NUMBERED_INVENTORY_ITEM, record.Type.MARKUP_ITEM,
                record.Type.PAYMENT_ITEM, record.Type.PAYROLL_ITEM, record.Type.REALLOCATE_ITEM, record.Type.SALES_TAX_ITEM,
                record.Type.SERIALIZED_ASSEMBLY_ITEM, record.Type.SERIALIZED_INVENTORY_ITEM, record.Type.SHIP_ITEM, record.Type.SUBTOTAL_ITEM];

            for (var n = 0; n < itemTypes.length; n++) {

                try {

                    var recItem = record.load({
                        type: itemTypes[n],
                        id: theId
                    });

                    return recItem;

                } catch (e) {
                }

            }

        }


        /* =============== GET POSTING PERIOD FOR A GIVEN DATE =============== */

        /*
     * MDIMKOV 02.01.2018: this function gets the posting period for a given date (e.g. 'Mar 2020')
     *
     * RETURNS: string containing the posting period, such as 'Mar 2020'
     *
     * USAGE:
     *
     * var postPeriod = getPostingPeriod(new Date);
     *
     * to set the posting peiod on a transaction, use the following:
     * var today = new Date;
     * recJE.setText('postingperiod', getPostingPeriod(today))
     *
     * */


        function getPostingPeriod(dtDate) {

            var sAcctPeriod = '';

            var iYear = dtDate.getFullYear();

            var months = new Array(12);
            months[0] = 'Jan';
            months[1] = 'Feb';
            months[2] = 'Mar';
            months[3] = 'Apr';
            months[4] = 'May';
            months[5] = 'Jun';
            months[6] = 'Jul';
            months[7] = 'Aug';
            months[8] = 'Sep';
            months[9] = 'Oct';
            months[10] = 'Nov';
            months[11] = 'Dec';

            var current_date = new Date();

            month_value = current_date.getMonth();

            sAcctPeriod = months[month_value] + ' ' + iYear;

            return sAcctPeriod;
        }


        /* =============== CHECK IF AN ARRAY CONTAINS A GIVEN OBJECT =============== */

        /*
     * MDIMKOV 01.12.2018: this function checks if an element (obj) is included in an array (arr)
     *
     * RETURNS: boolean
     *
     * USAGE:
     *
     * var myArray = ['a', 'b', 'c'];
     *
     * var isInArray = arrayContains(myArray 'b');
     *
     * */


        function arrayContains(arr, obj) {

            if (arr) {


                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] == obj) {
                        return true;
                    }
                }
                return false;


            } else {

                return false;

            }

        }


        /* =============== LOG A VERY LONG STRING, SUCH AS A JSON / REQUEST BODY ETC. =============== */

        /*
     * MDIMKOV 13.06.2020: this function logs very long strings
     *
     * RETURNS: void
     *
     * USAGE:
     *
     * longLog('audit', 'myTitle', varToLog);
     *
     * */


        function longLog(sType, sTitle, varToLog) {

            var logSteps = varToLog.length / 4000;

            if (sType == 'audit') {

                for (var i = 0; i < logSteps; i++) {

                    switch (sType) {

                        case 'debug':
                            log.debug(sTitle + '-' + parseInt(i + 1), varToLog.substr(i * 3999, (i + 1) * 3999));
                            break;

                        case 'audit':
                            log.audit(sTitle + '-' + parseInt(i + 1), varToLog.substr(i * 3999, (i + 1) * 3999));
                            break;

                        case 'error':
                            log.error(sTitle + '-' + parseInt(i + 1), varToLog.substr(i * 3999, (i + 1) * 3999));
                            break;

                    }

                }

            }

        }


        /* =============== Get the ID and the code of a country by looking for its name/text =============== */

        /*
     * MDIMKOV 13.06.2021: this function finds the id and code of a country by looking for its name/tex
     *
     * RETURNS: array
     *
     * USAGE:
     *
     * countryByText('United Kingdom');	// expected result: [{text:"United Kingdom",code:"GB",id:"77"}]
     *
     * */


        function countryByText(inputVar) {

            var returnObject = [];

            var returnObject = [];

            var country_list =
                [
                    {"text": "Afghanistan", "code": "AF", "id": "3"},
                    {"text": "Aland Islands", "code": "AX", "id": "247"},
                    {"text": "Albania", "code": "AL", "id": "6"},
                    {"text": "Algeria", "code": "DZ", "id": "62"},
                    {"text": "American Samoa", "code": "AS", "id": "12"},
                    {"text": "Andorra", "code": "AD", "id": "1"},
                    {"text": "Angola", "code": "AO", "id": "9"},
                    {"text": "Anguilla", "code": "AI", "id": "5"},
                    {"text": "Antarctica", "code": "AQ", "id": "10"},
                    {"text": "Antigua and Barbuda", "code": "AG", "id": "4"},
                    {"text": "Argentina", "code": "AR", "id": "11"},
                    {"text": "Armenia", "code": "AM", "id": "7"},
                    {"text": "Aruba", "code": "AW", "id": "15"},
                    {"text": "Australia", "code": "AU", "id": "14"},
                    {"text": "Austria", "code": "AT", "id": "13"},
                    {"text": "Azerbaijan", "code": "AZ", "id": "16"},
                    {"text": "Bahamas", "code": "BS", "id": "31"},
                    {"text": "Bahrain", "code": "BH", "id": "23"},
                    {"text": "Bangladesh", "code": "BD", "id": "19"},
                    {"text": "Barbados", "code": "BB", "id": "18"},
                    {"text": "Belarus", "code": "BY", "id": "35"},
                    {"text": "Belgium", "code": "BE", "id": "20"},
                    {"text": "Belize", "code": "BZ", "id": "36"},
                    {"text": "Benin", "code": "BJ", "id": "25"},
                    {"text": "Bermuda", "code": "BM", "id": "27"},
                    {"text": "Bhutan", "code": "BT", "id": "32"},
                    {"text": "Bolivia", "code": "BO", "id": "29"},
                    {"text": "Bonaire, Saint Eustatius and Saba", "code": "BQ", "id": "250"},
                    {"text": "Bosnia and Herzegovina", "code": "BA", "id": "17"},
                    {"text": "Botswana", "code": "BW", "id": "34"},
                    {"text": "Bouvet Island", "code": "BV", "id": "33"},
                    {"text": "Brazil", "code": "BR", "id": "30"},
                    {"text": "British Indian Ocean Territory", "code": "IO", "id": "106"},
                    {"text": "Brunei Darussalam", "code": "BN", "id": "28"},
                    {"text": "Bulgaria", "code": "BG", "id": "22"},
                    {"text": "Burkina Faso", "code": "BF", "id": "21"},
                    {"text": "Burundi", "code": "BI", "id": "24"},
                    {"text": "Cambodia", "code": "KH", "id": "117"},
                    {"text": "Cameroon", "code": "CM", "id": "46"},
                    {"text": "Canada", "code": "CA", "id": "37"},
                    {"text": "Canary Islands", "code": "IC", "id": "249"},
                    {"text": "Cape Verde", "code": "CV", "id": "53"},
                    {"text": "Cayman Islands", "code": "KY", "id": "124"},
                    {"text": "Central African Republic", "code": "CF", "id": "40"},
                    {"text": "Ceuta and Melilla", "code": "EA", "id": "248"},
                    {"text": "Chad", "code": "TD", "id": "212"},
                    {"text": "Chile", "code": "CL", "id": "45"},
                    {"text": "China", "code": "CN", "id": "47"},
                    {"text": "Christmas Island", "code": "CX", "id": "54"},
                    {"text": "Cocos (Keeling) Islands", "code": "CC", "id": "38"},
                    {"text": "Colombia", "code": "CO", "id": "48"},
                    {"text": "Comoros", "code": "KM", "id": "119"},
                    {"text": "Congo, Democratic Republic of", "code": "CD", "id": "39"},
                    {"text": "Congo, Republic of", "code": "CG", "id": "41"},
                    {"text": "Cook Islands", "code": "CK", "id": "44"},
                    {"text": "Costa Rica", "code": "CR", "id": "49"},
                    {"text": "Cote d\u0027Ivoire", "code": "CI", "id": "43"},
                    {"text": "Croatia/Hrvatska", "code": "HR", "id": "98"},
                    {"text": "Cuba", "code": "CU", "id": "52"},
                    {"text": "Curaçao", "code": "CW", "id": "251"},
                    {"text": "Cyprus", "code": "CY", "id": "55"},
                    {"text": "Czech Republic", "code": "CZ", "id": "56"},
                    {"text": "Denmark", "code": "DK", "id": "59"},
                    {"text": "Djibouti", "code": "DJ", "id": "58"},
                    {"text": "Dominica", "code": "DM", "id": "60"},
                    {"text": "Dominican Republic", "code": "DO", "id": "61"},
                    {"text": "East Timor", "code": "TL", "id": "221"},
                    {"text": "Ecuador", "code": "EC", "id": "63"},
                    {"text": "Egypt", "code": "EG", "id": "65"},
                    {"text": "El Salvador", "code": "SV", "id": "208"},
                    {"text": "Equatorial Guinea", "code": "GQ", "id": "88"},
                    {"text": "Eritrea", "code": "ER", "id": "67"},
                    {"text": "Estonia", "code": "EE", "id": "64"},
                    {"text": "Ethiopia", "code": "ET", "id": "69"},
                    {"text": "Falkland Islands", "code": "FK", "id": "72"},
                    {"text": "Faroe Islands", "code": "FO", "id": "74"},
                    {"text": "Fiji", "code": "FJ", "id": "71"},
                    {"text": "Finland", "code": "FI", "id": "70"},
                    {"text": "France", "code": "FR", "id": "75"},
                    {"text": "French Guiana", "code": "GF", "id": "80"},
                    {"text": "French Polynesia", "code": "PF", "id": "175"},
                    {"text": "French Southern Territories", "code": "TF", "id": "213"},
                    {"text": "Gabon", "code": "GA", "id": "76"},
                    {"text": "Gambia", "code": "GM", "id": "85"},
                    {"text": "Georgia", "code": "GE", "id": "79"},
                    {"text": "Germany", "code": "DE", "id": "57"},
                    {"text": "Ghana", "code": "GH", "id": "82"},
                    {"text": "Gibraltar", "code": "GI", "id": "83"},
                    {"text": "Greece", "code": "GR", "id": "89"},
                    {"text": "Greenland", "code": "GL", "id": "84"},
                    {"text": "Grenada", "code": "GD", "id": "78"},
                    {"text": "Guadeloupe", "code": "GP", "id": "87"},
                    {"text": "Guam", "code": "GU", "id": "92"},
                    {"text": "Guatemala", "code": "GT", "id": "91"},
                    {"text": "Guernsey", "code": "GG", "id": "81"},
                    {"text": "Guinea", "code": "GN", "id": "86"},
                    {"text": "Guinea-Bissau", "code": "GW", "id": "93"},
                    {"text": "Guyana", "code": "GY", "id": "94"},
                    {"text": "Haiti", "code": "HT", "id": "99"},
                    {"text": "Heard and McDonald Islands", "code": "HM", "id": "96"},
                    {"text": "Holy See (City Vatican State)", "code": "VA", "id": "233"},
                    {"text": "Honduras", "code": "HN", "id": "97"},
                    {"text": "Hong Kong", "code": "HK", "id": "95"},
                    {"text": "Hungary", "code": "HU", "id": "100"},
                    {"text": "Iceland", "code": "IS", "id": "109"},
                    {"text": "India", "code": "IN", "id": "105"},
                    {"text": "Indonesia", "code": "ID", "id": "101"},
                    {"text": "Iran (Islamic Republic of)", "code": "IR", "id": "108"},
                    {"text": "Iraq", "code": "IQ", "id": "107"},
                    {"text": "Ireland", "code": "IE", "id": "102"},
                    {"text": "Isle of Man", "code": "IM", "id": "104"},
                    {"text": "Israel", "code": "IL", "id": "103"},
                    {"text": "Italy", "code": "IT", "id": "110"},
                    {"text": "Jamaica", "code": "JM", "id": "112"},
                    {"text": "Japan", "code": "JP", "id": "114"},
                    {"text": "Jersey", "code": "JE", "id": "111"},
                    {"text": "Jordan", "code": "JO", "id": "113"},
                    {"text": "Kazakhstan", "code": "KZ", "id": "125"},
                    {"text": "Kenya", "code": "KE", "id": "115"},
                    {"text": "Kiribati", "code": "KI", "id": "118"},
                    {"text": "Korea, Democratic People\u0027s Republic", "code": "KP", "id": "121"},
                    {"text": "Korea, Republic of", "code": "KR", "id": "122"},
                    {"text": "Kosovo", "code": "XK", "id": "254"},
                    {"text": "Kuwait", "code": "KW", "id": "123"},
                    {"text": "Kyrgyzstan", "code": "KG", "id": "116"},
                    {"text": "Lao People\u0027s Democratic Republic", "code": "LA", "id": "126"},
                    {"text": "Latvia", "code": "LV", "id": "135"},
                    {"text": "Lebanon", "code": "LB", "id": "127"},
                    {"text": "Lesotho", "code": "LS", "id": "132"},
                    {"text": "Liberia", "code": "LR", "id": "131"},
                    {"text": "Libya", "code": "LY", "id": "136"},
                    {"text": "Liechtenstein", "code": "LI", "id": "129"},
                    {"text": "Lithuania", "code": "LT", "id": "133"},
                    {"text": "Luxembourg", "code": "LU", "id": "134"},
                    {"text": "Macau", "code": "MO", "id": "148"},
                    {"text": "Macedonia", "code": "MK", "id": "144"},
                    {"text": "Madagascar", "code": "MG", "id": "142"},
                    {"text": "Malawi", "code": "MW", "id": "156"},
                    {"text": "Malaysia", "code": "MY", "id": "158"},
                    {"text": "Maldives", "code": "MV", "id": "155"},
                    {"text": "Mali", "code": "ML", "id": "145"},
                    {"text": "Malta", "code": "MT", "id": "153"},
                    {"text": "Marshall Islands", "code": "MH", "id": "143"},
                    {"text": "Martinique", "code": "MQ", "id": "150"},
                    {"text": "Mauritania", "code": "MR", "id": "151"},
                    {"text": "Mauritius", "code": "MU", "id": "154"},
                    {"text": "Mayotte", "code": "YT", "id": "243"},
                    {"text": "Mexico", "code": "MX", "id": "157"},
                    {"text": "Micronesia, Federal State of", "code": "FM", "id": "73"},
                    {"text": "Moldova, Republic of", "code": "MD", "id": "139"},
                    {"text": "Monaco", "code": "MC", "id": "138"},
                    {"text": "Mongolia", "code": "MN", "id": "147"},
                    {"text": "Montenegro", "code": "ME", "id": "140"},
                    {"text": "Montserrat", "code": "MS", "id": "152"},
                    {"text": "Morocco", "code": "MA", "id": "137"},
                    {"text": "Mozambique", "code": "MZ", "id": "159"},
                    {"text": "Myanmar (Burma)", "code": "MM", "id": "146"},
                    {"text": "Namibia", "code": "NA", "id": "160"},
                    {"text": "Nauru", "code": "NR", "id": "169"},
                    {"text": "Nepal", "code": "NP", "id": "168"},
                    {"text": "Netherlands", "code": "NL", "id": "166"},
                    {"text": "New Caledonia", "code": "NC", "id": "161"},
                    {"text": "New Zealand", "code": "NZ", "id": "171"},
                    {"text": "Nicaragua", "code": "NI", "id": "165"},
                    {"text": "Niger", "code": "NE", "id": "162"},
                    {"text": "Nigeria", "code": "NG", "id": "164"},
                    {"text": "Niue", "code": "NU", "id": "170"},
                    {"text": "Norfolk Island", "code": "NF", "id": "163"},
                    {"text": "Northern Mariana Islands", "code": "MP", "id": "149"},
                    {"text": "Norway", "code": "NO", "id": "167"},
                    {"text": "Oman", "code": "OM", "id": "172"},
                    {"text": "Pakistan", "code": "PK", "id": "178"},
                    {"text": "Palau", "code": "PW", "id": "185"},
                    {"text": "Panama", "code": "PA", "id": "173"},
                    {"text": "Papua New Guinea", "code": "PG", "id": "176"},
                    {"text": "Paraguay", "code": "PY", "id": "186"},
                    {"text": "Peru", "code": "PE", "id": "174"},
                    {"text": "Philippines", "code": "PH", "id": "177"},
                    {"text": "Pitcairn Island", "code": "PN", "id": "181"},
                    {"text": "Poland", "code": "PL", "id": "179"},
                    {"text": "Portugal", "code": "PT", "id": "184"},
                    {"text": "Puerto Rico", "code": "PR", "id": "182"},
                    {"text": "Qatar", "code": "QA", "id": "187"},
                    {"text": "Reunion Island", "code": "RE", "id": "188"},
                    {"text": "Romania", "code": "RO", "id": "189"},
                    {"text": "Russian Federation", "code": "RU", "id": "190"},
                    {"text": "Rwanda", "code": "RW", "id": "191"},
                    {"text": "Saint Barthélemy", "code": "BL", "id": "26"},
                    {"text": "Saint Helena", "code": "SH", "id": "198"},
                    {"text": "Saint Kitts and Nevis", "code": "KN", "id": "120"},
                    {"text": "Saint Lucia", "code": "LC", "id": "128"},
                    {"text": "Saint Martin", "code": "MF", "id": "141"},
                    {"text": "Saint Vincent and the Grenadines", "code": "VC", "id": "234"},
                    {"text": "Samoa", "code": "WS", "id": "241"},
                    {"text": "San Marino", "code": "SM", "id": "203"},
                    {"text": "Sao Tome and Principe", "code": "ST", "id": "207"},
                    {"text": "Saudi Arabia", "code": "SA", "id": "192"},
                    {"text": "Senegal", "code": "SN", "id": "204"},
                    {"text": "Serbia", "code": "RS", "id": "50"},
                    {"text": "Seychelles", "code": "SC", "id": "194"},
                    {"text": "Sierra Leone", "code": "SL", "id": "202"},
                    {"text": "Singapore", "code": "SG", "id": "197"},
                    {"text": "Sint Maarten", "code": "SX", "id": "252"},
                    {"text": "Slovak Republic", "code": "SK", "id": "201"},
                    {"text": "Slovenia", "code": "SI", "id": "199"},
                    {"text": "Solomon Islands", "code": "SB", "id": "193"},
                    {"text": "Somalia", "code": "SO", "id": "205"},
                    {"text": "South Africa", "code": "ZA", "id": "244"},
                    {"text": "South Georgia", "code": "GS", "id": "90"},
                    {"text": "South Sudan", "code": "SS", "id": "253"},
                    {"text": "Spain", "code": "ES", "id": "68"},
                    {"text": "Sri Lanka", "code": "LK", "id": "130"},
                    {"text": "St. Pierre and Miquelon", "code": "PM", "id": "180"},
                    {"text": "State of Palestine", "code": "PS", "id": "183"},
                    {"text": "Sudan", "code": "SD", "id": "195"},
                    {"text": "Suriname", "code": "SR", "id": "206"},
                    {"text": "Svalbard and Jan Mayen Islands", "code": "SJ", "id": "200"},
                    {"text": "Swaziland", "code": "SZ", "id": "210"},
                    {"text": "Sweden", "code": "SE", "id": "196"},
                    {"text": "Switzerland", "code": "CH", "id": "42"},
                    {"text": "Syrian Arab Republic", "code": "SY", "id": "209"},
                    {"text": "Taiwan", "code": "TW", "id": "225"},
                    {"text": "Tajikistan", "code": "TJ", "id": "216"},
                    {"text": "Tanzania", "code": "TZ", "id": "226"},
                    {"text": "Thailand", "code": "TH", "id": "215"},
                    {"text": "Togo", "code": "TG", "id": "214"},
                    {"text": "Tokelau", "code": "TK", "id": "217"},
                    {"text": "Tonga", "code": "TO", "id": "220"},
                    {"text": "Trinidad and Tobago", "code": "TT", "id": "223"},
                    {"text": "Tunisia", "code": "TN", "id": "219"},
                    {"text": "Turkey", "code": "TR", "id": "222"},
                    {"text": "Turkmenistan", "code": "TM", "id": "218"},
                    {"text": "Turks and Caicos Islands", "code": "TC", "id": "211"},
                    {"text": "Tuvalu", "code": "TV", "id": "224"},
                    {"text": "Uganda", "code": "UG", "id": "228"},
                    {"text": "Ukraine", "code": "UA", "id": "227"},
                    {"text": "United Arab Emirates", "code": "AE", "id": "2"},
                    {"text": "United Kingdom", "code": "GB", "id": "77"},
                    {"text": "United States", "code": "US", "id": "230"},
                    {"text": "Uruguay", "code": "UY", "id": "231"},
                    {"text": "US Minor Outlying Islands", "code": "UM", "id": "229"},
                    {"text": "Uzbekistan", "code": "UZ", "id": "232"},
                    {"text": "Vanuatu", "code": "VU", "id": "239"},
                    {"text": "Venezuela", "code": "VE", "id": "235"},
                    {"text": "Vietnam", "code": "VN", "id": "238"},
                    {"text": "Virgin Islands (British)", "code": "VG", "id": "236"},
                    {"text": "Virgin Islands (USA)", "code": "VI", "id": "237"},
                    {"text": "Wallis and Futuna", "code": "WF", "id": "240"},
                    {"text": "Western Sahara", "code": "EH", "id": "66"},
                    {"text": "Yemen", "code": "YE", "id": "242"},
                    {"text": "Zambia", "code": "ZM", "id": "245"},
                    {"text": "Zimbabwe", "code": "ZW", "id": "246"}
                ];

            returnObject = country_list.filter(function (x) {
                return x.text == inputVar;
            });

            return returnObject;

        }


        /* =============== Get the name/text and the code of a country by looking for its ID =============== */

        /*
     * MDIMKOV 13.06.2021: this function finds the name/text and the code of a country by looking for its ID
     *
     * RETURNS: array
     *
     * USAGE:
     *
     * countryById('77');	// expected result: [{text:"United Kingdom",code:"GB",id:"77"}]
     *
     * */


        function countryById(inputVar) {

            var returnObject = [];

            var country_list =
                [
                    {"text": "Afghanistan", "code": "AF", "id": "3"},
                    {"text": "Aland Islands", "code": "AX", "id": "247"},
                    {"text": "Albania", "code": "AL", "id": "6"},
                    {"text": "Algeria", "code": "DZ", "id": "62"},
                    {"text": "American Samoa", "code": "AS", "id": "12"},
                    {"text": "Andorra", "code": "AD", "id": "1"},
                    {"text": "Angola", "code": "AO", "id": "9"},
                    {"text": "Anguilla", "code": "AI", "id": "5"},
                    {"text": "Antarctica", "code": "AQ", "id": "10"},
                    {"text": "Antigua and Barbuda", "code": "AG", "id": "4"},
                    {"text": "Argentina", "code": "AR", "id": "11"},
                    {"text": "Armenia", "code": "AM", "id": "7"},
                    {"text": "Aruba", "code": "AW", "id": "15"},
                    {"text": "Australia", "code": "AU", "id": "14"},
                    {"text": "Austria", "code": "AT", "id": "13"},
                    {"text": "Azerbaijan", "code": "AZ", "id": "16"},
                    {"text": "Bahamas", "code": "BS", "id": "31"},
                    {"text": "Bahrain", "code": "BH", "id": "23"},
                    {"text": "Bangladesh", "code": "BD", "id": "19"},
                    {"text": "Barbados", "code": "BB", "id": "18"},
                    {"text": "Belarus", "code": "BY", "id": "35"},
                    {"text": "Belgium", "code": "BE", "id": "20"},
                    {"text": "Belize", "code": "BZ", "id": "36"},
                    {"text": "Benin", "code": "BJ", "id": "25"},
                    {"text": "Bermuda", "code": "BM", "id": "27"},
                    {"text": "Bhutan", "code": "BT", "id": "32"},
                    {"text": "Bolivia", "code": "BO", "id": "29"},
                    {"text": "Bonaire, Saint Eustatius and Saba", "code": "BQ", "id": "250"},
                    {"text": "Bosnia and Herzegovina", "code": "BA", "id": "17"},
                    {"text": "Botswana", "code": "BW", "id": "34"},
                    {"text": "Bouvet Island", "code": "BV", "id": "33"},
                    {"text": "Brazil", "code": "BR", "id": "30"},
                    {"text": "British Indian Ocean Territory", "code": "IO", "id": "106"},
                    {"text": "Brunei Darussalam", "code": "BN", "id": "28"},
                    {"text": "Bulgaria", "code": "BG", "id": "22"},
                    {"text": "Burkina Faso", "code": "BF", "id": "21"},
                    {"text": "Burundi", "code": "BI", "id": "24"},
                    {"text": "Cambodia", "code": "KH", "id": "117"},
                    {"text": "Cameroon", "code": "CM", "id": "46"},
                    {"text": "Canada", "code": "CA", "id": "37"},
                    {"text": "Canary Islands", "code": "IC", "id": "249"},
                    {"text": "Cape Verde", "code": "CV", "id": "53"},
                    {"text": "Cayman Islands", "code": "KY", "id": "124"},
                    {"text": "Central African Republic", "code": "CF", "id": "40"},
                    {"text": "Ceuta and Melilla", "code": "EA", "id": "248"},
                    {"text": "Chad", "code": "TD", "id": "212"},
                    {"text": "Chile", "code": "CL", "id": "45"},
                    {"text": "China", "code": "CN", "id": "47"},
                    {"text": "Christmas Island", "code": "CX", "id": "54"},
                    {"text": "Cocos (Keeling) Islands", "code": "CC", "id": "38"},
                    {"text": "Colombia", "code": "CO", "id": "48"},
                    {"text": "Comoros", "code": "KM", "id": "119"},
                    {"text": "Congo, Democratic Republic of", "code": "CD", "id": "39"},
                    {"text": "Congo, Republic of", "code": "CG", "id": "41"},
                    {"text": "Cook Islands", "code": "CK", "id": "44"},
                    {"text": "Costa Rica", "code": "CR", "id": "49"},
                    {"text": "Cote d\u0027Ivoire", "code": "CI", "id": "43"},
                    {"text": "Croatia/Hrvatska", "code": "HR", "id": "98"},
                    {"text": "Cuba", "code": "CU", "id": "52"},
                    {"text": "Curaçao", "code": "CW", "id": "251"},
                    {"text": "Cyprus", "code": "CY", "id": "55"},
                    {"text": "Czech Republic", "code": "CZ", "id": "56"},
                    {"text": "Denmark", "code": "DK", "id": "59"},
                    {"text": "Djibouti", "code": "DJ", "id": "58"},
                    {"text": "Dominica", "code": "DM", "id": "60"},
                    {"text": "Dominican Republic", "code": "DO", "id": "61"},
                    {"text": "East Timor", "code": "TL", "id": "221"},
                    {"text": "Ecuador", "code": "EC", "id": "63"},
                    {"text": "Egypt", "code": "EG", "id": "65"},
                    {"text": "El Salvador", "code": "SV", "id": "208"},
                    {"text": "Equatorial Guinea", "code": "GQ", "id": "88"},
                    {"text": "Eritrea", "code": "ER", "id": "67"},
                    {"text": "Estonia", "code": "EE", "id": "64"},
                    {"text": "Ethiopia", "code": "ET", "id": "69"},
                    {"text": "Falkland Islands", "code": "FK", "id": "72"},
                    {"text": "Faroe Islands", "code": "FO", "id": "74"},
                    {"text": "Fiji", "code": "FJ", "id": "71"},
                    {"text": "Finland", "code": "FI", "id": "70"},
                    {"text": "France", "code": "FR", "id": "75"},
                    {"text": "French Guiana", "code": "GF", "id": "80"},
                    {"text": "French Polynesia", "code": "PF", "id": "175"},
                    {"text": "French Southern Territories", "code": "TF", "id": "213"},
                    {"text": "Gabon", "code": "GA", "id": "76"},
                    {"text": "Gambia", "code": "GM", "id": "85"},
                    {"text": "Georgia", "code": "GE", "id": "79"},
                    {"text": "Germany", "code": "DE", "id": "57"},
                    {"text": "Ghana", "code": "GH", "id": "82"},
                    {"text": "Gibraltar", "code": "GI", "id": "83"},
                    {"text": "Greece", "code": "GR", "id": "89"},
                    {"text": "Greenland", "code": "GL", "id": "84"},
                    {"text": "Grenada", "code": "GD", "id": "78"},
                    {"text": "Guadeloupe", "code": "GP", "id": "87"},
                    {"text": "Guam", "code": "GU", "id": "92"},
                    {"text": "Guatemala", "code": "GT", "id": "91"},
                    {"text": "Guernsey", "code": "GG", "id": "81"},
                    {"text": "Guinea", "code": "GN", "id": "86"},
                    {"text": "Guinea-Bissau", "code": "GW", "id": "93"},
                    {"text": "Guyana", "code": "GY", "id": "94"},
                    {"text": "Haiti", "code": "HT", "id": "99"},
                    {"text": "Heard and McDonald Islands", "code": "HM", "id": "96"},
                    {"text": "Holy See (City Vatican State)", "code": "VA", "id": "233"},
                    {"text": "Honduras", "code": "HN", "id": "97"},
                    {"text": "Hong Kong", "code": "HK", "id": "95"},
                    {"text": "Hungary", "code": "HU", "id": "100"},
                    {"text": "Iceland", "code": "IS", "id": "109"},
                    {"text": "India", "code": "IN", "id": "105"},
                    {"text": "Indonesia", "code": "ID", "id": "101"},
                    {"text": "Iran (Islamic Republic of)", "code": "IR", "id": "108"},
                    {"text": "Iraq", "code": "IQ", "id": "107"},
                    {"text": "Ireland", "code": "IE", "id": "102"},
                    {"text": "Isle of Man", "code": "IM", "id": "104"},
                    {"text": "Israel", "code": "IL", "id": "103"},
                    {"text": "Italy", "code": "IT", "id": "110"},
                    {"text": "Jamaica", "code": "JM", "id": "112"},
                    {"text": "Japan", "code": "JP", "id": "114"},
                    {"text": "Jersey", "code": "JE", "id": "111"},
                    {"text": "Jordan", "code": "JO", "id": "113"},
                    {"text": "Kazakhstan", "code": "KZ", "id": "125"},
                    {"text": "Kenya", "code": "KE", "id": "115"},
                    {"text": "Kiribati", "code": "KI", "id": "118"},
                    {"text": "Korea, Democratic People\u0027s Republic", "code": "KP", "id": "121"},
                    {"text": "Korea, Republic of", "code": "KR", "id": "122"},
                    {"text": "Kosovo", "code": "XK", "id": "254"},
                    {"text": "Kuwait", "code": "KW", "id": "123"},
                    {"text": "Kyrgyzstan", "code": "KG", "id": "116"},
                    {"text": "Lao People\u0027s Democratic Republic", "code": "LA", "id": "126"},
                    {"text": "Latvia", "code": "LV", "id": "135"},
                    {"text": "Lebanon", "code": "LB", "id": "127"},
                    {"text": "Lesotho", "code": "LS", "id": "132"},
                    {"text": "Liberia", "code": "LR", "id": "131"},
                    {"text": "Libya", "code": "LY", "id": "136"},
                    {"text": "Liechtenstein", "code": "LI", "id": "129"},
                    {"text": "Lithuania", "code": "LT", "id": "133"},
                    {"text": "Luxembourg", "code": "LU", "id": "134"},
                    {"text": "Macau", "code": "MO", "id": "148"},
                    {"text": "Macedonia", "code": "MK", "id": "144"},
                    {"text": "Madagascar", "code": "MG", "id": "142"},
                    {"text": "Malawi", "code": "MW", "id": "156"},
                    {"text": "Malaysia", "code": "MY", "id": "158"},
                    {"text": "Maldives", "code": "MV", "id": "155"},
                    {"text": "Mali", "code": "ML", "id": "145"},
                    {"text": "Malta", "code": "MT", "id": "153"},
                    {"text": "Marshall Islands", "code": "MH", "id": "143"},
                    {"text": "Martinique", "code": "MQ", "id": "150"},
                    {"text": "Mauritania", "code": "MR", "id": "151"},
                    {"text": "Mauritius", "code": "MU", "id": "154"},
                    {"text": "Mayotte", "code": "YT", "id": "243"},
                    {"text": "Mexico", "code": "MX", "id": "157"},
                    {"text": "Micronesia, Federal State of", "code": "FM", "id": "73"},
                    {"text": "Moldova, Republic of", "code": "MD", "id": "139"},
                    {"text": "Monaco", "code": "MC", "id": "138"},
                    {"text": "Mongolia", "code": "MN", "id": "147"},
                    {"text": "Montenegro", "code": "ME", "id": "140"},
                    {"text": "Montserrat", "code": "MS", "id": "152"},
                    {"text": "Morocco", "code": "MA", "id": "137"},
                    {"text": "Mozambique", "code": "MZ", "id": "159"},
                    {"text": "Myanmar (Burma)", "code": "MM", "id": "146"},
                    {"text": "Namibia", "code": "NA", "id": "160"},
                    {"text": "Nauru", "code": "NR", "id": "169"},
                    {"text": "Nepal", "code": "NP", "id": "168"},
                    {"text": "Netherlands", "code": "NL", "id": "166"},
                    {"text": "New Caledonia", "code": "NC", "id": "161"},
                    {"text": "New Zealand", "code": "NZ", "id": "171"},
                    {"text": "Nicaragua", "code": "NI", "id": "165"},
                    {"text": "Niger", "code": "NE", "id": "162"},
                    {"text": "Nigeria", "code": "NG", "id": "164"},
                    {"text": "Niue", "code": "NU", "id": "170"},
                    {"text": "Norfolk Island", "code": "NF", "id": "163"},
                    {"text": "Northern Mariana Islands", "code": "MP", "id": "149"},
                    {"text": "Norway", "code": "NO", "id": "167"},
                    {"text": "Oman", "code": "OM", "id": "172"},
                    {"text": "Pakistan", "code": "PK", "id": "178"},
                    {"text": "Palau", "code": "PW", "id": "185"},
                    {"text": "Panama", "code": "PA", "id": "173"},
                    {"text": "Papua New Guinea", "code": "PG", "id": "176"},
                    {"text": "Paraguay", "code": "PY", "id": "186"},
                    {"text": "Peru", "code": "PE", "id": "174"},
                    {"text": "Philippines", "code": "PH", "id": "177"},
                    {"text": "Pitcairn Island", "code": "PN", "id": "181"},
                    {"text": "Poland", "code": "PL", "id": "179"},
                    {"text": "Portugal", "code": "PT", "id": "184"},
                    {"text": "Puerto Rico", "code": "PR", "id": "182"},
                    {"text": "Qatar", "code": "QA", "id": "187"},
                    {"text": "Reunion Island", "code": "RE", "id": "188"},
                    {"text": "Romania", "code": "RO", "id": "189"},
                    {"text": "Russian Federation", "code": "RU", "id": "190"},
                    {"text": "Rwanda", "code": "RW", "id": "191"},
                    {"text": "Saint Barthélemy", "code": "BL", "id": "26"},
                    {"text": "Saint Helena", "code": "SH", "id": "198"},
                    {"text": "Saint Kitts and Nevis", "code": "KN", "id": "120"},
                    {"text": "Saint Lucia", "code": "LC", "id": "128"},
                    {"text": "Saint Martin", "code": "MF", "id": "141"},
                    {"text": "Saint Vincent and the Grenadines", "code": "VC", "id": "234"},
                    {"text": "Samoa", "code": "WS", "id": "241"},
                    {"text": "San Marino", "code": "SM", "id": "203"},
                    {"text": "Sao Tome and Principe", "code": "ST", "id": "207"},
                    {"text": "Saudi Arabia", "code": "SA", "id": "192"},
                    {"text": "Senegal", "code": "SN", "id": "204"},
                    {"text": "Serbia", "code": "RS", "id": "50"},
                    {"text": "Seychelles", "code": "SC", "id": "194"},
                    {"text": "Sierra Leone", "code": "SL", "id": "202"},
                    {"text": "Singapore", "code": "SG", "id": "197"},
                    {"text": "Sint Maarten", "code": "SX", "id": "252"},
                    {"text": "Slovak Republic", "code": "SK", "id": "201"},
                    {"text": "Slovenia", "code": "SI", "id": "199"},
                    {"text": "Solomon Islands", "code": "SB", "id": "193"},
                    {"text": "Somalia", "code": "SO", "id": "205"},
                    {"text": "South Africa", "code": "ZA", "id": "244"},
                    {"text": "South Georgia", "code": "GS", "id": "90"},
                    {"text": "South Sudan", "code": "SS", "id": "253"},
                    {"text": "Spain", "code": "ES", "id": "68"},
                    {"text": "Sri Lanka", "code": "LK", "id": "130"},
                    {"text": "St. Pierre and Miquelon", "code": "PM", "id": "180"},
                    {"text": "State of Palestine", "code": "PS", "id": "183"},
                    {"text": "Sudan", "code": "SD", "id": "195"},
                    {"text": "Suriname", "code": "SR", "id": "206"},
                    {"text": "Svalbard and Jan Mayen Islands", "code": "SJ", "id": "200"},
                    {"text": "Swaziland", "code": "SZ", "id": "210"},
                    {"text": "Sweden", "code": "SE", "id": "196"},
                    {"text": "Switzerland", "code": "CH", "id": "42"},
                    {"text": "Syrian Arab Republic", "code": "SY", "id": "209"},
                    {"text": "Taiwan", "code": "TW", "id": "225"},
                    {"text": "Tajikistan", "code": "TJ", "id": "216"},
                    {"text": "Tanzania", "code": "TZ", "id": "226"},
                    {"text": "Thailand", "code": "TH", "id": "215"},
                    {"text": "Togo", "code": "TG", "id": "214"},
                    {"text": "Tokelau", "code": "TK", "id": "217"},
                    {"text": "Tonga", "code": "TO", "id": "220"},
                    {"text": "Trinidad and Tobago", "code": "TT", "id": "223"},
                    {"text": "Tunisia", "code": "TN", "id": "219"},
                    {"text": "Turkey", "code": "TR", "id": "222"},
                    {"text": "Turkmenistan", "code": "TM", "id": "218"},
                    {"text": "Turks and Caicos Islands", "code": "TC", "id": "211"},
                    {"text": "Tuvalu", "code": "TV", "id": "224"},
                    {"text": "Uganda", "code": "UG", "id": "228"},
                    {"text": "Ukraine", "code": "UA", "id": "227"},
                    {"text": "United Arab Emirates", "code": "AE", "id": "2"},
                    {"text": "United Kingdom", "code": "GB", "id": "77"},
                    {"text": "United States", "code": "US", "id": "230"},
                    {"text": "Uruguay", "code": "UY", "id": "231"},
                    {"text": "US Minor Outlying Islands", "code": "UM", "id": "229"},
                    {"text": "Uzbekistan", "code": "UZ", "id": "232"},
                    {"text": "Vanuatu", "code": "VU", "id": "239"},
                    {"text": "Venezuela", "code": "VE", "id": "235"},
                    {"text": "Vietnam", "code": "VN", "id": "238"},
                    {"text": "Virgin Islands (British)", "code": "VG", "id": "236"},
                    {"text": "Virgin Islands (USA)", "code": "VI", "id": "237"},
                    {"text": "Wallis and Futuna", "code": "WF", "id": "240"},
                    {"text": "Western Sahara", "code": "EH", "id": "66"},
                    {"text": "Yemen", "code": "YE", "id": "242"},
                    {"text": "Zambia", "code": "ZM", "id": "245"},
                    {"text": "Zimbabwe", "code": "ZW", "id": "246"}
                ];

            returnObject = country_list.filter(function (x) {
                return x.id == inputVar;
            });

            return returnObject;

        }


        /* =============== Get the ID and the name(text) of a country by looking for its code =============== */

        /*
     * MDIMKOV 13.06.2021: this function finds the ID and the name(text) of a country by looking for its code
     *
     * RETURNS: array
     *
     * USAGE:
     *
     * countryByCode('GB');	// expected result: [{text:"United Kingdom",code:"GB",id:"77"}]
     *
     * */


        function countryByCode(inputVar) {

            var returnObject = [];

            var country_list =
                [
                    {"text": "Afghanistan", "code": "AF", "id": "3"},
                    {"text": "Aland Islands", "code": "AX", "id": "247"},
                    {"text": "Albania", "code": "AL", "id": "6"},
                    {"text": "Algeria", "code": "DZ", "id": "62"},
                    {"text": "American Samoa", "code": "AS", "id": "12"},
                    {"text": "Andorra", "code": "AD", "id": "1"},
                    {"text": "Angola", "code": "AO", "id": "9"},
                    {"text": "Anguilla", "code": "AI", "id": "5"},
                    {"text": "Antarctica", "code": "AQ", "id": "10"},
                    {"text": "Antigua and Barbuda", "code": "AG", "id": "4"},
                    {"text": "Argentina", "code": "AR", "id": "11"},
                    {"text": "Armenia", "code": "AM", "id": "7"},
                    {"text": "Aruba", "code": "AW", "id": "15"},
                    {"text": "Australia", "code": "AU", "id": "14"},
                    {"text": "Austria", "code": "AT", "id": "13"},
                    {"text": "Azerbaijan", "code": "AZ", "id": "16"},
                    {"text": "Bahamas", "code": "BS", "id": "31"},
                    {"text": "Bahrain", "code": "BH", "id": "23"},
                    {"text": "Bangladesh", "code": "BD", "id": "19"},
                    {"text": "Barbados", "code": "BB", "id": "18"},
                    {"text": "Belarus", "code": "BY", "id": "35"},
                    {"text": "Belgium", "code": "BE", "id": "20"},
                    {"text": "Belize", "code": "BZ", "id": "36"},
                    {"text": "Benin", "code": "BJ", "id": "25"},
                    {"text": "Bermuda", "code": "BM", "id": "27"},
                    {"text": "Bhutan", "code": "BT", "id": "32"},
                    {"text": "Bolivia", "code": "BO", "id": "29"},
                    {"text": "Bonaire, Saint Eustatius and Saba", "code": "BQ", "id": "250"},
                    {"text": "Bosnia and Herzegovina", "code": "BA", "id": "17"},
                    {"text": "Botswana", "code": "BW", "id": "34"},
                    {"text": "Bouvet Island", "code": "BV", "id": "33"},
                    {"text": "Brazil", "code": "BR", "id": "30"},
                    {"text": "British Indian Ocean Territory", "code": "IO", "id": "106"},
                    {"text": "Brunei Darussalam", "code": "BN", "id": "28"},
                    {"text": "Bulgaria", "code": "BG", "id": "22"},
                    {"text": "Burkina Faso", "code": "BF", "id": "21"},
                    {"text": "Burundi", "code": "BI", "id": "24"},
                    {"text": "Cambodia", "code": "KH", "id": "117"},
                    {"text": "Cameroon", "code": "CM", "id": "46"},
                    {"text": "Canada", "code": "CA", "id": "37"},
                    {"text": "Canary Islands", "code": "IC", "id": "249"},
                    {"text": "Cape Verde", "code": "CV", "id": "53"},
                    {"text": "Cayman Islands", "code": "KY", "id": "124"},
                    {"text": "Central African Republic", "code": "CF", "id": "40"},
                    {"text": "Ceuta and Melilla", "code": "EA", "id": "248"},
                    {"text": "Chad", "code": "TD", "id": "212"},
                    {"text": "Chile", "code": "CL", "id": "45"},
                    {"text": "China", "code": "CN", "id": "47"},
                    {"text": "Christmas Island", "code": "CX", "id": "54"},
                    {"text": "Cocos (Keeling) Islands", "code": "CC", "id": "38"},
                    {"text": "Colombia", "code": "CO", "id": "48"},
                    {"text": "Comoros", "code": "KM", "id": "119"},
                    {"text": "Congo, Democratic Republic of", "code": "CD", "id": "39"},
                    {"text": "Congo, Republic of", "code": "CG", "id": "41"},
                    {"text": "Cook Islands", "code": "CK", "id": "44"},
                    {"text": "Costa Rica", "code": "CR", "id": "49"},
                    {"text": "Cote d\u0027Ivoire", "code": "CI", "id": "43"},
                    {"text": "Croatia/Hrvatska", "code": "HR", "id": "98"},
                    {"text": "Cuba", "code": "CU", "id": "52"},
                    {"text": "Curaçao", "code": "CW", "id": "251"},
                    {"text": "Cyprus", "code": "CY", "id": "55"},
                    {"text": "Czech Republic", "code": "CZ", "id": "56"},
                    {"text": "Denmark", "code": "DK", "id": "59"},
                    {"text": "Djibouti", "code": "DJ", "id": "58"},
                    {"text": "Dominica", "code": "DM", "id": "60"},
                    {"text": "Dominican Republic", "code": "DO", "id": "61"},
                    {"text": "East Timor", "code": "TL", "id": "221"},
                    {"text": "Ecuador", "code": "EC", "id": "63"},
                    {"text": "Egypt", "code": "EG", "id": "65"},
                    {"text": "El Salvador", "code": "SV", "id": "208"},
                    {"text": "Equatorial Guinea", "code": "GQ", "id": "88"},
                    {"text": "Eritrea", "code": "ER", "id": "67"},
                    {"text": "Estonia", "code": "EE", "id": "64"},
                    {"text": "Ethiopia", "code": "ET", "id": "69"},
                    {"text": "Falkland Islands", "code": "FK", "id": "72"},
                    {"text": "Faroe Islands", "code": "FO", "id": "74"},
                    {"text": "Fiji", "code": "FJ", "id": "71"},
                    {"text": "Finland", "code": "FI", "id": "70"},
                    {"text": "France", "code": "FR", "id": "75"},
                    {"text": "French Guiana", "code": "GF", "id": "80"},
                    {"text": "French Polynesia", "code": "PF", "id": "175"},
                    {"text": "French Southern Territories", "code": "TF", "id": "213"},
                    {"text": "Gabon", "code": "GA", "id": "76"},
                    {"text": "Gambia", "code": "GM", "id": "85"},
                    {"text": "Georgia", "code": "GE", "id": "79"},
                    {"text": "Germany", "code": "DE", "id": "57"},
                    {"text": "Ghana", "code": "GH", "id": "82"},
                    {"text": "Gibraltar", "code": "GI", "id": "83"},
                    {"text": "Greece", "code": "GR", "id": "89"},
                    {"text": "Greenland", "code": "GL", "id": "84"},
                    {"text": "Grenada", "code": "GD", "id": "78"},
                    {"text": "Guadeloupe", "code": "GP", "id": "87"},
                    {"text": "Guam", "code": "GU", "id": "92"},
                    {"text": "Guatemala", "code": "GT", "id": "91"},
                    {"text": "Guernsey", "code": "GG", "id": "81"},
                    {"text": "Guinea", "code": "GN", "id": "86"},
                    {"text": "Guinea-Bissau", "code": "GW", "id": "93"},
                    {"text": "Guyana", "code": "GY", "id": "94"},
                    {"text": "Haiti", "code": "HT", "id": "99"},
                    {"text": "Heard and McDonald Islands", "code": "HM", "id": "96"},
                    {"text": "Holy See (City Vatican State)", "code": "VA", "id": "233"},
                    {"text": "Honduras", "code": "HN", "id": "97"},
                    {"text": "Hong Kong", "code": "HK", "id": "95"},
                    {"text": "Hungary", "code": "HU", "id": "100"},
                    {"text": "Iceland", "code": "IS", "id": "109"},
                    {"text": "India", "code": "IN", "id": "105"},
                    {"text": "Indonesia", "code": "ID", "id": "101"},
                    {"text": "Iran (Islamic Republic of)", "code": "IR", "id": "108"},
                    {"text": "Iraq", "code": "IQ", "id": "107"},
                    {"text": "Ireland", "code": "IE", "id": "102"},
                    {"text": "Isle of Man", "code": "IM", "id": "104"},
                    {"text": "Israel", "code": "IL", "id": "103"},
                    {"text": "Italy", "code": "IT", "id": "110"},
                    {"text": "Jamaica", "code": "JM", "id": "112"},
                    {"text": "Japan", "code": "JP", "id": "114"},
                    {"text": "Jersey", "code": "JE", "id": "111"},
                    {"text": "Jordan", "code": "JO", "id": "113"},
                    {"text": "Kazakhstan", "code": "KZ", "id": "125"},
                    {"text": "Kenya", "code": "KE", "id": "115"},
                    {"text": "Kiribati", "code": "KI", "id": "118"},
                    {"text": "Korea, Democratic People\u0027s Republic", "code": "KP", "id": "121"},
                    {"text": "Korea, Republic of", "code": "KR", "id": "122"},
                    {"text": "Kosovo", "code": "XK", "id": "254"},
                    {"text": "Kuwait", "code": "KW", "id": "123"},
                    {"text": "Kyrgyzstan", "code": "KG", "id": "116"},
                    {"text": "Lao People\u0027s Democratic Republic", "code": "LA", "id": "126"},
                    {"text": "Latvia", "code": "LV", "id": "135"},
                    {"text": "Lebanon", "code": "LB", "id": "127"},
                    {"text": "Lesotho", "code": "LS", "id": "132"},
                    {"text": "Liberia", "code": "LR", "id": "131"},
                    {"text": "Libya", "code": "LY", "id": "136"},
                    {"text": "Liechtenstein", "code": "LI", "id": "129"},
                    {"text": "Lithuania", "code": "LT", "id": "133"},
                    {"text": "Luxembourg", "code": "LU", "id": "134"},
                    {"text": "Macau", "code": "MO", "id": "148"},
                    {"text": "Macedonia", "code": "MK", "id": "144"},
                    {"text": "Madagascar", "code": "MG", "id": "142"},
                    {"text": "Malawi", "code": "MW", "id": "156"},
                    {"text": "Malaysia", "code": "MY", "id": "158"},
                    {"text": "Maldives", "code": "MV", "id": "155"},
                    {"text": "Mali", "code": "ML", "id": "145"},
                    {"text": "Malta", "code": "MT", "id": "153"},
                    {"text": "Marshall Islands", "code": "MH", "id": "143"},
                    {"text": "Martinique", "code": "MQ", "id": "150"},
                    {"text": "Mauritania", "code": "MR", "id": "151"},
                    {"text": "Mauritius", "code": "MU", "id": "154"},
                    {"text": "Mayotte", "code": "YT", "id": "243"},
                    {"text": "Mexico", "code": "MX", "id": "157"},
                    {"text": "Micronesia, Federal State of", "code": "FM", "id": "73"},
                    {"text": "Moldova, Republic of", "code": "MD", "id": "139"},
                    {"text": "Monaco", "code": "MC", "id": "138"},
                    {"text": "Mongolia", "code": "MN", "id": "147"},
                    {"text": "Montenegro", "code": "ME", "id": "140"},
                    {"text": "Montserrat", "code": "MS", "id": "152"},
                    {"text": "Morocco", "code": "MA", "id": "137"},
                    {"text": "Mozambique", "code": "MZ", "id": "159"},
                    {"text": "Myanmar (Burma)", "code": "MM", "id": "146"},
                    {"text": "Namibia", "code": "NA", "id": "160"},
                    {"text": "Nauru", "code": "NR", "id": "169"},
                    {"text": "Nepal", "code": "NP", "id": "168"},
                    {"text": "Netherlands", "code": "NL", "id": "166"},
                    {"text": "New Caledonia", "code": "NC", "id": "161"},
                    {"text": "New Zealand", "code": "NZ", "id": "171"},
                    {"text": "Nicaragua", "code": "NI", "id": "165"},
                    {"text": "Niger", "code": "NE", "id": "162"},
                    {"text": "Nigeria", "code": "NG", "id": "164"},
                    {"text": "Niue", "code": "NU", "id": "170"},
                    {"text": "Norfolk Island", "code": "NF", "id": "163"},
                    {"text": "Northern Mariana Islands", "code": "MP", "id": "149"},
                    {"text": "Norway", "code": "NO", "id": "167"},
                    {"text": "Oman", "code": "OM", "id": "172"},
                    {"text": "Pakistan", "code": "PK", "id": "178"},
                    {"text": "Palau", "code": "PW", "id": "185"},
                    {"text": "Panama", "code": "PA", "id": "173"},
                    {"text": "Papua New Guinea", "code": "PG", "id": "176"},
                    {"text": "Paraguay", "code": "PY", "id": "186"},
                    {"text": "Peru", "code": "PE", "id": "174"},
                    {"text": "Philippines", "code": "PH", "id": "177"},
                    {"text": "Pitcairn Island", "code": "PN", "id": "181"},
                    {"text": "Poland", "code": "PL", "id": "179"},
                    {"text": "Portugal", "code": "PT", "id": "184"},
                    {"text": "Puerto Rico", "code": "PR", "id": "182"},
                    {"text": "Qatar", "code": "QA", "id": "187"},
                    {"text": "Reunion Island", "code": "RE", "id": "188"},
                    {"text": "Romania", "code": "RO", "id": "189"},
                    {"text": "Russian Federation", "code": "RU", "id": "190"},
                    {"text": "Rwanda", "code": "RW", "id": "191"},
                    {"text": "Saint Barthélemy", "code": "BL", "id": "26"},
                    {"text": "Saint Helena", "code": "SH", "id": "198"},
                    {"text": "Saint Kitts and Nevis", "code": "KN", "id": "120"},
                    {"text": "Saint Lucia", "code": "LC", "id": "128"},
                    {"text": "Saint Martin", "code": "MF", "id": "141"},
                    {"text": "Saint Vincent and the Grenadines", "code": "VC", "id": "234"},
                    {"text": "Samoa", "code": "WS", "id": "241"},
                    {"text": "San Marino", "code": "SM", "id": "203"},
                    {"text": "Sao Tome and Principe", "code": "ST", "id": "207"},
                    {"text": "Saudi Arabia", "code": "SA", "id": "192"},
                    {"text": "Senegal", "code": "SN", "id": "204"},
                    {"text": "Serbia", "code": "RS", "id": "50"},
                    {"text": "Seychelles", "code": "SC", "id": "194"},
                    {"text": "Sierra Leone", "code": "SL", "id": "202"},
                    {"text": "Singapore", "code": "SG", "id": "197"},
                    {"text": "Sint Maarten", "code": "SX", "id": "252"},
                    {"text": "Slovak Republic", "code": "SK", "id": "201"},
                    {"text": "Slovenia", "code": "SI", "id": "199"},
                    {"text": "Solomon Islands", "code": "SB", "id": "193"},
                    {"text": "Somalia", "code": "SO", "id": "205"},
                    {"text": "South Africa", "code": "ZA", "id": "244"},
                    {"text": "South Georgia", "code": "GS", "id": "90"},
                    {"text": "South Sudan", "code": "SS", "id": "253"},
                    {"text": "Spain", "code": "ES", "id": "68"},
                    {"text": "Sri Lanka", "code": "LK", "id": "130"},
                    {"text": "St. Pierre and Miquelon", "code": "PM", "id": "180"},
                    {"text": "State of Palestine", "code": "PS", "id": "183"},
                    {"text": "Sudan", "code": "SD", "id": "195"},
                    {"text": "Suriname", "code": "SR", "id": "206"},
                    {"text": "Svalbard and Jan Mayen Islands", "code": "SJ", "id": "200"},
                    {"text": "Swaziland", "code": "SZ", "id": "210"},
                    {"text": "Sweden", "code": "SE", "id": "196"},
                    {"text": "Switzerland", "code": "CH", "id": "42"},
                    {"text": "Syrian Arab Republic", "code": "SY", "id": "209"},
                    {"text": "Taiwan", "code": "TW", "id": "225"},
                    {"text": "Tajikistan", "code": "TJ", "id": "216"},
                    {"text": "Tanzania", "code": "TZ", "id": "226"},
                    {"text": "Thailand", "code": "TH", "id": "215"},
                    {"text": "Togo", "code": "TG", "id": "214"},
                    {"text": "Tokelau", "code": "TK", "id": "217"},
                    {"text": "Tonga", "code": "TO", "id": "220"},
                    {"text": "Trinidad and Tobago", "code": "TT", "id": "223"},
                    {"text": "Tunisia", "code": "TN", "id": "219"},
                    {"text": "Turkey", "code": "TR", "id": "222"},
                    {"text": "Turkmenistan", "code": "TM", "id": "218"},
                    {"text": "Turks and Caicos Islands", "code": "TC", "id": "211"},
                    {"text": "Tuvalu", "code": "TV", "id": "224"},
                    {"text": "Uganda", "code": "UG", "id": "228"},
                    {"text": "Ukraine", "code": "UA", "id": "227"},
                    {"text": "United Arab Emirates", "code": "AE", "id": "2"},
                    {"text": "United Kingdom", "code": "GB", "id": "77"},
                    {"text": "United States", "code": "US", "id": "230"},
                    {"text": "Uruguay", "code": "UY", "id": "231"},
                    {"text": "US Minor Outlying Islands", "code": "UM", "id": "229"},
                    {"text": "Uzbekistan", "code": "UZ", "id": "232"},
                    {"text": "Vanuatu", "code": "VU", "id": "239"},
                    {"text": "Venezuela", "code": "VE", "id": "235"},
                    {"text": "Vietnam", "code": "VN", "id": "238"},
                    {"text": "Virgin Islands (British)", "code": "VG", "id": "236"},
                    {"text": "Virgin Islands (USA)", "code": "VI", "id": "237"},
                    {"text": "Wallis and Futuna", "code": "WF", "id": "240"},
                    {"text": "Western Sahara", "code": "EH", "id": "66"},
                    {"text": "Yemen", "code": "YE", "id": "242"},
                    {"text": "Zambia", "code": "ZM", "id": "245"},
                    {"text": "Zimbabwe", "code": "ZW", "id": "246"}
                ];

            returnObject = country_list.filter(function (x) {
                return x.code == inputVar;
            });

            return returnObject;

        }


        /* =============== Find account ID by a given account number =============== */

        /*
     * MDIMKOV 15.06.2021: this function finds the account ID of a given G/L account by looking for its account number
     *
     * RETURNS: integer (the G/L account ID)
     *
     * USAGE: var recItem = findAccountByNumber(acctNum);
     *
     * */

        function findAccountByNumber(acctNum) {

            var returnId = 0;

            var accountSearchObj = search.create({
                type: 'account',
                filters:
                    [
                        ['number', 'is', acctNum]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: 'internalid',
                            sort: search.Sort.ASC
                        })
                    ]
            });

            var accountSearchResults = accountSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            try {
                if (accountSearchResults) {
                    returnId = accountSearchResults[0].getValue(accountSearchResults[0].columns[0]);
                }
            } catch (е) {
            }

            return returnId;

        }


        /* =============== Find list value (Id) by passing the text value and create a new list member, if it doesn't exist =============== */

        /*
     * MDIMKOV 20.06.2021:  this function gets a text value that potentially exists in a List/Record;
     * 						if the text value if found, the id is returned (usefull in integrations)
     * 						if the text value is not found, the List/Record is being extended to include the new text value
     *
     * NOTE: this funcion works no matter of the drop-down is based on a custom list, a custom record or a custom segment
     *       if custom record is used, it needs to be one with INCLUDE NAME FIELD and the value need to be stored in the NAME field
     *
     * RETURNS: integer (the respective ID)
     *
     * INPUT: the text value to search for and the List/Record id (e.g. customlist_abc or customrecord_abc)
     *
     * USAGE: recCustomer.setValue('custentity_oro_21_book_brand', tvz.findListValue('IN PROGRESS', 'customlist_oro_21_saletype'));
     *
     * */

        function findListValue(value, listRecType) {

            var returnId = 0;

            var brandSearchObj = search.create({
                type: listRecType,
                filters:
                    [
                        ['name', 'is', value]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: 'internalid',
                            sort: search.Sort.ASC
                        })
                    ]
            });

            var brandSearchResults = brandSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            // MDIMKOV 20.06.2021: if result found, directly return it; otherwise, it needs to be created
            if (brandSearchResults[0]) {
                returnId = brandSearchResults[0].getValue(brandSearchResults[0].columns[0]);
            } else {
                var newListRec = record.create({
                    type: listRecType
                });

                newListRec.setValue('name', value);
                returnId = newListRec.save();
            }

            return returnId;

        }


        /* =============== Find list value (Id) by passing the text value and create a new list member, if it doesn't exist using Cache module =============== */

        /*
     * MDIMKOV 20.06.2021:  this function gets a text value that potentially exists in a List/Record;
     * 						if the text value if found, the id is returned (usefull in integrations)
     * 						if the text value is not found, the List/Record is being extended to include the new text value
     *                      the function makes use of the N/Cache module to save governance usage points
     *                      if the cache doesn't exist, it's being created (it has the same name as the listRecType value
     *                      the cache is being dropped every hour (ttl=60*60), to account for major list changes (record removed etc.)
     *                      if the text value is not found, it is also being added to the cache
     *                      if the [createIfMissing] is set to TRUE, the function will:
     *                          * add a new value to the record type
     *                          * get it's newly-created internal ID, add it to the Cache and pass it
     *
     * NOTE: this funcion works no matter of the drop-down is based on a custom list, a custom record or a custom segment
     *       if custom record is used, it needs to be one with INCLUDE NAME FIELD and the value need to be stored in the NAME field
     *
     * RETURNS: integer (the respective ID); 0 if no value was found in case you decide to not add it (createIfMissing=false)
     *
     * INPUT: the text value to search for and the List/Record id (e.g. customlist_abc or customrecord_abc); createIfMissing -- true/false
     *
     * USAGE: recCustomer.setValue('custentity_oro_21_book_brand', tvz.findListValue('IN PROGRESS', 'customlist_oro_21_saletype', true));
     *
     * */

        function findListValueCached(value, listRecType, createIfMissing) {

            var returnId = 0;

            // MDIMKOV 07.07.2021: initiate a CACHE with the name of the record/list/segment to be searched (prefixed with CACHE_)
            var listRecCache = cache.getCache({
                name: 'CACHE_' + listRecType.toUpperCase(),
                scope: cache.Scope.PUBLIC
            });

            log.debug('MDIMKOV', 'Cache loaded.');

            // MDIMKOV 08.07.2021: search for the value in question (e.g. 'Pending') -- note that the value is actually the key to search on
            returnId = listRecCache.get({
                key: value.toUpperCase()
            }) || 0;

            log.debug('returnId-1', returnId);

            // MDIMKOV 08.07.2021: there is no entry in the Cache for this value -- we need to search the record for it
            if (!returnId) {

                log.debug('MDIMKOV', 'no entry found in cache');

                var recSearchObj = search.create({
                    type: listRecType,
                    filters:
                        [
                            ['name', 'is', value]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: 'internalid',
                                sort: search.Sort.ASC
                            })
                        ]
                });

                var recSearchResults = recSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });

                // MDIMKOV 20.06.2021: if result found, add it to the Cache and directly return it
                if (recSearchResults[0]) {

                    log.debug('MDIMKOV', 'Search result found...');

                    returnId = recSearchResults[0].getValue(recSearchResults[0].columns[0]) || 0;

                    log.debug('returnId-2', returnId);

                    if (returnId) {
                        listRecCache.put({
                            key: value.toUpperCase(),
                            value: returnId,
                            ttl: 60 * 60 // one hour
                        });
                    }
                } else if (createIfMissing) { // otherwise, it needs to be created in the record and the Cache to be updated

                    log.debug('MDIMKOV', 'Add the value to the record and to the cache');

                    var newListRec = record.create({
                        type: listRecType
                    });

                    newListRec.setValue('name', value);
                    returnId = newListRec.save() || 0;

                    if (returnId) {
                        listRecCache.put({
                            key: value.toUpperCase(),
                            value: returnId,
                            ttl: 60 * 60 // one hour
                        });
                    }
                }

            }

            return returnId;

        }


        /* =============== Find the internal ID of a record by searching for its external ID =============== */

        /*
     * MDIMKOV 20.06.2021:  this function resolves a NetSuite internal ID from an external ID; in case record is not found, internalId=0 is being returned
     *
     * RETURNS: integer (the respective internal ID; 0 if not found)
     *
     * INPUT: the record type and the external ID
     *
     * USAGE: getRecIdbyExtId('customer', 123);
     *
     * */

        function getRecIdbyExtId(recordType, externalId) {

            var internalId = 0;

            var recordSearchObj = search.create({
                type: recordType,
                filters:
                    [
                        ['externalid', 'anyof', externalId]
                    ],
                columns:
                    [
                        'internalid'
                    ]
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });

            return internalId;

        }


        /* =============== Find the currency internal ID by passing the currency ISO code =============== */

        /*
     * MDIMKOV 20.06.2021:  this function resolves the currency internal ID by passing the currency ISO code
     *
     * RETURNS: integer (the respective internal ID; 0 if not found)
     *
     * INPUT: the currency ISO code such as 'EUR' or 'USD'
     *
     * USAGE: currencyISOtoID('USD');
     *
     * */

        function currencyISOtoID(isoCode) {

            var theID = 0; //the internal ID that will be returned
            var mySearch = search.create({
                type: search.Type.CURRENCY,
                filters: [
                    search.createFilter({
                        name: 'symbol',
                        operator: search.Operator.IS,
                        values: isoCode
                    })
                ],
                columns: [
                    search.createColumn({name: 'name'})
                ]
            });

            var searchResults = mySearch.run().getRange({
                start: 0,
                end: 1
            });

            for (var i = 0; i < searchResults.length; i++) {
                theID = searchResults[i].id;
            }

            return theID;

        }


        /* =============== Find the document number (tranid) for a transaction by passing its internal id =============== */

        /*
     * MDIMKOV 20.07.2021: this function returns the document number (tranid) on a transaction by passing the transaction internal id to it
     *
     * RETURNS: string (such as 'ORD55839')
     *
     * INPUT: the transaction internal ID
     *
     * USAGE: transIntIdToDocNum(23564);
     *
     * */

        function transIntIdToDocNum(internalId) {

            var docNum = '';

            if (internalId) {

                var lookUpTransaction = search.lookupFields({
                    type: search.Type.TRANSACTION,
                    id: internalId,
                    columns: ['tranid']
                });

            }

            if (lookUpTransaction) {
                docNum = lookUpTransaction.tranid;
            }

            return docNum;

        }

        function singleRecordSearch(recordType, filterArray, fieldName, isGetText, orderByFieldName, isDescending) {

            // MDIMKOV 07.06.2022: initialize the variables
            let returnValue = null;
            let columns = [];
            columns.push(fieldName);

            // MDIMKOV 07.06.2022: if the optional orderByFieldName is used, add it to the columns, so that the results can be ordered
            if (orderByFieldName) {
                columns.push(search.createColumn({
                    name: orderByFieldName,
                    sort: isDescending ? search.Sort.DESC : search.Sort.ASC
                }))
            }

            // MDIMKOV 07.06.2022: construct the search itself
            const mySearch = search.create({
                type: recordType,
                filters: filterArray,
                columns: columns
            });
            mySearch.run().each(function (result) {
                returnValue = isGetText ? result.getText(result.columns[0]) : result.getValue(result.columns[0]);
                return false; // only the single (or first) record needs to be returned
            });

            return returnValue;
        }


        return {
            loadItemRec: loadItemRec,
            getPostingPeriod: getPostingPeriod,
            longLog: longLog,
            countryByText: countryByText,
            countryById: countryById,
            countryByCode: countryByCode,
            findAccountByNumber: findAccountByNumber,
            findListValue: findListValue,
            findListValueCached: findListValueCached,
            getRecIdbyExtId: getRecIdbyExtId,
            currencyISOtoID: currencyISOtoID,
            transIntIdToDocNum: transIntIdToDocNum,
            singleRecordSearch: singleRecordSearch
        }
    });
