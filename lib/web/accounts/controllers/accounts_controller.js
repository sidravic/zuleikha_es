module.exports.index = {
    description: 'Root URL',
    handler: function(request, response){
        response.view('index');
    }
}