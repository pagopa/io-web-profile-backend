# io-web-profile-backend

This repository contains the code of the backend used by the io-web-profile web platform.

## Technologies
[![My Skills](https://skillicons.dev/icons?i=azure,nodejs,ts)](https://skillicons.dev)

This is Node.js Azure Function.
## Prerequisites
In order to run the ``io-web-profile-backend`` locally you need the following tool installed on your machine.

- ``Azure functions core tools``
- ``Node.js``
- ``yarn``

The preferred way to set up the local environment is using nodenv to manage Node.js installation and corepack (included with Node.js) to manage the installation of yarn.

## Structure

The project is structured as follows:

```
io-web-profile-backend
|-- .devops
|-- .github
|-- .vscode
|-- openapi
|-- docker
|-- utils
|   |-- cosmosdb.ts
|   |-- config.ts
|-- Function_01
|   |--__test__
|   |-- function.json
|   |-- handler.ts
|   |-- index.ts
|
|-- Function_02
|-- Function_..
|
|-- .env
|-- package.json
|-- docker-compose.yaml
|-- host.json
|-- local.settings.json
```
- `.devops`: This folder contains files related to the development and operations (DevOps) processes for the project.

- `.github`: This folder is related to GitHub-specific configuration.

- `.vscode`: This folder contain Visual Studio Code-specific configuration files.

- `openapi`: This folder contain OpenAPI specifications.

- `docker`: This folder contain Dockerfile(s).

- `utils`: This folder contains utility files that are likely used across different parts of the project.

  - `cosmosdb.ts`: Contains helper functions to work with Cosmos DB.

  - `config.ts`: Contains configuration settings for the application or service.

- `Function_01, Function_02, etc.`: These folders represent different functions, they contain the following files:

  - `__ test __`: This folder contain test files.
  - `function.json`: Configuration file specific to Azure Functions. It defines the function's bindings, triggers, and other settings.
  - `handler.ts`: File that contains the main logic for the function's execution.
  - `index.ts`: A File that exports the function's handler and is the entry point for the function.
- `.env`: Store environment variables that are specific to the backend application.

- `package.json`: Contains metadata about the project as well as dependencies and scripts for building, testing, and running the application.

- `docker-compose.yaml`: Docker Compose configuration file.
- `host.json`: Configuration file specific to Azure Functions. It contains global settings and configurations that apply to all functions in the project.

- `local.settings.json`: Configuration file specific to Azure Functions. It contains settings used when running the functions locally, such as local development environment connection strings and other configurations.

## ENV variables

The following table contains the required ENV variables that the function require

| Variable name                   | Description                                         | type   |
|---------------------------------|-----------------------------------------------------|--------|
| FF_API_ENABLED                  | Api Auth Mode (NONE, BETA, CANARY, ALL)             | string |
| BETA_TESTERS                    | Beta tester fiscal code separated by comma          | string,string,string,... |
| BEARER_AUTH_HEADER              | Req Auth Header Param where Bearer token is sotored | string|
| HUB_SPID_LOGIN_JWT_PUB_KEY      | Hub Spid Login JWT Public Key (token validation)    | string|
| HUB_SPID_LOGIN_JWT_ISSUER       | Hub Spid Login ISSUER                               | string|
| HUB_SPID_LOGIN_CLIENT_BASE_URL  | Hub Spid Login baseUrl                              | string|
