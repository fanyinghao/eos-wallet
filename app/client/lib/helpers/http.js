function makeRequest(opts) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(opts.method, opts.url);
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    if (opts.headers) {
      Object.keys(opts.headers).forEach(function(key) {
        xhr.setRequestHeader(key, opts.headers[key]);
      });
    }
    var params = opts.params;
    // We'll need to stringify if we've been given an object
    // If we have a string, this is skipped.
    if (params && typeof params === "object") {
      params = JSON.stringify(params);
    }
    xhr.send(params);
  });
}

function pingRequest(option) {
  return new Promise(function(resolve, reject) {
    var ping, requestTime, responseTime;

    requestTime = new Date().getTime();
    makeRequest(option).then(
      res => {
        responseTime = new Date().getTime();
        ping = Math.abs(requestTime - responseTime);

        resolve(ping);
      },
      err => {
        reject(err);
      }
    );
  });
}

export const get = opts => makeRequest(Object.assign({ method: "get" }, opts));
export const ping = opts => pingRequest(opts);
