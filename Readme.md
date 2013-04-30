# Sepro


Sepro is an http proxy that is [connect](https://github.com/senchalabs/connect/) compatible. It has a number of middleware that can route the request to an backend without having to configure it. It also supports sticky session either based on cookies or remote address.

Sepro is based on [NodeJitsu](https://github.com/nodejitsu)´s [http-proxy](https://github.com/nodejitsu/node-http-proxy) library.


## Example

```js
var sepro = require('sepro')
  , seaport = require('seaport')

var app = sepro()

app.use(sepro.stickyCookie())

app.use(sepro.haibu({ endpoint: 'http://haibu.example.com:9002/'
                    , authToken: 'keyboard cat'
                    , serverName: 'haibu.sepro.exaple.com'
                    } ))

app.use(sepro.seaport({ ports: seaport.connect(7000)
                      , serverName: 'seaport.sepro.exaple.com'
                      } ))

app.use(sepro.apache( '/etc/apache2/httpd.conf' ))

app.listen(8080)
```

## Install

    npm install sepro

## Licence

MIT
