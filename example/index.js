var sepro = require('../')
  , seaport = require('seaport')
  , path = require('path')

var app = sepro()

app.use(sepro.stickyCookie())

app.use(sepro.haibu({ endpoint: 'http://haibu.example.com:9002/'
                    , authToken: 'keyboard cat'
                    , serverName: 'haibu.sepro.exaple.com'
                    } ))

app.use(sepro.seaport({ ports: seaport.connect(7000)
                      , serverName: 'seaport.sepro.exaple.com'
                      } ))


app.use(sepro.iniFile( path.resolve(__dirname, './routes.ini') ))

app.use(sepro.apache( '/etc/apache2/httpd.conf' ))

app.listen(8080)
