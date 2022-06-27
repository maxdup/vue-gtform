function debounce(func, delay=100){
  /* "debounce" delays a function call until
     no call has been made for a period of time.
     the timer is refreshed upon each call.
  */

  let pending = null;

  return function(){
    let args = arguments;
    return new Promise((resolve, reject) => {

      function run(){
        let ret = func.apply(null, args);
        ret = ret ? ret.promise || ret : ret;
        if (ret && ret.then){
          ret.then(resolve, reject);
        } else {
          resolve(ret);
        }
        pending = null;
      }
      clearTimeout(pending);
      pending = setTimeout(run, delay);
    });
  }

}
function throttle(func, delay=250){
  /* Will execute a function and initiate a timer. Subsequent
     function calls will be put on hold until the timer is complete.
     Upon the timer completing, if at least one call had
     been made, it will finally run (and reinitiate a timer).
  */

  let pending = null;
  let lock = false;

  function run(f){
    f();
    lock = setTimeout(unlock, delay);
  }

  function unlock(){
    if (typeof(pending) == 'function'){
      run(pending);
      pending = null;
    }
    lock = false;
  }

  return function(){
    let args = arguments;
    return new Promise((resolve, reject) => {
      let f = function(){
        let ret = func.apply(null, args);
        ret = ret ? ret.promise || ret : ret;
        if (ret && ret.then){
          ret.then(resolve, reject);
        } else {
          resolve(ret);
        }
      }

      if (lock){
        pending = f;
      } else {
        run(f);
      }
    });
  }

}
function latest(func){
  /* Tracks previous requests made through this function.
     If "latest" is called again while the previous
     request hasn't completed, we cancel it.
  */
  let pending = null;

  return function(){
    let args = arguments;

    let promise = new Promise((resolve, reject) => {

      function success(value){
        pending = null;
        resolve(value);
      }

      function error(err){
        if (err != '$cancel'){
          reject(err);
        }
        pending = null;
      }

      if (pending){
        if (pending.state == 'pending'){
          pending.cancel();
        }
      }

      pending = func.apply(null, args);
      let call = pending ? pending.promise || pending : pending;

      if (call){
        call.then(success, reject)
      }
    });
    return promise;

  }
}

export { debounce, throttle, latest }
