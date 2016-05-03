var http = require('https');
var url = require('url');

/**
 * UrlReq - Wraps the http.request function making it nice for unit testing
 * APIs.
 *
 * @param  {string}   reqUrl   The required url in any form
 * @param  {Object}   options  An options object (this is optional)
 * @param  {Function} cb       This is passed the 'res' object from your
 *   request
 */
exports.urlRequest = function(reqUrl, options, cb) {

  if (typeof options === 'function') {
    cb = options;
    options = {};
  } // no options passed in
  // parse url to chunks
  reqUrl = url.parse(reqUrl);
  // http.request settings
  var settings = {
    host: reqUrl.hostname,
    port: reqUrl.port || 443,
    path: reqUrl.pathname,
    auth: options.auth || '',
    headers: options.headers || {},
    method: options.method || 'GET'
  };

  // if there are params:
  if (options.params) {
    options.params = JSON.stringify(options.params);
    // console.log(options.params);
    settings.headers['User-Agent'] = 'Node.JS HTTP Client';
    settings.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    settings.headers['Content-Length'] = options.params.length;
  }
  //console.log(settings);
  //console.log(options);


  // MAKE THE REQUEST
  var req = http.request(settings);
  // if there are params: write them to the request
  if (options.params) {
    req.write(options.params);
  }

  // end the request
  req.end();

  // when the response comes back
  req.on('response', function(res) {
    res.body = '';
    res.setEncoding('utf-8');
    // concat chunks
    res.on('data', function(chunk) {
      //console.log('chunk', chunk);
      res.body += chunk;
    });
    // when the response has finished
    res.on('end', function() {
      // fire callback
      cb(res.body, res);
    });
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    console.log(e.stack);
    cb(e, null);
  });

};

