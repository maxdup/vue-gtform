import ApiFetchRequest from './apiFetchRequest';
import ApiXmlHttpRequest from './apiXmlHttpRequest';

let ApiRequest = {'fetch': ApiFetchRequest,
                  'xhr': ApiXmlHttpRequest}


let transformUrl = (resconf, payload, urldata, method) => {
  let url = resconf.url;
  let payload_populator = payload;
  if (resconf.paramsAt && resconf.paramsAt.startsWith('@')){
    let at = resconf.paramsAt.substring(1);
    if (payload && payload[at]){
      payload_populator = payload[at];
    }
  }
  let url_populator = Object.assign({}, payload_populator, urldata);

  let matches = url.match(/\{(.*?)\}/g);
  if (!matches){ return url }
  matches.forEach((str,i,arr) => { arr[i] = arr[i].replace(/[{}]/g, ""); });
  let urlvalues = {};
  matches.forEach((m) => {
    if (url_populator && url_populator[m] !== undefined){
      urlvalues[m] = url_populator[m];
      if (method == 'GET' ||
          method == 'DELETE'){
        delete payload_populator[m];
      }
    }
  });
  matches.forEach((m) => {
    if (urlvalues[m] === undefined){ urlvalues[m] = ''; }
    url = url.replace("{"+m+"}", urlvalues[m]);
  });
  return url
}

let jsonToFormData = (jsObject) => {
  let formData = new FormData();

  let recurseJson = (jsObj, prefix, suffix) => {
    let _prefix = prefix || '';
    let _suffix = suffix || '';
    for (let k in jsObj) {
      if (jsObj[k] instanceof File || typeof jsObj[k] !== "object"){
        formData.append(_prefix + k + _suffix, jsObj[k])
      } else {
        recurseJson(jsObj[k], _prefix + k + '[', _suffix + ']')
      }
    }
  }
  recurseJson(jsObject);
  return formData
}

let make_request = (method, type, payload, urldata, headers, resConfig, interceptors) => {
  if (resConfig.methods.indexOf(method) == -1){
    console.warn("Method " + method + " isn't supported by the API. " +
                 " Verify API configuration");
    return null;
  };
  let url = transformUrl(resConfig, payload, urldata, method);

  let fetch_config = { method: method, headers: headers }

  if (payload && (method == 'POST' || method == 'PATCH')){
    if (type == 'fetch'){
      fetch_config.headers['Content-Type'] = 'application/json;charset=UTF-8';
      fetch_config.body = JSON.stringify(payload);
    } else if (type == 'xhr'){
      fetch_config.body = jsonToFormData(payload);
    } else {
      fetch_config.headers['Content-Type'] = 'text/plain';
      fetch_config.body = payload.toString();
    }
  }
  if (payload && (method == 'GET' || method == 'DELETE')){
    let urlParams = {}
    for (const [key, value] of Object.entries(payload)) {
      let at = null;
      if (resConfig.paramsAt){
        at = resConfig.paramsAt.substring(1);
      }
      if (value !== undefined && key != at){
        urlParams[key] = value;
      }
    }

    let paramsStr = Object.entries(urlParams).map(e => e.join('=')).join('&')
    if (paramsStr){
      url += '?' + paramsStr;
    }
  }
  return new ApiRequest[type](url, fetch_config, interceptors);
}

