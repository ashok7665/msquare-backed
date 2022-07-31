const axios = require('axios').default;
let token;

async function login(){

    //Premjangir34
    const response = await axios.post('https://your-rest-implementation.com/api/authorize', {
        login: 'PremJangir34',
        lastName: 'Pljangir34'
      });

    // if(response && response['ok']){
    //     this.token = response['d'].token;
    // }
    console.log('response ', response)
    return response;
}


login().then(response =>{}).catch(e=>console.error(e))


