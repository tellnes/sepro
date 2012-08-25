var sepro = require('sepro')
  , connect = require('connect')
  , seaport = require('seaport')
  , uuid = require('node-uuid')

var app = sepro()

// Add x-sepro-id to headers
app.use(sepro.uuid( uuid.v4 ))

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
