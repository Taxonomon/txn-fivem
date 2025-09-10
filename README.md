# Taxonomon's FiveM Hotlap Server Resource

This repository contains all client and server code required for my hotlap server,
bundled into a single FiveM server resource.

The entire resource is written in TypeScript, mainly as a personal goal to get
more familiar with the language and JavaScript.

## Project structure

### Packages

Instead of splitting everything into separate resources, the entire resource is
bundled at once and split into individual packages.

Each package includes separate directories for client and server code. Although
FiveM suggests adding shared scripts as well, which stream their source code to
both the client and the server, this project does not make use of this feature.
Due to the nature of bundling TypeScript code into JavaScript, all supposedly
shared code already gets transpiled and added to the respective scripts, making
shared scripts redundant.

This is why the main package structure for each package splits into

- client
- server
- common

whereas common holds all code that would otherwise land in a shared script.

Here's a rundown of all current packages and their responsibilities:

#### main:

At its core an empty package, used to import all other packages. This
is needed so that the bundler can include all packages when bundling the
TypeScript code into JavaScript, which will be what's going to be interpreted
by the FXServer.

#### persistence:

Takes care of reading and writing to the persistence context, in this case a
separate backend HTTP/REST API managing a database. The managed data includes, 
but isn't limited to, hotlap times, car setups, checkpoint deltas, and much more. 
The individual packages utilize the persistence package to store and retrieve 
the data they need from the database via the HTTP/REST API.

#### logging:

A utility package to standardize console logging for both the client and the
server. Other packages utilize the logging package to log messages to both parts,
and to send client messages to the server and vice versa.

#### util:

A package full of general-purpose functionalities, used by a variety of packages.

#### ui:

Contains a single React application which manages all UI elements. FiveM provides
the so-called NUI ("new UI"), which essentially means a UI running in FiveM's
embedded Chromium browser. This enables developers to use modern UI frameworks
to build ingame UIs for their servers. However, only a single entrypoint to the
UI can be provided per resource, and since this project is one giant resource in 
itself, the UI gets bundled into a singular package.

#### track:

Separate from the hotlap package, the track package focuses solely on the track
and everything around and about it, from parsing the raw R* JSON into a format
usable by the resource, to placing checkpoint holographs and blips whenever the
hotlap package demands it.

#### hotlap:

The hotlap package manages the state of a client's hotlap, including the track,
car, weather, traffic and the checkpoint and lap times driven.

#### vehicle:

Manages everything evolving around the client's current vehicle, including 
spawning and despawning it, and changing and persisting the client's
individual vehicle configurations.

#### traffic:

Handles traffic and npc spawn behavior.

#### weather:

Controls the state of the client's weather.

## TODOs

- document development environment
- document code and structure conventions
- document build and deployment process
