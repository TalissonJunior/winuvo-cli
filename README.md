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

Create a new project

```sh
winuvo new project-name --connectionString="server:localhost;port:3306;database:db;user:root;password:root"
```

Generate model, repository, business and controllers

#### Synopsis
```sh
winuvo generate <type> <name> 
```

#### Details
Automatically create components for winuvo web api(dotnet core) project.

The given name is normalized into an appropriate naming convention. For example, winuvo generate repository user creates a repository interface by the name of IUserRepository in ./Repository/Interfaces and a repository by the name of UserRepository in ./Repository/Repositories

| Input        | Description   | Required?       
| ------------- | -------------| -------------
| ```type```      | The type of generator (e.g. model, repository, business, controller, all) | true
| ``name``    | The name of your component  | true 
| ``--model``    | The name of your model, if not set it will use the component name | false 
| ``--table``    | The name of your table, if not set it will use the component name| false 

**Note that:**

 * The **"--table" flag** will only work for **type** "model" and "all";
 * The **"--model" flag** will not work for **type** "model";

#### Examples

```sh
winuvo generate model user --table="tb_user"

winuvo generate repository users --model="user"

winuvo generate business users --model="user"

winuvo generate controller users --model="user"

winuvo generate all users --model="user" --table="tb_user"
```

### Database Rules

To make sure that **winuvo-cli** maps all your tables with a great perfomance , we have set some rules for database.

 1. The first character must be a letter

    Ex: Ex: Use **user**, not ~~**4ser**~~

 2. Avoid suffix or prefix table with **tb**

    Ex: Ex: Use **user**, not ~~**tb_user**~~

 3. Underscores separate words. Object name that are comprised of multiple words should be separated by underscores (ie. snake case). This includes tables, views, column, and everything else too.

    Ex: Use **word_count** or **team_member_id**, not  ~~**wordcount**~~ or ~~**wordCount**~~.
 
 4. Tables that have relation with others table are required to have a **foreign_key**, Otherwise the relation won´t be map;


### Foreign keys name and object

Winuvo will generate a name for the object of your foreign key based on the foreign key name,
you can check above the words that will not be consider when generating the name:


| Description       | foreign key value   | foreign key  output object name    
| ------------- | -------------| -------------
| Separated words with length less or equal than 2  | fk_user_id | user
| Separated words starting with number   | 1fk_user_id  | user 
| Entirely numeric | 12323_user_id | user 
| All the characters as vowels | aeiou_user_id | user 
| All characters as consonants | cpf_user_id | user 
| All of the previous options | 1_fk_cpf_user_tt_aaa | user 


### Libraries

Winuvo-cli has some built in libraries, in winuvo-cli a library is a set of common components that are frequently used in projects, for example JWToken Authentication, we listed below the available libraries.

| Name       | description   | command    
| ------------- | -------------| -------------
| JWTAuth  | JSON-based open standard (RFC 7519) for creating access tokens that assert some number of claims | ```winuvo library add JWTAuth```

## Development 

### Prerequisites

Node.js 
 
>First install [Node.js](https://nodejs.org/), recomended to download any stable version above 8.11.1

### Fluxogram
[winuvo new project](https://www.lucidchart.com/invitations/accept/fbb425f3-5a90-436d-b892-3af166c0f30d)


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




