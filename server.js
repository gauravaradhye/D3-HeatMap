var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json())
app.use(express.static(__dirname));
app.post('/', function(request, response) {
    console.log(request.body.json_config)
    fs.writeFileSync("data.json", request.body.json_config);
    response.sendFile(__dirname + '/index.html');
});
app.listen('8000');