function ApiResource(res_config, api){

  this._config = res_config

  this.interceptors = [];

  this.addInterceptor = (interceptor) => {
    this.interceptors.push(interceptor);
  };
  this.removeInterceptor = (interceptor) => {
    const index = this.interceptors.indexOf(interceptor);
    if (index > -1) {
      this.interceptors.splice(index, 1);
    }
  };

  let request = (method, httpApi, payload, urldata, additionalHeaders) => {
    return make_request(method, httpApi, payload, urldata,
                        api.mergeHeaders(additionalHeaders),
                        this._config, this.interceptors);
  }

  this.fetchGet = (payload, urldata, headers) => { return request(
    'GET', 'fetch', payload, urldata, headers)}
  this.fetchSave = (payload, urldata, headers) => { return request(
    'POST', 'fetch', payload, urldata, headers)}
  this.fetchUpdate = (payload, urldata, headers) => { return request(
    'PATCH', 'fetch', payload, urldata, headers)}
  this.fetchDelete = (payload, urldata, headers) => { return request(
    'DELETE', 'fetch', payload, urldata, headers)}

  this.xhrGet = (payload, urldata, headers) => { return request(
    'GET', 'xhr', payload, urldata, headers)}
  this.xhrSave = (payload, urldata, headers) => { return request(
    'POST', 'xhr', payload, urldata, headers)}
  this.xhrUpdate = (payload, urldata, headers) => { return request(
    'PATCH', 'xhr', payload, urldata, headers)}
  this.xhrDelete = (payload, urldata, headers) => { return request(
    'DELETE', 'xhr', payload, urldata, headers)}

  this.get = (payload, urldata, headers) => { return request(
    'GET', api.preferedHttpApi, payload, urldata, headers)}
  this.save = (payload, urldata, headers) => { return request(
    'POST', api.preferedHttpApi, payload, urldata, headers)}
  this.update = (payload, urldata, headers) => { return request(
    'PATCH', api.preferedHttpApi, payload, urldata, headers)}
  this.delete = (payload, urldata, headers) => { return request(
    'DELETE', api.preferedHttpApi, payload, urldata, headers)}

  return this
}

function Api(apiConfig, httpApi){
  this.config = apiConfig;
  this.preferedHttpApi = httpApi;

  this.defaultHeaders = {
    Accept: 'application/json, text/plain, */*',
  }
  this.setDefaultHeader = (header, value) => {
    this.defaultHeaders[header] = value;
  }
  this.mergeHeaders = (headers) => {
    let fullHeaders = Object.assign({}, this.defaultHeaders, headers);
    Object.keys(fullHeaders).forEach((key) => {
      fullHeaders[key] === undefined ? delete fullHeaders[key] : {}
    });
    return fullHeaders
  }

  Object.keys(this.config).forEach((key) => {
    let path = key.split('.');
    let target = this;
    while (path.length > 0){
      let child = path.shift();
      if (!target[child]) {
        if (path.length == 0){
          target[child] = new ApiResource(this.config[key], this);
        } else {
          target[child] = {}
          target = target[child];
        }
      } else {
        target = target[child];
      }
    }
  });

  this.get = (url, additionalHeaders) => {
    let config = { method: 'GET',
                   headers: this.mergeHeaders(additionalHeaders)}
    return new ApiRequest[this.preferedHttpApi](url, config);
  }
  this.head = (url, additionalHeaders) => {
    let headers = this.mergeHeaders(additionalHeaders)
    let config = { method: 'HEAD', headers: headers}
    return new ApiRequest[this.preferedHttpApi](url, config);
  }
  this.post = (url, body, additionalHeaders) => {
    let headers = this.mergeHeaders(additionalHeaders)
    if (body instanceof FormData){
      delete headers['Content-Type'];
    } else {
      body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }
    let config = { method: 'POST', body: body, headers: headers}
    return new ApiRequest[this.preferedHttpApi](url, config);
  }
  this.patch = (url, body, additionalHeaders) => {
    let headers = this.mergeHeaders(additionalHeaders)
    if (body instanceof FormData){
      headers['Content-Type'] = undefined;
    } else {
      body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }
    let config = { method: 'PATCH', body: body, headers: headers}
    return new ApiRequest[this.preferedHttpApi](url, config);
  }
  this.delete = (url, additionalHeaders) => {
    let config = { method: 'DELETE',
                   headers: this.mergeHeaders(additionalHeaders)}
    return new ApiRequest[this.preferedHttpApi](url, config);
  }
  return this
}

export default Api
