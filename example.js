var sepro = require('sepro')
  , connect = require('connect')
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
