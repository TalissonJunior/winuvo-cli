![Build Status](https://travis-ci.org/TalissonJunior/wniuvo-cli.svg?branch=master)

# WINUVO-CLI

A command line interface to manager backend web api and front end applications, writting in [Nodejs](https://nodejs.org/en/) using [Typescript](https://www.typescriptlang.org/) 

### Prerequisites

Node.js 
 
>First install [Node.js](https://nodejs.org/), recomended to download any stable version above 8.11.1


## Winuvo commands
---
Generate a new project, the **--type** flag and **--connectionString** ara optional parameters, if not set it will use **full** as default type, and it will only create the base methods;

```sh
winuvo new <projectname>|<p> --type=full|example 
--connectionString=server:localhost;port=3306;database:db;user:root;password:root
```

## Development Hints
---

### Installing Dependencies


```sh
npm install 
```

### Linkin the application

In order to use **winuvo** commands from your terminal you will need to link it

```sh
npm run build or npm run watch
npm link 
```


### Running the project.


To serve the application and watch for changes use. 
```sh
npm run watch
```

To build the application:

```sh
npm run build
```

To debug the application, place a breakpoin and then:

```sh
npm run debug <command> <options>
```




