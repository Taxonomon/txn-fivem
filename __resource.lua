fx_version 'cerulean'
game 'gta5'
node_version '22'

author 'https://github.com/Taxonomon'
description 'The full server resource for the hotlapping server.'
version '1.0.0'

client_scripts { 'src/client.js' }
shared_scripts { 'src/shared.js' }
server_scripts { 'src/server.js' }

files {
	'static/**.json',
	'static/**.yaml'
}
