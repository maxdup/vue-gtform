import { requestIntercepts, responseIntercepts } from './apiInterceptors';

function responseData(fetchResponse){
  if (fetchResponse.headers.get('Content-Type') &&
      fetchResponse.headers.get('Content-Type').startsWith('application/json')){
    return fetchResponse.json();
  } else {
    return fetchResponse.text();
  }
}

function ApiFetchRequest(url, config, interceptors){

  let reqConfig = requestIntercepts(url, config, interceptors);

  let abortController = new AbortController();
  config.signal = abortController.signal;

  this.config = config;
  this.url = url;
  this.state = 'pending';

  this.cancel = () => {
    this.state = 'canceled';
    abortController.abort();
  }

  // fetch promise
  this.response = new Promise((request_resolve, request_reject) => {

    // data promise
    this.promise = new Promise((data_resolve, data_reject) => {

      fetch(url, reqConfig).then((response) => {

        let dataPromise = responseData(response);

        responseIntercepts(url, reqConfig, interceptors, response.status, dataPromise)
          .then((intercepted_response) => {

            response.json = intercepted_response;

            // success
            if (response.status >= 200 &&
                response.status < 300){
              this.state = 'complete'
              data_resolve(intercepted_response);
              request_resolve(response);
            }
            // error
            else {
              let res = intercepted_response;
              if (response.status != 400){
                if (this.state == 'canceled'){
                  res = {canceled: true};
                }
              }
              this.state = 'error';
              response.json = res;
              data_reject(res);
              request_reject(response);
            }
          });
      }, (error) => {
        let res = error;
        if (this.state == 'canceled'){
          res = {canceled: true}
        } else {
          this.state = 'error'
        }
        data_reject(res)
        request_reject(error);
      });

    });
  });

  return this
}

export default ApiFetchRequest
