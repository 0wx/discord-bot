const axios = require('axios');
const api = 'https://keep.directory/newPost';
module.exports = async (data) => {
    let headers =  { headers: { 'x-auth': process.env.AUTH }};
    if (process.env.NODE_ENV === 'production') await axios.post(api, data, headers);
    console.log(data);
}