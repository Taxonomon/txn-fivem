fx_version 'cerulean'
game 'gta5'
node_version '22'

author 'https://github.com/Taxonomon'
description 'The full server resource for the hotlapping server.'
version '1.0.0'

client_scripts { 'src/client.js' }
shared_scripts { 'src/shared.js' }
server_scripts { 'src/server.js' }

ui_page 'static/ui/index.html'

files {
	'static/*',
	'static/ui/index.html',
	'static/ui/style.css',
	'static/ui/script.js',
	'static/ui/icon/*'
}
