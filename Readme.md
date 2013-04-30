# Sepro

Sepro is a http proxy which discovers where to proxy a request. It has a
number of middlewares which is looks for routing rules in their respective
source. It also supports sticky session either based on cookies or remote
address.

Internally is it using
[NodeJitsu](https://github.com/nodejitsu)´s
[node-http-proxy](https://github.com/nodejitsu/node-http-proxy)
library to proxy the requests.


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
