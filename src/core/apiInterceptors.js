let requestIntercepts = (url, request_config, interceptors) => {
  if (!interceptors){ return request_config; }
  for (let i = 0; i < interceptors.length; i++){
    if (interceptors[i].request &&
        interceptors[i].requestMethods &&
        interceptors[i].requestMethods.indexOf(request_config.method) != -1){
      request_config = interceptors[i].request(request_config);
    }
  }
  return request_config;
}

let responseIntercepts = (url, response_config, interceptors, response, response_promise) => {
  if (!interceptors){ return response_promise; }
  return new Promise((resolve, reject) => {
    response_promise.then((data) => {
      for (let i = 0; i < interceptors.length; i++){
        if (interceptors[i].response &&
            interceptors[i].responseMethods &&
            interceptors[i].responseMethods.indexOf(response_config.method) != -1){
          data = interceptors[i].response(url, response_config, response, data);
        }
      }
      resolve(data);
    });
  });
}

export { requestIntercepts, responseIntercepts }
