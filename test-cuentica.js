const axios = require('axios');
const API_KEY = '3mDWD31KH6X79elQH4nNyw1LxnLj9IYzAMMTM0hiszDTrw1ZULfRDue_yu-rMvNG7G.-iraLuWbGaviS';
axios.get('https://api.cuentica.com/document/1391917/attachment', {
    headers: { 'X-AUTH-TOKEN': API_KEY, 'Accept': 'application/json' }
}).then(r => {
    console.log(typeof r.data);
    console.log(Object.keys(r.data));
    console.log(typeof r.data.base64);
}).catch(e => console.error(e.response ? e.response.data : e.message));
