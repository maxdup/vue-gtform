import { requestIntercepts, responseIntercepts } from './apiInterceptors';

function responseData(xhr){
  return new Promise((resolve, reject) => {
    if (xhr.getResponseHeader('Content-Type').startsWith('application/json')){
      resolve(JSON.parse(xhr.response));
    } else {
      resolve(xhr.responseText);
    }
  });
}

function ApiXmlHttpRequest(url, config, interceptors){

  let reqConfig = requestIntercepts(url, config, interceptors);

  let xhr = new XMLHttpRequest();
  xhr.open(reqConfig.method, url)
  for (const [key, value] of Object.entries(reqConfig.headers)) {
    xhr.setRequestHeader(key, value);
  }

  this.state = 'pending';

  this.cancel = () => {
    this.state = 'canceled';
    xhr.abort();
  }

  xhr.send(reqConfig.body)

  // fetch promise
  this.response = new Promise((request_resolve, request_reject) => {

    // data promise
    this.promise = new Promise((data_resolve, data_reject) => {

      xhr.onload = () => {
        console.log('XHR onload', xhr);

        let dataPromise = responseData(xhr);

        responseIntercepts(url, reqConfig, interceptors, xhr.status, dataPromise)
          .then((intercepted_response) => {
            // error
            if (xhr.status >= 400){
              this.state = 'error';
              let res = intercepted_response;
              if (xhr.status != 400){
                if (this.state == 'canceled'){
                  this.state = 'error';
                  res = {canceled: true};
                }
              }
              data_reject(res);
              return
            }

            // success
            if (xhr.status >= 200 &&
                xhr.status < 300){
              this.state = 'complete'
              data_resolve(intercepted_response);
            } else {
              this.state = 'error'
              data_reject(intercepted_response);
            }

          });
        request_resolve(xhr.response);
      }

      xhr.onerror = () => {
        console.log('XHR onerror', xhr);
        data_reject();
        request_reject(xhr);
      }

      xhr.onabort = () => {
        console.log('XHR onabort', xhr);
        data_reject({canceled: true});
        request_reject(xhr);
      }

      xhr.ontimeout = () => {
        console.log('XHR ontimeout', xhr);
        data_reject();
        request_reject(xhr);
      }

    });
  });
  return this
}

export default ApiXmlHttpRequest
