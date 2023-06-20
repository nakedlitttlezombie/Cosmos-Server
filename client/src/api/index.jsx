import * as _auth from './authentication';
import * as _users from './users';
import * as _config from './config';
import * as _docker from './docker';
import * as _market from './market';

import * as authDemo from './authentication.demo';
import * as usersDemo from './users.demo';
import * as configDemo from './config.demo';
import * as dockerDemo from './docker.demo';
import * as indexDemo from './index.demo';
import * as marketDemo from './market.demo';

import wrap from './wrap';

export let CPU_ARCH = 'amd64';
export let CPU_AVX = true;

export let HOME_BACKGROUND;
export let PRIMARY_COLOR;
export let SECONDARY_COLOR;

export let FIRST_LOAD = false;

let getStatus = (initial) => {
  return wrap(fetch('/cosmos/api/status', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }), initial)
  .then(async (response) => {
    CPU_ARCH = response.data.CPU;
    CPU_AVX = response.data.AVX;
    HOME_BACKGROUND = response.data.homepage.Background;
    PRIMARY_COLOR = response.data.theme.PrimaryColor;
    SECONDARY_COLOR = response.data.theme.SecondaryColor;
    FIRST_LOAD = true;
    return response
  }).catch((response) => {
    const urlSearch = encodeURIComponent(window.location.search);
    const redirectTo = (window.location.pathname + urlSearch);

    if(response.status != 'OK') {
      if( 
          window.location.href.indexOf('/cosmos-ui/newInstall') == -1 && 
          window.location.href.indexOf('/cosmos-ui/login') == -1 && 
          window.location.href.indexOf('/cosmos-ui/loginmfa') == -1 && 
          window.location.href.indexOf('/cosmos-ui/newmfa') == -1 &&
          window.location.href.indexOf('/cosmos-ui/register') == -1 &&
          window.location.href.indexOf('/cosmos-ui/forgot-password') == -1) {
        if(response.status == 'NEW_INSTALL') {
            window.location.href = '/cosmos-ui/newInstall';
        } else if (response.status == 'error' && response.code == "HTTP004") {
            window.location.href = '/cosmos-ui/login?redirect=' + redirectTo;
        } else if (response.status == 'error' && response.code == "HTTP006") {
            window.location.href = '/cosmos-ui/loginmfa?redirect=' + redirectTo;
        } else if (response.status == 'error' && response.code == "HTTP007") {
            window.location.href = '/cosmos-ui/newmfa?redirect=' + redirectTo;
        }
      } else {
        return "nothing";
      }
    }
  });
}

let isOnline = () => {
  return fetch('/cosmos/api/status', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(async (response) => {
    let rep;
    try {
      rep = await response.json();
    } catch {
      throw new Error('Server error');
    }
    if (response.status == 200) {
      return rep;
    } 
    const e = new Error(rep.message);
    e.status = response.status;
    throw e;
  });
}

let newInstall = (req, onProgress) => {
  if(req.step == '2') {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req)
    };
  
    return fetch('/cosmos/api/newInstall', requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
  
        // The response body is a ReadableStream. This code reads the stream and passes chunks to the callback.
        const reader = response.body.getReader();
  
        // Read the stream and pass chunks to the callback as they arrive
        return new ReadableStream({
          start(controller) {
            function read() {
              return reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }
                // Decode the UTF-8 text
                let text = new TextDecoder().decode(value);
                // Split by lines in case there are multiple lines in one chunk
                let lines = text.split('\n');
                for (let line of lines) {
                  if (line) {
                    // Call the progress callback
                    onProgress(line);
                  }
                }
                controller.enqueue(value);
                return read();
              });
            }
            return read();
          }
        });
      }).catch((e) => {
        console.error(e);
      });
  } else {
    return wrap(fetch('/cosmos/api/newInstall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req)
    }))
  }
}

let checkHost = (host) => {
  return fetch('/cosmos/api/dns-check?url=' + host, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(async (response) => {
    let rep;
    try {
      rep = await response.json();
    } catch {
      throw new Error('Server error');
    }
    if (response.status == 200) {
      return rep;
    } 
    const e = new Error(rep.message);
    e.status = response.status;
    e.message = rep.message;
    throw e;
  });
}

let getDNS = (host) => {
  return fetch('/cosmos/api/dns?url=' + host, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(async (response) => {
    let rep;
    try {
      rep = await response.json();
    } catch {
      throw new Error('Server error');
    }
    if (response.status == 200) {
      return rep;
    } 
    const e = new Error(rep.message);
    e.status = response.status;
    e.message = rep.message;
    throw e;
  });
}

let uploadBackground = (file) => {
  const formData = new FormData();
  formData.append('background', file);
  return wrap(fetch('/cosmos/api/background', {
    method: 'POST',
    body: formData
  }));
};

const isDemo = import.meta.env.MODE === 'demo';

let auth = _auth;
let users = _users;
let config = _config;
let docker = _docker;
let market = _market;

if(isDemo) {
  auth = authDemo;
  users = usersDemo;
  config = configDemo;
  docker = dockerDemo;
  market = marketDemo;
  getStatus = indexDemo.getStatus;
  newInstall = indexDemo.newInstall;
  isOnline = indexDemo.isOnline;
  checkHost = indexDemo.checkHost;
  getDNS = indexDemo.getDNS;
  uploadBackground = indexDemo.uploadBackground;
}

export {
  auth,
  users,
  config,
  docker,
  market,
  getStatus,
  newInstall,
  isOnline,
  checkHost,
  getDNS,
  uploadBackground
};