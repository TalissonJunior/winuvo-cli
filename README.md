![Build Status](https://travis-ci.org/TalissonJunior/winuvo-cli.svg?branch=master)

# WINUVO-CLI

A command line interface to manager backend web api([.Net Core](https://github.com/dotnet/core)) and front end applications([Angular x "schematics"](https://angular.io/)), writting in [Nodejs](https://nodejs.org/en/) using [Typescript](https://www.typescriptlang.org/) 

The goal of this project is to pattern development by generating all of the backend and frontend from a single line of code, this will allow developers to create what users think that they are actually creating **"pages, design"**.

# Usage

Install winuvo-cli globally.
```sh
npm install winuvo -g
```

## Winuvo commands

Create a new project, the **--type** flag is a optional parameter, if not set it will use **full** as the default;

```sh
winuvo new <projectname>|<p>
--connectionString=server:localhost;port:3306;database:mydb;user:root;password:root
```

Generate model, repository, business and controllers

#### Synopsis
```sh
winuvo generate <type> <name> 
```

#### Details
Automatically create components for winuvo web api(dotnet core) project.

The given name is normalized into an appropriate naming convention. For example, winuvo generate repository user creates a repository interface by the name of IUserRepository in ./Repository/Interfaces and a repository by the name of UserRepository in ./Repository/Repositories

| Input        | Description          
| ------------- | -------------
| ```type```      | The type of generator (e.g. model, repository, business, controller)
| ``modelName``    | The name of the model of your database or the name of your model if used with --table flag.  


#### Examples

```sh
winuvo generate model user --table=tb_user

winuvo generate repository user

winuvo generate business user

winuvo generate controller user

winuvo generate all user --table=tb_user
```

### Fluxogram
[winuvo new project](https://www.lucidchart.com/invitations/accept/fbb425f3-5a90-436d-b892-3af166c0f30d)

## Development 

### Prerequisites

Node.js 
 
>First install [Node.js](https://nodejs.org/), recomended to download any stable version above 8.11.1


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

To debug the application, place a breakpoint and then:

```sh
npm run debug <command> <options>
```




