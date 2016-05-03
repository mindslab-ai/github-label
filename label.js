/**
 *
 * @class Project
 * @property {string} name
 * @property {object} labels
 * @property {Array<string>} components
 * @property {Array<string>} versions
 *
 * @object labelConfig
 * @property {string} versionColor
 * @property {string} componentColor
 * @property {object} commonLabels
 * @property {Array<Project>} projects
 */
var labelConfig = require('./labels.json');
var apicall = require('./apicall');
var async = require('async');
var querystring = require('querystring');

var githubApiUrlPrefix = 'https://api.github.com/repos/';

var githubParam = require('./github-param.json');

// ====================================================================
// MAKE GITHUB LABEL
// ====================================================================

function makeGithubLabel(name, label, cb) {
  var url = githubApiUrlPrefix + githubParam.org + '/' + name + '/labels';


  apicall.urlRequest(url, {
    method: 'POST',
    headers: {
      Authorization: githubParam.token
    },
    params: label
  }, function(body, res) {

    var result = null;

    // console.log('STATUS: ' + res.statusCode);

    res.setEncoding('utf8');

    if (body) {
      result = JSON.parse(body);
    }

    if (res.statusCode === 201) {
      console.log('C');
      cb(null, result);
    } else if (res.statusCode === 422) {

      //console.log('<<<<<', result);

      var updateUrl = url + '/' + querystring.escape(label.name);
      apicall.urlRequest(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: githubParam.token
        },
        params: label
      }, function(body, res) {
        if ( res.statusCode === 200) {
          res.setEncoding('utf8');

          if (body) {
            result = JSON.parse(body);
          }

          //console.log('body', result);

          console.log('U');
          cb(null, result);
        } else {
          console.log(updateUrl);
          console.log(res.statusCode, res.headers, res.body);
        }
      });

    } else {
      console.log('X');
      cb(result, null);
    }

  });

}


/**
 * 실지로 레이블을 만들어 낸다.
 *
 */
function makeLabels(name, labels, cb) {
  var index = 0;

  console.log(name, labels.length);

  async.whilst(
    function() {
      return index < labels.length;
    },
    function(callback) {
      var label = labels[index];
      makeGithubLabel(name, label, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          console.log(">>>", result);
        }
        index++;
        setTimeout(callback, 5);
      });
    },
    function(err) {
      if (err)
        cb(err, null);
      else
        cb(null, index);
    }
  );
}

var makeAllLabels = function(callback) {

  var count = 0;

  async.whilst(
    function() {
      return count < labelConfig.projects.length;
    },
    function(callback) {
      var project = labelConfig.projects[count];

      console.log('<><> Calling for', project.name);
      makeLabels(project.name, project.labels, function(err, result) {
        if (result) {
          console.log('<><> Done for', project.name);
          count++;
        }
        else if (err) {
          console.log('<><> FAILed in', project.name);
          count++;
        }

        setTimeout(callback, 0);
      });
    },
    function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, 'MAKE ALL LABELS')
      }
    }
  );
};

// ====================================================================
// BUILD LABEL ARRAY
// ====================================================================


/**
 * 정상적인 컬러 값인지 검사한다.
 *
 * @param {string} color 색상값
 * @returns {boolean} 색상값이면 true 를 반환한다.
 */
function isValidHexColor(color) {
  return (typeof color === 'string') &&
         color.length === 7 && !isNaN(parseInt(color.substr(1), 16));
}

/**
 * buildLabels - 해당 프로젝트에 저장해야할 모든 Label 들을 계산해 낸다.
 *
 * @param {Project} project 프로젝트 정보
 * @param {Object} labelConfig config 에서 가져온 labelConfig
 *
 * @returns {Array<Object>} 모든 레이블들의 배열을 반환한다.
 */
function buildLabels(project, labelConfig) {
  var ret = [];

  for (var key in labelConfig.commonLabels) {
    if (labelConfig.commonLabels.hasOwnProperty(key)) {
      var color = labelConfig.commonLabels[key];
      if (!isValidHexColor(color)) {
        console.log('Invalid color value: ', color);
        return null;
      }
      ret.push({name: key, color: color.substr(1)});
    }
  }

  if (!isValidHexColor(labelConfig.componentColor)) {
    console.log('Invalid color value: ', labelConfig.componentColor);
    return null;
  }
  if (!isValidHexColor(labelConfig.versionColor)) {
    console.log('Invalid color value: ', labelConfig.versionColor);
    return null;
  }

  project.components.forEach(function(comp) {
    ret.push({
      name: 'comp: ' + comp,
      color: labelConfig.componentColor.substr(1)
    });
  });

  project.versions.forEach(function(ver) {
    ret.push({
      name: 'v: ' + ver,
      color: labelConfig.versionColor.substr(1)
    });
  });

  for (var key in project.labels) {
    if (project.labels.hasOwnProperty(key)) {
      var color = project.labels[key];
      if (!isValidHexColor(color)) {
        console.log('Invalid color value: ', color);
        return null;
      }
      ret.push({name: key, color: color.substr(1)});

    }
  }

  // console.log('project: ', project.name, '\n', ret);

  return ret;
}

/**
 *
 * @param {Function} callback 실패할 경우에는 에러, 성공할 경우에는 메시지를 전송한다.
 */
var buildAllLabels = function(callback) {
  labelConfig.projects.forEach(function(project) {
    var labels = buildLabels(project, labelConfig);
    if (labels === null) {
      callback("invalid color", null);
    }
    project.labels = labels;
  });

  // console.log('>>>', 'BUILT ALL LABELS DONE!');


  callback(null, 'BUILD ALL LABELS');
};



// ====================================================================
// BUILD LABEL ARRAY
// ====================================================================

/**
 * 메인 호출
 *
 * 레이블을 각 프로젝트별로 먼저 컴파일한다.
 * 빌드된 레이블을 순차적으로 호출한다.
 */
function main() {

  async.series([
    buildAllLabels,
    makeAllLabels
  ], function(err, result) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.log(result);
  });
}

main();
